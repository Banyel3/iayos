# Network Switching Script for iAyos Development
# Usage: .\switch-network.ps1 -Network home
#        .\switch-network.ps1 -Network school

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("home", "school")]
    [string]$Network
)

# Network IP configurations
$HomeIP = "192.168.1.84"
$SchoolIP = "10.102.160.98"

$IP = if ($Network -eq "home") { $HomeIP } else { $SchoolIP }
$UseFallback = if ($Network -eq "home") { "false" } else { "true" }

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  iAyos Network Switcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Switching to: $Network network ($IP)" -ForegroundColor Yellow
Write-Host ""

# Get script directory and project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# File paths
$EnvFile = Join-Path $ProjectRoot ".env.docker"
$MobileConfigFile = Join-Path $ProjectRoot "apps\frontend_mobile\iayos_mobile\lib\api\config.ts"

# 1. Update .env.docker
Write-Host "[1/3] Updating .env.docker..." -ForegroundColor White
if (Test-Path $EnvFile) {
    $content = Get-Content $EnvFile -Raw
    $content = $content -replace 'FRONTEND_URL=http://[\d.]+:\d+', "FRONTEND_URL=http://${IP}:3400"
    $content = $content -replace 'EXPO_PUBLIC_API_URL="http://[\d.]+:8000"', "EXPO_PUBLIC_API_URL=`"http://${IP}:8000`""
    Set-Content $EnvFile $content -NoNewline
    Write-Host "      FRONTEND_URL=http://${IP}:3400" -ForegroundColor Green
    Write-Host "      EXPO_PUBLIC_API_URL=http://${IP}:8000" -ForegroundColor Green
} else {
    Write-Host "      ERROR: .env.docker not found!" -ForegroundColor Red
}

# 2. Update mobile config.ts
Write-Host "[2/3] Updating mobile config.ts..." -ForegroundColor White
if (Test-Path $MobileConfigFile) {
    $content = Get-Content $MobileConfigFile -Raw
    $content = $content -replace 'const USE_FALLBACK = (true|false);', "const USE_FALLBACK = $UseFallback;"
    Set-Content $MobileConfigFile $content -NoNewline
    Write-Host "      USE_FALLBACK = $UseFallback" -ForegroundColor Green
} else {
    Write-Host "      ERROR: Mobile config.ts not found!" -ForegroundColor Red
}

# 3. Restart Docker
Write-Host "[3/3] Restarting Docker containers..." -ForegroundColor White
Push-Location $ProjectRoot
docker-compose -f docker-compose.dev.yml restart
Pop-Location

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Network switch complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Restart Expo (if running):" -ForegroundColor White
Write-Host "     cd apps\frontend_mobile\iayos_mobile" -ForegroundColor Gray
Write-Host "     npx expo start --clear" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Verify your IP matches:" -ForegroundColor White
Write-Host "     ipconfig | findstr IPv4" -ForegroundColor Gray
Write-Host ""
