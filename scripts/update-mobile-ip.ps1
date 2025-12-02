# PowerShell script to update React Native mobile app IP address
# Usage: .\scripts\update-mobile-ip.ps1

$envDockerPath = "$PSScriptRoot\..\.env.docker"
$configPath = "$PSScriptRoot\..\apps\frontend_mobile\iayos_mobile\lib\api\config.ts"

# Get the current local IP address (IPv4, prefer real network adapters over virtual)
# Exclude: Loopback, APIPA (169.254.x.x), WSL/Hyper-V (172.x.x.x), Docker virtual networks
$currentIP = (Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object { 
        $_.InterfaceAlias -notmatch 'Loopback|vEthernet|WSL|Docker|Hyper-V' -and 
        $_.IPAddress -notmatch '^127\.' -and 
        $_.IPAddress -notmatch '^169\.254\.' -and
        $_.IPAddress -notmatch '^172\.(1[6-9]|2[0-9]|3[0-1])\.' -and
        $_.PrefixOrigin -ne 'WellKnown'
    } | 
    Sort-Object -Property { $_.InterfaceAlias -match 'Wi-Fi|Ethernet|LAN' } -Descending |
    Select-Object -First 1).IPAddress

# Fallback to any non-loopback IP if WiFi/Ethernet not found
if (-not $currentIP) {
    $currentIP = (Get-NetIPAddress -AddressFamily IPv4 | 
        Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notmatch '^127\.' -and $_.IPAddress -notmatch '^169\.254\.' } | 
        Select-Object -First 1).IPAddress
}

if (-not $currentIP) {
    Write-Host "[ERROR] Could not detect local IP address. Make sure you're connected to a network." -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Detected local IP: $currentIP" -ForegroundColor Cyan

# ===== Update .env.docker =====
if (Test-Path $envDockerPath) {
    $envContent = Get-Content $envDockerPath -Raw
    
    # Extract current IP from EXPO_PUBLIC_API_URL
    $envMatch = [regex]::Match($envContent, 'EXPO_PUBLIC_API_URL="?http://(\d+\.\d+\.\d+\.\d+):8000"?')
    if ($envMatch.Success) {
        $currentEnvIP = $envMatch.Groups[1].Value
        Write-Host "[INFO] Current IP in .env.docker: $currentEnvIP" -ForegroundColor Yellow
    }
    
    # Update EXPO_PUBLIC_API_URL
    $envContent = $envContent -replace 'EXPO_PUBLIC_API_URL="?http://\d+\.\d+\.\d+\.\d+:8000"?', "EXPO_PUBLIC_API_URL=`"http://${currentIP}:8000`""
    
    Set-Content -Path $envDockerPath -Value $envContent -NoNewline
    Write-Host "[OK] Updated .env.docker" -ForegroundColor Green
} else {
    Write-Host "[WARN] .env.docker not found at: $envDockerPath" -ForegroundColor Yellow
}

# ===== Update config.ts =====
if (Test-Path $configPath) {
    $configContent = Get-Content $configPath -Raw
    
    # Extract current IP from config.ts
    $configMatch = [regex]::Match($configContent, 'http://(\d+\.\d+\.\d+\.\d+):8000')
    if ($configMatch.Success) {
        $currentConfigIP = $configMatch.Groups[1].Value
        Write-Host "[INFO] Current IP in config.ts: $currentConfigIP" -ForegroundColor Yellow
    }
    
    # Replace all IP occurrences
    $configContent = $configContent -replace 'http://\d+\.\d+\.\d+\.\d+:8000', "http://${currentIP}:8000"
    $configContent = $configContent -replace 'ws://\d+\.\d+\.\d+\.\d+:8001', "ws://${currentIP}:8001"
    
    Set-Content -Path $configPath -Value $configContent -NoNewline
    Write-Host "[OK] Updated config.ts" -ForegroundColor Green
} else {
    Write-Host "[WARN] config.ts not found at: $configPath" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Updated URLs:" -ForegroundColor Cyan
Write-Host "   API:       http://${currentIP}:8000" -ForegroundColor White
Write-Host "   WebSocket: ws://${currentIP}:8001" -ForegroundColor White
Write-Host ""
Write-Host "[NOTE] Restart your Expo app to apply changes" -ForegroundColor Yellow
