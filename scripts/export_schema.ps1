# Export PostgreSQL Schema Script
# Usage: .\scripts\export_schema.ps1 [schema-only|with-data|full]

param(
    [ValidateSet("schema-only", "with-data", "full")]
    [string]$ExportType = "schema-only"
)

# Load environment variables from .env.docker.example
$envFile = Get-Content -Path ".env.docker.example" -ErrorAction SilentlyContinue
if ($envFile) {
    foreach ($line in $envFile) {
        if ($line -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Get database credentials
$DB_HOST = $env:POSTGRES_HOST
$DB_PORT = $env:POSTGRES_PORT
$DB_NAME = $env:POSTGRES_DB
$DB_USER = $env:POSTGRES_USER
$DB_PASSWORD = $env:POSTGRES_PASSWORD

# Set password environment variable for pg_dump
$env:PGPASSWORD = $DB_PASSWORD

# Create exports directory
$exportsDir = "exports"
if (-not (Test-Path $exportsDir)) {
    New-Item -ItemType Directory -Path $exportsDir | Out-Null
}

# Generate filename with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$filename = "$exportsDir/iayos_schema_$timestamp"

Write-Host "🔄 Exporting PostgreSQL Schema..." -ForegroundColor Cyan
Write-Host "   Type: $ExportType" -ForegroundColor Gray
Write-Host "   Database: $DB_NAME" -ForegroundColor Gray

try {
    switch ($ExportType) {
        "schema-only" {
            Write-Host "   Exporting schema structure only..." -ForegroundColor Yellow
            pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME --schema-only -f "$filename.sql"
            Write-Host "✅ Schema exported to: $filename.sql" -ForegroundColor Green
        }
        "with-data" {
            Write-Host "   Exporting schema + data..." -ForegroundColor Yellow
            pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$filename.sql"
            Write-Host "✅ Full backup exported to: $filename.sql" -ForegroundColor Green
        }
        "full" {
            Write-Host "   Creating comprehensive export..." -ForegroundColor Yellow
            
            # Schema only
            pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME --schema-only -f "$filename`_schema.sql"
            Write-Host "   ✓ Schema exported" -ForegroundColor Gray
            
            # Data only
            pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME --data-only -f "$filename`_data.sql"
            Write-Host "   ✓ Data exported" -ForegroundColor Gray
            
            # Custom format (compressed)
            pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -Fc -f "$filename.backup"
            Write-Host "   ✓ Compressed backup created" -ForegroundColor Gray
            
            Write-Host "✅ Full export complete:" -ForegroundColor Green
            Write-Host "   - $filename`_schema.sql (DDL)" -ForegroundColor Gray
            Write-Host "   - $filename`_data.sql (Data)" -ForegroundColor Gray
            Write-Host "   - $filename.backup (Compressed)" -ForegroundColor Gray
        }
    }
    
    # Show file size
    $file = Get-Item "$filename.sql" -ErrorAction SilentlyContinue
    if ($file) {
        $sizeMB = [math]::Round($file.Length / 1MB, 2)
        Write-Host "   File size: $sizeMB MB" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "📋 To restore this schema:" -ForegroundColor Cyan
    Write-Host "   psql -h <host> -U <user> -d <database> -f $filename.sql" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Export failed: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clear password from environment
    $env:PGPASSWORD = $null
}
