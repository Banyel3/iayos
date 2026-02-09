# Test mobile daily attendance endpoints with JWT auth
$baseUrl = "https://api.iayos.online"
$mobileEmail = "john@gmail.com"
$mobilePassword = "VanielCornelio_123"

Write-Host "=== Testing Mobile Daily Attendance Endpoints ===" -ForegroundColor Cyan

# Login
$loginBody = @{
    email = $mobileEmail
    password = $mobilePassword
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/accounts/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.access

Write-Host "✅ Login successful, token received" -ForegroundColor Green

# Get active jobs
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "`nFetching active jobs..." -ForegroundColor Yellow
$jobsResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/jobs/my-jobs?status=IN_PROGRESS" -Method GET -Headers $headers

if ($jobsResponse.jobs) {
    Write-Host "✅ Found $($jobsResponse.jobs.Count) active job(s)" -ForegroundColor Green
    
    foreach ($job in $jobsResponse.jobs) {
        Write-Host "`n  Job ID: $($job.id)" -ForegroundColor Cyan
        Write-Host "  Title: $($job.title)" -ForegroundColor White
        Write-Host "  Payment Model: $($job.payment_model)" -ForegroundColor $(if ($job.payment_model -eq "DAILY") { "Green" } else { "Yellow" })
        Write-Host "  Is Team Job: $($job.is_team_job)" -ForegroundColor White
        
        if ($job.payment_model -eq "DAILY") {
            Write-Host "  Daily Rate: ₱$($job.daily_rate_agreed)" -ForegroundColor White
            Write-Host "  Duration: $($job.duration_days) days" -ForegroundColor White
            Write-Host "  Days Worked: $($job.total_days_worked)" -ForegroundColor White
            
            # Test escrow estimate
            try {
                $escrowUrl = "$baseUrl/api/jobs/0/daily/escrow-estimate?daily_rate=$($job.daily_rate_agreed)&num_workers=1&num_days=$($job.duration_days)"
                $escrow = Invoke-RestMethod -Uri $escrowUrl -Method GET -Headers $headers
                Write-Host "  Escrow Estimate: ₱$($escrow.total_required) (₱$($escrow.escrow_amount) + ₱$($escrow.platform_fee) fee)" -ForegroundColor Green
            } catch {
                Write-Host "  Escrow estimate: N/A" -ForegroundColor Gray
            }
            
            # Test daily summary
            try {
                $summary = Invoke-RestMethod -Uri "$baseUrl/api/jobs/$($job.id)/daily/summary" -Method GET -Headers $headers
                Write-Host "  Summary: $($summary.total_days_worked) days worked, $($summary.days_remaining) remaining" -ForegroundColor Green
                Write-Host "  Paid: ₱$($summary.total_paid_so_far) of ₱$($summary.total_escrow)" -ForegroundColor Green
            } catch {
                Write-Host "  Summary: Unable to fetch ($(($_.Exception.Message -split ':')[0]))" -ForegroundColor Gray
            }
        }
    }
    
    # Find a DAILY team job
    $dailyTeamJob = $jobsResponse.jobs | Where-Object { $_.payment_model -eq "DAILY" -and $_.is_team_job -eq $true } | Select-Object -First 1
    
    if ($dailyTeamJob) {
        Write-Host "`n✅ PR #298 VERIFICATION:" -ForegroundColor Green
        Write-Host "  Found DAILY team job (ID: $($dailyTeamJob.id))" -ForegroundColor White
        Write-Host "  Mobile UI should:" -ForegroundColor Yellow
        Write-Host "    ❌ NOT show 'Approve & Pay Team' button" -ForegroundColor Red
        Write-Host "    ✅ SHOW Daily Attendance section instead" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️ No DAILY team jobs found for this user" -ForegroundColor Yellow
        Write-Host "  Cannot verify PR #298 fix without DAILY team job" -ForegroundColor Gray
    }
    
} else {
    Write-Host "❌ No active jobs found" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
