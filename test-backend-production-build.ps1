# Test Backend Production Build Locally
# This script tests the backend-production stage before pushing to Render

Write-Host "🔨 Testing Backend Production Docker Build..." -ForegroundColor Cyan
Write-Host ""

# Build only the backend-production stage
Write-Host "📦 Building backend-production stage..." -ForegroundColor Yellow
docker build --target backend-production -t iayos-backend-test:latest . 2>&1 | Tee-Object -FilePath "build-test.log"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Build SUCCEEDED!" -ForegroundColor Green
    Write-Host ""
    
    # Test running the container
    Write-Host "🧪 Testing container startup..." -ForegroundColor Yellow
    docker run --rm -e DATABASE_URL="postgresql://test:test@localhost:5432/test" iayos-backend-test:latest python -c "import django; print(f'Django {django.__version__} works!')"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Container runtime test PASSED!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Container runtime test FAILED!" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "❌ Build FAILED! Check build-test.log for details." -ForegroundColor Red
    Write-Host ""
    Write-Host "Last 50 lines of build log:" -ForegroundColor Yellow
    Get-Content build-test.log -Tail 50
}

Write-Host ""
Write-Host "📝 Full build log saved to: build-test.log" -ForegroundColor Cyan
