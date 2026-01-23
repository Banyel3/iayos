# Build Flutter Mobile APK using Docker
# Usage: .\scripts\build-mobile.ps1

Write-Host "Building Flutter mobile APK..." -ForegroundColor Cyan

# Build the mobile-production stage and output APKs to ./output directory
docker buildx build `
    --target mobile-production `
    --output type=local,dest=./output `
    --platform linux/amd64 `
    -f Dockerfile `
    .

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Build successful! APK files are in ./output/" -ForegroundColor Green
    Write-Host "`nGenerated APKs:" -ForegroundColor Yellow
    Get-ChildItem -Path ./output -Filter *.apk | ForEach-Object {
        Write-Host "  - $($_.Name) ($([math]::Round($_.Length/1MB, 2)) MB)" -ForegroundColor White
    }
} else {
    Write-Host "`n❌ Build failed!" -ForegroundColor Red
    exit 1
}
