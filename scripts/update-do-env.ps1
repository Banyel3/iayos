# DigitalOcean Environment Variables Update Script
# Updates all environment variables for the DigitalOcean app from .env.digitalocean

param(
    [Parameter(Mandatory=$true)]
    [string]$AppId
)

# Refresh PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Load environment variables
$envFile = ".env.digitalocean"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Error: $envFile not found" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Loading environment variables from $envFile..." -ForegroundColor Cyan

# Parse env file
$envVars = @{}
Get-Content $envFile | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '\S' } | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        # Remove quotes if present
        $value = $value -replace '^"|"$', ''
        $envVars[$key] = $value
    }
}

Write-Host "✓ Found $($envVars.Count) environment variables" -ForegroundColor Green
Write-Host ""

# Get current app spec
Write-Host "📥 Fetching current app spec..." -ForegroundColor Cyan
$appSpecJson = doctl apps spec get $AppId -o json | ConvertFrom-Json

if (-not $appSpecJson) {
    Write-Host "❌ Failed to fetch app spec" -ForegroundColor Red
    exit 1
}

Write-Host "✓ App spec fetched" -ForegroundColor Green
Write-Host ""

# Update environment variables in spec
Write-Host "🔧 Updating environment variables in spec..." -ForegroundColor Cyan

$envArray = @()
foreach ($key in $envVars.Keys) {
    $isSecret = $key -match 'SECRET|KEY|PASSWORD|TOKEN|DATABASE_URL|SUPABASE|PAYMONGO|XENDIT|RESEND|SENTRY|GOOGLE|ADMIN'
    
    $envObj = @{
        key = $key
        value = $envVars[$key]
        scope = "RUN_AND_BUILD_TIME"
    }
    
    if ($isSecret) {
        $envObj.type = "SECRET"
    }
    
    $envArray += $envObj
    Write-Host "  ✓ $key" -ForegroundColor Gray
}

# Update the backend service envs
$appSpecJson.services[0].envs = $envArray

# Save updated spec to temp file
$tempSpec = "temp-app-spec.json"
$appSpecJson | ConvertTo-Json -Depth 10 | Out-File -Encoding UTF8 $tempSpec

Write-Host ""
Write-Host "📤 Uploading updated app spec..." -ForegroundColor Cyan

# Update app with new spec
try {
    doctl apps update $AppId --spec $tempSpec --wait
    Write-Host ""
    Write-Host "✓ Environment variables updated successfully!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to update app" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
finally {
    # Clean up temp file
    if (Test-Path $tempSpec) {
        Remove-Item $tempSpec
    }
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Check deployment: doctl apps get $AppId" -ForegroundColor White
Write-Host "2. View logs: doctl apps logs $AppId --follow" -ForegroundColor White
Write-Host "3. Get app URL: doctl apps get $AppId -o json | ConvertFrom-Json | Select default_ingress" -ForegroundColor White
