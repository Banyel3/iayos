# Create Agency Invitation for Devante
# PowerShell script to create a job invitation for Devante agency

$BASE_URL = "http://localhost:8000"

# Step 1: Login as client (update credentials as needed)
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "STEP 1: LOGIN AS CLIENT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$loginBody = @{
    email = "dump.temp.27@gmail.com"
    password = "123456"
} | ConvertTo-Json

Write-Host "Attempting login..." -ForegroundColor Yellow

try {
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/api/accounts/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -SessionVariable session
    
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "User: $($loginResponse.user.email)" -ForegroundColor Gray
    
    # Extract JWT token if available
    $token = $null
    if ($loginResponse.access_token) {
        $token = $loginResponse.access_token
    } elseif ($loginResponse.token) {
        $token = $loginResponse.token
    } elseif ($loginResponse.access) {
        $token = $loginResponse.access
    }
    
    if ($token) {
        Write-Host "✓ JWT Token obtained" -ForegroundColor Green
    }
    
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
    
    # Try alternative login credentials
    Write-Host "`nTrying alternative credentials..." -ForegroundColor Yellow
    $loginBody = @{
        email = "client@test.com"
        password = "123456"
    } | ConvertTo-Json
    
    try {
        $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/api/accounts/login" `
            -Method POST `
            -Body $loginBody `
            -ContentType "application/json" `
            -SessionVariable session
        
        Write-Host "✓ Login successful with alternative credentials!" -ForegroundColor Green
    } catch {
        Write-Host "✗ Login failed with alternative credentials as well" -ForegroundColor Red
        Write-Host "Please update credentials in the script" -ForegroundColor Yellow
        exit 1
    }
}

# Step 2: Get agencies list and find Devante
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "STEP 2: FIND DEVANTE AGENCY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

try {
    $headers = @{}
    if ($token) {
        $headers["Authorization"] = "Bearer $token"
    }
    
    $agenciesResponse = Invoke-RestMethod -Uri "$BASE_URL/api/mobile/agencies/list?page=1&limit=50" `
        -Method GET `
        -Headers $headers `
        -WebSession $session
    
    $agencies = $agenciesResponse.agencies
    Write-Host "✓ Found $($agencies.Count) agencies" -ForegroundColor Green
    
    # Display agencies
    Write-Host "`nAvailable agencies:" -ForegroundColor Gray
    foreach ($agency in $agencies | Select-Object -First 10) {
        Write-Host "  - ID: $($agency.agencyId), Name: $($agency.agencyName)" -ForegroundColor Gray
    }
    
    # Find Devante
    $devante = $agencies | Where-Object { $_.agencyName -eq "Devante" }
    
    if ($devante) {
        Write-Host "`n✓ Found Devante Agency!" -ForegroundColor Green
        Write-Host "  Agency ID: $($devante.agencyId)" -ForegroundColor Gray
        Write-Host "  Name: $($devante.agencyName)" -ForegroundColor Gray
        Write-Host "  Email: $($devante.email)" -ForegroundColor Gray
    } else {
        Write-Host "`n✗ Devante agency not found!" -ForegroundColor Red
        Write-Host "Available agencies: $($agencies.agencyName -join ', ')" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "✗ Failed to get agencies: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Get categories
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "STEP 3: GET JOB CATEGORIES" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

try {
    $headers = @{}
    if ($token) {
        $headers["Authorization"] = "Bearer $token"
    }
    
    $categoriesResponse = Invoke-RestMethod -Uri "$BASE_URL/api/mobile/jobs/categories" `
        -Method GET `
        -Headers $headers `
        -WebSession $session
    
    $categories = $categoriesResponse.categories
    Write-Host "✓ Found $($categories.Count) categories" -ForegroundColor Green
    
    # Use first category
    $categoryId = $categories[0].id
    Write-Host "  Selected: $($categories[0].name) (ID: $categoryId)" -ForegroundColor Gray
} catch {
    Write-Host "⚠ Failed to get categories, using default ID 1" -ForegroundColor Yellow
    $categoryId = 1
}

# Step 4: Create agency invite job
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "STEP 4: CREATE AGENCY INVITATION" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$jobPayload = @{
    title = "Agency Test Job - $timestamp"
    description = "This is a test job invitation to Devante Agency. We need skilled workers for a construction project. Please assign your best employee for this task."
    category_id = $categoryId
    budget = 5000.0
    location = "123 Main Street, Zamboanga City, Philippines"
    urgency_level = "HIGH"
    expected_duration = "1 week"
    preferred_start_date = "2025-11-26"
    materials_needed = @("Cement", "Sand", "Gravel", "Steel bars")
    agency_id = $devante.agencyId
    downpayment_method = "WALLET"
} | ConvertTo-Json

Write-Host "Job Details:" -ForegroundColor Gray
Write-Host "  Title: Agency Test Job - $timestamp" -ForegroundColor Gray
Write-Host "  Budget: ₱5,000.00" -ForegroundColor Gray
Write-Host "  Urgency: HIGH" -ForegroundColor Gray
Write-Host "  Agency: Devante (ID: $($devante.agencyId))" -ForegroundColor Gray

try {
    $headers = @{
        "Content-Type" = "application/json"
    }
    if ($token) {
        $headers["Authorization"] = "Bearer $token"
    }
    
    $jobResponse = Invoke-RestMethod -Uri "$BASE_URL/api/mobile/jobs/invite" `
        -Method POST `
        -Body $jobPayload `
        -Headers $headers `
        -WebSession $session
    
    Write-Host "`n✓ Agency invitation created successfully!" -ForegroundColor Green
    Write-Host "  Job ID: $($jobResponse.job_id)" -ForegroundColor Gray
    Write-Host "  Title: $($jobResponse.title)" -ForegroundColor Gray
    Write-Host "  Status: $($jobResponse.status)" -ForegroundColor Gray
    Write-Host "  Invite Status: $($jobResponse.invite_status)" -ForegroundColor Gray
    
    if ($jobResponse.payment) {
        Write-Host "`n  Payment Details:" -ForegroundColor Gray
        Write-Host "    Downpayment: ₱$($jobResponse.payment.downpayment)" -ForegroundColor Gray
        Write-Host "    Commission: ₱$($jobResponse.payment.commission)" -ForegroundColor Gray
        Write-Host "    Total: ₱$($jobResponse.payment.total)" -ForegroundColor Gray
    }
    
    # Success summary
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    Write-Host "✓ Job invitation sent to Devante Agency" -ForegroundColor Green
    Write-Host "`nNext Steps:" -ForegroundColor Yellow
    Write-Host "  1. Devante agency will see this in 'Pending Invites' tab" -ForegroundColor Gray
    Write-Host "  2. Agency can accept or reject the invitation" -ForegroundColor Gray
    Write-Host "  3. If accepted, agency assigns an employee" -ForegroundColor Gray
    Write-Host "  4. Employee performs the work" -ForegroundColor Gray
    Write-Host "  5. After completion, final payment is released" -ForegroundColor Gray
    
} catch {
    Write-Host "`n✗ Failed to create agency invitation" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
    
    exit 1
}
