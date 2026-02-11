# Check all job statuses for mobile user
$baseUrl = "https://api.iayos.online"
$mobileEmail = "john@gmail.com"
$mobilePassword = "VanielCornelio_123"

Write-Host "=== Checking All Jobs for Mobile User ===" -ForegroundColor Cyan

# Login
$loginBody = @{
    email = $mobileEmail
    password = $mobilePassword
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/accounts/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.access

Write-Host "✅ Login: $mobileEmail" -ForegroundColor Green

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test all job statuses
$statuses = @("ACTIVE", "IN_PROGRESS", "PENDING", "COMPLETED", "CANCELLED")

foreach ($status in $statuses) {
    Write-Host "`n--- Checking $status jobs ---" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/mobile/jobs/my-jobs?status=$status" -Method GET -Headers $headers
        
        if ($response.jobs -and $response.jobs.Count -gt 0) {
            Write-Host "  Found $($response.jobs.Count) job(s)" -ForegroundColor Green
            
            foreach ($job in $response.jobs) {
                Write-Host "    • ID: $($job.id), Payment: $($job.payment_model), Team: $($job.is_team_job), Title: $($job.title)" -ForegroundColor White
            }
        } else {
            Write-Host "  No jobs" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Check profile info
Write-Host "`n--- User Profile Info ---" -ForegroundColor Yellow
try {
    $profile = Invoke-RestMethod -Uri "$baseUrl/api/accounts/me" -Method GET -Headers $headers
    Write-Host "  Account ID: $($profile.id)" -ForegroundColor White
    Write-Host "  Email: $($profile.email)" -ForegroundColor White
    Write-Host "  Profile Type: $($profile.profileType)" -ForegroundColor White
    Write-Host "  Is Verified: $($profile.isVerified)" -ForegroundColor White
} catch {
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "This account appears to have minimal or no job history" -ForegroundColor Yellow
Write-Host "`nTO TEST PR #298, you need:" -ForegroundColor Yellow
Write-Host "  1. A DAILY payment model job" -ForegroundColor White
Write-Host "  2. With is_team_job = true" -ForegroundColor White
Write-Host "  3. In status IN_PROGRESS" -ForegroundColor White
Write-Host "`nConsider using the AGENCY account to create a DAILY team job" -ForegroundColor Cyan
Write-Host "and assign it to workers, then test with those workers' accounts" -ForegroundColor Cyan
