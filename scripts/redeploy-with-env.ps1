# Redeploy DigitalOcean App with Environment Variables from .env.digitalocean
param(
    [Parameter(Mandatory=$true)]
    [string]$AppId
)

# Refresh PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$envFile = ".env.digitalocean"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Error: $envFile not found" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Loading environment variables..." -ForegroundColor Cyan

# Parse env file into hashtable
$envVars = @{}
Get-Content $envFile | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '\S' } | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $value = $value -replace '^"|"$', ''
        $envVars[$key] = $value
    }
}

Write-Host "✓ Loaded $($envVars.Count) variables" -ForegroundColor Green

# Read the app spec template
Write-Host "📄 Reading app spec template..." -ForegroundColor Cyan
$specContent = Get-Content "do-app-spec.yaml" -Raw

# Replace placeholders with actual values
Write-Host "🔧 Replacing placeholders..." -ForegroundColor Cyan
$replacements = 0
foreach ($key in $envVars.Keys) {
    $placeholder = "`${$key}"
    if ($specContent -match [regex]::Escape($placeholder)) {
        $specContent = $specContent -replace [regex]::Escape($placeholder), $envVars[$key]
        $replacements++
        Write-Host "  ✓ Replaced `${$key}" -ForegroundColor Gray
    }
}

Write-Host "✓ Replaced $replacements placeholders" -ForegroundColor Green

# Save to temporary file
$tempSpec = "temp-app-spec-filled.yaml"
$specContent | Out-File -Encoding UTF8 $tempSpec

Write-Host ""
Write-Host "📤 Updating app with filled spec..." -ForegroundColor Cyan

try {
    doctl apps update $AppId --spec $tempSpec --wait
    Write-Host ""
    Write-Host "✅ App updated and redeployed successfully!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Update failed: $_" -ForegroundColor Red
    exit 1
}
finally {
    if (Test-Path $tempSpec) {
        Remove-Item $tempSpec
    }
}

Write-Host ""
Write-Host "Monitoring deployment..." -ForegroundColor Cyan
Write-Host "Run: doctl apps list-deployments $AppId" -ForegroundColor White
