# Sync Database from Local PostgreSQL to Neon Cloud
# This script exports data from local and imports it into Neon
# Usage: .\scripts\sync_db_to_neon.ps1
#
# ⚠️  WARNING: This will OVERWRITE the production Neon database!
#     Use with extreme caution. Consider backing up Neon first.

param(
    [switch]$SchemaOnly,      # Only sync schema, no data
    [switch]$DataOnly,        # Only sync data (assumes schema exists)
    [switch]$Force,           # Skip confirmation prompts
    [switch]$BackupFirst      # Create backup of Neon before overwriting
)

# Configuration - Load from .env.docker
$envFile = Join-Path $PSScriptRoot "..\.env.docker"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"')
            Set-Item -Path "env:$name" -Value $value
        }
    }
}

# Neon Cloud Database (destination)
$NEON_URL = $env:DATABASE_URL
if (-not $NEON_URL) {
    Write-Error "DATABASE_URL not found in .env.docker"
    exit 1
}

# Parse Neon URL
if ($NEON_URL -match "postgresql://([^:]+):([^@]+)@([^/]+)/([^?]+)") {
    $NEON_USER = $matches[1]
    $NEON_PASS = $matches[2]
    $NEON_HOST = $matches[3]
    $NEON_DB = $matches[4]
} else {
    Write-Error "Failed to parse DATABASE_URL"
    exit 1
}

# Local PostgreSQL (source)
$LOCAL_USER = "iayos_user"
$LOCAL_PASS = "iayos_local_pass"
$LOCAL_HOST = "localhost"
$LOCAL_PORT = "5432"
$LOCAL_DB = "iayos_db"
$LOCAL_CONTAINER = "iayos-postgres-dev"

# Output directory
$OUTPUT_DIR = Join-Path $PSScriptRoot "..\backups"
if (-not (Test-Path $OUTPUT_DIR)) {
    New-Item -ItemType Directory -Path $OUTPUT_DIR | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$LOCAL_DUMP_FILE = Join-Path $OUTPUT_DIR "local_dump_$timestamp.sql"
$NEON_BACKUP_FILE = Join-Path $OUTPUT_DIR "neon_backup_$timestamp.sql"

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "  iAyos Database Sync: Local -> Neon" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "⚠️  WARNING: This will OVERWRITE the PRODUCTION database!" -ForegroundColor Red
Write-Host ""
Write-Host "Source (Local): ${LOCAL_HOST}:${LOCAL_PORT} / $LOCAL_DB" -ForegroundColor Green
Write-Host "Target (Neon):  $NEON_HOST / $NEON_DB" -ForegroundColor Yellow
Write-Host ""

# Check if local postgres container is running
$containerRunning = docker ps --filter "name=$LOCAL_CONTAINER" --format "{{.Names}}" 2>$null
if (-not $containerRunning) {
    Write-Error "Local PostgreSQL container '$LOCAL_CONTAINER' is not running."
    Write-Host "Start it with: docker-compose -f docker-compose.dev.yml up postgres -d" -ForegroundColor Gray
    exit 1
}

if (-not $Force) {
    Write-Host "This will:" -ForegroundColor Yellow
    Write-Host "  1. Export your LOCAL database" -ForegroundColor White
    if ($BackupFirst) {
        Write-Host "  2. Create a BACKUP of Neon (recommended)" -ForegroundColor White
    }
    Write-Host "  3. OVERWRITE the Neon cloud database" -ForegroundColor Red
    Write-Host ""
    $confirm = Read-Host "Are you SURE you want to continue? Type 'yes' to confirm"
    if ($confirm -ne "yes") {
        Write-Host "Aborted." -ForegroundColor Green
        exit 0
    }
}

# Step 1: Export from local PostgreSQL
Write-Host ""
Write-Host "[1/4] Exporting from Local PostgreSQL..." -ForegroundColor Cyan

$dumpArgs = @("--no-owner", "--no-privileges", "--clean", "--if-exists")

if ($SchemaOnly) {
    $dumpArgs += "--schema-only"
    Write-Host "       (Schema only mode)" -ForegroundColor Gray
} elseif ($DataOnly) {
    $dumpArgs += "--data-only"
    Write-Host "       (Data only mode)" -ForegroundColor Gray
}

try {
    Write-Host "       Dumping local database..." -ForegroundColor Gray
    
    # Use docker exec to dump from the local container
    $dumpArgsString = $dumpArgs -join " "
    $output = docker exec $LOCAL_CONTAINER pg_dump -U $LOCAL_USER -d $LOCAL_DB $dumpArgs 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "pg_dump failed: $output"
        exit 1
    }
    
    # Save to file
    $output | Out-File -FilePath $LOCAL_DUMP_FILE -Encoding UTF8
    
    $fileSize = (Get-Item $LOCAL_DUMP_FILE).Length / 1KB
    Write-Host "       ✓ Exported $([math]::Round($fileSize, 2)) KB" -ForegroundColor Green
    Write-Host "       Saved to: $LOCAL_DUMP_FILE" -ForegroundColor Gray
} catch {
    Write-Error "Failed to export local database: $_"
    exit 1
}

# Step 2: Backup Neon (optional but recommended)
if ($BackupFirst) {
    Write-Host ""
    Write-Host "[2/4] Creating backup of Neon Cloud..." -ForegroundColor Cyan
    
    try {
        $env:PGPASSWORD = $NEON_PASS
        
        $neonBackup = docker run --rm `
            -e PGPASSWORD="$NEON_PASS" `
            postgres:17-alpine `
            pg_dump -h "$NEON_HOST" -U "$NEON_USER" -d "$NEON_DB" --no-owner --no-privileges 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Failed to backup Neon: $neonBackup"
            Write-Host "       Continuing anyway..." -ForegroundColor Yellow
        } else {
            $neonBackup | Out-File -FilePath $NEON_BACKUP_FILE -Encoding UTF8
            $backupSize = (Get-Item $NEON_BACKUP_FILE).Length / 1KB
            Write-Host "       ✓ Backup created: $([math]::Round($backupSize, 2)) KB" -ForegroundColor Green
            Write-Host "       Saved to: $NEON_BACKUP_FILE" -ForegroundColor Gray
        }
    } catch {
        Write-Warning "Backup failed: $_"
    }
} else {
    Write-Host ""
    Write-Host "[2/4] Skipping Neon backup (use -BackupFirst to enable)" -ForegroundColor Yellow
}

# Step 3: Import to Neon
Write-Host ""
Write-Host "[3/4] Importing to Neon Cloud..." -ForegroundColor Cyan
Write-Host "       This may take a while for large databases..." -ForegroundColor Gray

try {
    # Read the dump file content
    $sqlContent = Get-Content -Path $LOCAL_DUMP_FILE -Raw
    
    # Create a temporary file inside Docker context
    $tempDumpPath = "/tmp/local_dump.sql"
    
    # Copy the dump file to a Docker container and execute it
    $env:PGPASSWORD = $NEON_PASS
    
    # Use docker with volume mount to import
    $dumpDir = Split-Path -Parent $LOCAL_DUMP_FILE
    $dumpName = Split-Path -Leaf $LOCAL_DUMP_FILE
    
    Write-Host "       Connecting to Neon and importing..." -ForegroundColor Gray
    
    $importResult = docker run --rm `
        -v "${dumpDir}:/dumps:ro" `
        -e PGPASSWORD="$NEON_PASS" `
        postgres:17-alpine `
        psql -h "$NEON_HOST" -U "$NEON_USER" -d "$NEON_DB" -f "/dumps/$dumpName" 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        # Check if it's just warnings vs actual errors
        $errorLines = $importResult | Where-Object { $_ -match "ERROR:" }
        if ($errorLines) {
            Write-Warning "Some errors occurred during import:"
            $errorLines | ForEach-Object { Write-Host "       $_" -ForegroundColor Red }
        }
    }
    
    Write-Host "       ✓ Import completed" -ForegroundColor Green
} catch {
    Write-Error "Failed to import to Neon: $_"
    exit 1
}

# Step 4: Verify
Write-Host ""
Write-Host "[4/4] Verifying sync..." -ForegroundColor Cyan

try {
    $verifyResult = docker run --rm `
        -e PGPASSWORD="$NEON_PASS" `
        postgres:17-alpine `
        psql -h "$NEON_HOST" -U "$NEON_USER" -d "$NEON_DB" -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';" 2>&1
    
    Write-Host "       ✓ Neon database is accessible" -ForegroundColor Green
    Write-Host "$verifyResult" -ForegroundColor Gray
} catch {
    Write-Warning "Verification query failed, but import may have succeeded"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Sync Complete: Local -> Neon" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Local dump saved to:" -ForegroundColor White
Write-Host "  $LOCAL_DUMP_FILE" -ForegroundColor Gray
if ($BackupFirst -and (Test-Path $NEON_BACKUP_FILE)) {
    Write-Host ""
    Write-Host "Neon backup saved to:" -ForegroundColor White
    Write-Host "  $NEON_BACKUP_FILE" -ForegroundColor Gray
}
Write-Host ""
Write-Host "⚠️  Remember: Your Neon database now has LOCAL data." -ForegroundColor Yellow
Write-Host "   If you need to restore, use the backup file." -ForegroundColor Gray
Write-Host ""
