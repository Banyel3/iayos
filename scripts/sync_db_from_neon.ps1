# Sync Database from Neon Cloud to Local PostgreSQL
# This script exports data from Neon and imports it into local PostgreSQL
# Usage: .\scripts\sync_db_from_neon.ps1

param(
    [switch]$SchemaOnly,      # Only sync schema, no data
    [switch]$DataOnly,        # Only sync data (assumes schema exists)
    [switch]$Force            # Skip confirmation prompts
)

# Configuration - Load from .env.docker
$envFile = Join-Path $PSScriptRoot "..\\.env.docker"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"')
            Set-Item -Path "env:$name" -Value $value
        }
    }
}

# Neon Cloud Database (source)
$NEON_URL = $env:DATABASE_URL
if (-not $NEON_URL) {
    Write-Error "DATABASE_URL not found in .env.docker"
    exit 1
}

# Parse Neon URL for pg_dump
# Format: postgresql://user:pass@host/dbname?params
if ($NEON_URL -match "postgresql://([^:]+):([^@]+)@([^/]+)/([^?]+)") {
    $NEON_USER = $matches[1]
    $NEON_PASS = $matches[2]
    $NEON_HOST = $matches[3]
    $NEON_DB = $matches[4]
} else {
    Write-Error "Failed to parse DATABASE_URL"
    exit 1
}

# Local PostgreSQL (destination)
$LOCAL_USER = "iayos_user"
$LOCAL_PASS = "iayos_local_pass"
$LOCAL_HOST = "localhost"
$LOCAL_PORT = "5432"
$LOCAL_DB = "iayos_db"

# Output directory
$OUTPUT_DIR = Join-Path $PSScriptRoot "..\\backups"
if (-not (Test-Path $OUTPUT_DIR)) {
    New-Item -ItemType Directory -Path $OUTPUT_DIR | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$DUMP_FILE = Join-Path $OUTPUT_DIR "neon_dump_$timestamp.sql"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  iAyos Database Sync: Neon -> Local" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Source (Neon): $NEON_HOST / $NEON_DB" -ForegroundColor Yellow
Write-Host "Target (Local): ${LOCAL_HOST}:${LOCAL_PORT} / $LOCAL_DB" -ForegroundColor Green
Write-Host ""

if (-not $Force) {
    $confirm = Read-Host "This will OVERWRITE the local database. Continue? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "Aborted." -ForegroundColor Red
        exit 0
    }
}

# Set password for pg_dump
$env:PGPASSWORD = $NEON_PASS

Write-Host ""
Write-Host "[1/4] Exporting from Neon Cloud..." -ForegroundColor Cyan

# Use Docker to run pg_dump (no local PostgreSQL installation needed)
$dumpArgs = "--no-owner --no-privileges --clean --if-exists"

if ($SchemaOnly) {
    $dumpArgs += " --schema-only"
    Write-Host "       (Schema only mode)" -ForegroundColor Gray
} elseif ($DataOnly) {
    $dumpArgs += " --data-only"
    Write-Host "       (Data only mode)" -ForegroundColor Gray
}

try {
    # Run pg_dump inside a temporary postgres container
    # Using postgres:17 to match Neon server version
    Write-Host "       Connecting to Neon..." -ForegroundColor Gray
    
    $output = docker run --rm `
        -e PGPASSWORD="$NEON_PASS" `
        postgres:17-alpine `
        pg_dump -h "$NEON_HOST" -U "$NEON_USER" -d "$NEON_DB" $dumpArgs.Split(' ') 2>&1
    
    if ($LASTEXITCODE -ne 0 -or -not $output) {
        Write-Host "       Docker output: $output" -ForegroundColor Red
        throw "pg_dump failed with exit code $LASTEXITCODE"
    }
    
    # Save to file
    $output | Out-File -FilePath $DUMP_FILE -Encoding UTF8
    Write-Host "       Export complete: $DUMP_FILE" -ForegroundColor Green
} catch {
    Write-Error "Failed to export from Neon: $_"
    exit 1
}

# Get file size
$fileSize = (Get-Item $DUMP_FILE).Length / 1MB
Write-Host "       Dump size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Gray

Write-Host ""
Write-Host "[2/4] Checking local PostgreSQL container..." -ForegroundColor Cyan

# Check if local postgres container is running
try {
    $containerStatus = docker ps --filter "name=iayos-postgres-dev" --format "{{.Status}}" 2>&1
    if (-not $containerStatus -or $containerStatus -notmatch "Up") {
        Write-Host "       Local PostgreSQL container not running. Starting it..." -ForegroundColor Yellow
        docker-compose -f docker-compose.dev.yml up postgres -d
        Start-Sleep -Seconds 5
    }
    Write-Host "       Local PostgreSQL container is running" -ForegroundColor Green
} catch {
    Write-Error "Cannot start local PostgreSQL container: $_"
    exit 1
}

Write-Host ""
Write-Host "[3/4] Importing to local PostgreSQL..." -ForegroundColor Cyan

try {
    # Read the dump file and pipe it to psql inside the container
    $dumpContent = Get-Content $DUMP_FILE -Raw
    $dumpContent | docker exec -i iayos-postgres-dev psql -U $LOCAL_USER -d $LOCAL_DB 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        throw "psql import failed"
    }
    Write-Host "       Import complete!" -ForegroundColor Green
} catch {
    Write-Error "Failed to import to local: $_"
    exit 1
}

Write-Host ""
Write-Host "[4/4] Verifying sync..." -ForegroundColor Cyan

# Count tables using docker exec
$tableCount = docker exec iayos-postgres-dev psql -U $LOCAL_USER -d $LOCAL_DB -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
Write-Host "       Tables in local DB: $($tableCount.Trim())" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Sync Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backup saved to: $DUMP_FILE" -ForegroundColor Gray
Write-Host ""
Write-Host "To use local database, ensure .env.docker has:" -ForegroundColor Yellow
Write-Host "  USE_LOCAL_DB=true" -ForegroundColor White
Write-Host ""
Write-Host "Then restart Docker:" -ForegroundColor Yellow
Write-Host "  docker-compose -f docker-compose.dev.yml down" -ForegroundColor White
Write-Host "  docker-compose -f docker-compose.dev.yml up" -ForegroundColor White
Write-Host ""
