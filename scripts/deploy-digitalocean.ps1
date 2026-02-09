# DigitalOcean Deployment Script
# ================================
# Prerequisites:
# 1. Docker Desktop running
# 2. doctl CLI installed: winget install DigitalOcean.Doctl
# 3. doctl authenticated: doctl auth init
# 4. .env.digitalocean file filled out (copy from .env.digitalocean.template)

param(
    [switch]$SkipBuild,
    [switch]$SkipPush,
    [switch]$CreateApp,
    [string]$AppId
)

$ErrorActionPreference = "Stop"
$REGISTRY = "registry.digitalocean.com/iayos-registry"
$IMAGE = "iayos-backend"
$TAG = "latest"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  DigitalOcean Deployment Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Refresh PATH to include doctl
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Check prerequisites
Write-Host "`n[1/6] Checking prerequisites..." -ForegroundColor Yellow

# Check Docker
try {
    docker info | Out-Null
    Write-Host "  ✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check doctl
try {
    $null = doctl account get 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ doctl is authenticated" -ForegroundColor Green
    } else {
        throw "Not authenticated"
    }
} catch {
    Write-Host "  ✗ doctl is not authenticated. Run: doctl auth init" -ForegroundColor Red
    Write-Host "    After authenticating, restart PowerShell and run this script again." -ForegroundColor Yellow
    exit 1
}

# Check env file
$envFile = ".env.digitalocean"
if (-not (Test-Path $envFile)) {
    Write-Host "  ✗ $envFile not found!" -ForegroundColor Red
    Write-Host "    Copy .env.digitalocean.template to .env.digitalocean and fill in values" -ForegroundColor Yellow
    exit 1
}
Write-Host "  ✓ $envFile found" -ForegroundColor Green

# Load env file
Write-Host "`n[2/6] Loading environment variables..." -ForegroundColor Yellow
$envVars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.*)$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        if ($value -and $value -ne "your-secret-key-from-render" -and -not $value.StartsWith("xxxxx")) {
            $envVars[$key] = $value
            Write-Host "  ✓ $key loaded" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ $key is not set (using placeholder)" -ForegroundColor Yellow
        }
    }
}

# Validate critical vars
$critical = @("DATABASE_URL", "DJANGO_SECRET_KEY", "SUPABASE_URL")
$missing = $critical | Where-Object { -not $envVars.ContainsKey($_) -or $envVars[$_] -match "xxxxx|your-" }
if ($missing) {
    Write-Host "`n  ✗ Missing critical environment variables:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
    exit 1
}

# Create/check registry
Write-Host "`n[3/6] Setting up container registry..." -ForegroundColor Yellow
try {
    doctl registry get 2>$null | Out-Null
    Write-Host "  ✓ Registry already exists" -ForegroundColor Green
} catch {
    Write-Host "  Creating registry..." -ForegroundColor Yellow
    doctl registry create iayos-registry --region sgp1
    Write-Host "  ✓ Registry created" -ForegroundColor Green
}

# Login to registry
Write-Host "  Logging in to registry..." -ForegroundColor Yellow
doctl registry login
Write-Host "  ✓ Logged in" -ForegroundColor Green

# Build image
if (-not $SkipBuild) {
    Write-Host "`n[4/6] Building Docker image..." -ForegroundColor Yellow
    Write-Host "  This may take 5-10 minutes..." -ForegroundColor Gray
    
    docker build --target backend-production -t "${REGISTRY}/${IMAGE}:${TAG}" .
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✓ Build complete" -ForegroundColor Green
} else {
    Write-Host "`n[4/6] Skipping build (--SkipBuild)" -ForegroundColor Gray
}

# Push image
if (-not $SkipPush) {
    Write-Host "`n[5/6] Pushing image to registry..." -ForegroundColor Yellow
    Write-Host "  This may take 2-5 minutes..." -ForegroundColor Gray
    
    docker push "${REGISTRY}/${IMAGE}:${TAG}"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ Push failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✓ Push complete" -ForegroundColor Green
} else {
    Write-Host "`n[5/6] Skipping push (--SkipPush)" -ForegroundColor Gray
}

# Deploy app
Write-Host "`n[6/6] Deploying to App Platform..." -ForegroundColor Yellow

if ($CreateApp) {
    Write-Host "  Creating new app from spec..." -ForegroundColor Yellow
    $result = doctl apps create --spec do-app-spec.yaml --format ID --no-header
    $AppId = $result.Trim()
    Write-Host "  ✓ App created with ID: $AppId" -ForegroundColor Green
}

if ($AppId) {
    Write-Host "  Setting environment variables..." -ForegroundColor Yellow
    
    # Build env args
    $envArgs = @()
    foreach ($key in $envVars.Keys) {
        $value = $envVars[$key]
        $envArgs += "--env", "${key}=${value}"
    }
    
    # Add static vars
    $envArgs += "--env", "DEBUG=false"
    $envArgs += "--env", "ENVIRONMENT=production"
    $envArgs += "--env", "PAYMENT_PROVIDER=paymongo"
    $envArgs += "--env", "FACE_API_URL=https://iayos-face-api.onrender.com"
    $envArgs += "--env", "REDIS_URL=none"
    $envArgs += "--env", "TESTING=false"
    $envArgs += "--env", "FRONTEND_URL=https://iayos.online"
    
    # Update app with env vars
    # Note: doctl doesn't support bulk env update easily, so we update the spec
    Write-Host "  ⚠ Please set environment variables manually in DigitalOcean Dashboard:" -ForegroundColor Yellow
    Write-Host "    https://cloud.digitalocean.com/apps/$AppId/settings" -ForegroundColor Cyan
    
    Write-Host "`n  Triggering deployment..." -ForegroundColor Yellow
    doctl apps create-deployment $AppId
    Write-Host "  ✓ Deployment triggered" -ForegroundColor Green
} else {
    Write-Host "  ⚠ No App ID provided. To deploy:" -ForegroundColor Yellow
    Write-Host "    1. Run with -CreateApp to create new app" -ForegroundColor Gray
    Write-Host "    2. Or run with -AppId <id> to update existing app" -ForegroundColor Gray
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Go to DigitalOcean Dashboard and verify deployment" -ForegroundColor White
Write-Host "  2. Set remaining environment variables (if not set)" -ForegroundColor White
Write-Host "  3. Add custom domain: api.iayos.online" -ForegroundColor White
Write-Host "  4. Update DNS CNAME record" -ForegroundColor White
Write-Host "  5. Update PayMongo webhook URL" -ForegroundColor White
Write-Host "`nUseful commands:" -ForegroundColor Yellow
Write-Host "  doctl apps list                    # List all apps" -ForegroundColor Gray
Write-Host "  doctl apps logs <APP_ID>           # View logs" -ForegroundColor Gray
Write-Host "  doctl apps create-deployment <ID>  # Redeploy" -ForegroundColor Gray
