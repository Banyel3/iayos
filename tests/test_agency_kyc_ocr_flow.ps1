# Agency KYC OCR Flow Test Script
# Tests the new autofill-business and autofill-id endpoints

$ErrorActionPreference = "Stop"

# Configuration
$API_BASE = "https://api.iayos.online"
$EMAIL = "gamerofgames76@gmail.com"
$PASSWORD = "VanielCornelio_123"

Write-Host "`n=== Agency KYC OCR Flow Test ===" -ForegroundColor Cyan
Write-Host "API: $API_BASE`n" -ForegroundColor Gray

# Step 1: Login
Write-Host "[1/6] Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = $EMAIL
    password = $PASSWORD
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "$API_BASE/api/accounts/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody `
    -SessionVariable session

if ($loginResponse.StatusCode -eq 200) {
    Write-Host "✓ Login successful" -ForegroundColor Green
} else {
    Write-Host "✗ Login failed" -ForegroundColor Red
    exit 1
}

# Step 2: Check test images
Write-Host "`n[2/6] Checking test images..." -ForegroundColor Yellow
$dtiCert = "c:\code\iayos\tests\test_images\dti_certificate.jpg"
$idFront = "c:\code\iayos\tests\test_images\drivers_license.jpg"
$idBack = "c:\code\iayos\tests\test_images\landing_page.jpg"

# Create test images directory if needed
if (-not (Test-Path "c:\code\iayos\tests\test_images")) {
    New-Item -ItemType Directory -Path "c:\code\iayos\tests\test_images" | Out-Null
}

# Download the attached images
Write-Host "  Downloading test images from attachments..." -ForegroundColor Gray

# For now, check if they exist
if (-not (Test-Path $dtiCert)) {
    Write-Host "  ⚠ DTI certificate not found, will need to download" -ForegroundColor Yellow
}
if (-not (Test-Path $idFront)) {
    Write-Host "  ⚠ Driver's License not found, will need to download" -ForegroundColor Yellow
}
if (-not (Test-Path $idBack)) {
    Write-Host "  ⚠ Landing page (back ID) not found, will need to download" -ForegroundColor Yellow
}

Write-Host "✓ Test images check complete" -ForegroundColor Green

# Step 3: Validate Business Permit
Write-Host "`n[3/6] Validating business permit..." -ForegroundColor Yellow
if (Test-Path $dtiCert) {
    $form = @{
        file = Get-Item -Path $dtiCert
        document_type = "BUSINESS_PERMIT"
    }
    
    try {
        $validateResponse = Invoke-WebRequest -Uri "$API_BASE/api/agency/kyc/validate-document" `
            -Method POST `
            -Form $form `
            -WebSession $session
        
        $validateData = $validateResponse.Content | ConvertFrom-Json
        Write-Host "  Valid: $($validateData.valid)" -ForegroundColor $(if ($validateData.valid) { "Green" } else { "Red" })
        if ($validateData.file_hash) {
            Write-Host "  File Hash: $($validateData.file_hash)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  ⚠ Validation request failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⊘ Skipping - DTI certificate not found" -ForegroundColor Yellow
}

# Step 4: Autofill Business Data (OCR)
Write-Host "`n[4/6] Testing autofill-business endpoint..." -ForegroundColor Yellow
if (Test-Path $dtiCert) {
    $form = @{
        business_permit = Get-Item -Path $dtiCert
        business_type = "SOLE_PROPRIETORSHIP"
    }
    
    try {
        $autofillResponse = Invoke-WebRequest -Uri "$API_BASE/api/agency/kyc/autofill-business" `
            -Method POST `
            -Form $form `
            -WebSession $session
        
        $autofillData = $autofillResponse.Content | ConvertFrom-Json
        Write-Host "  Success: $($autofillData.success)" -ForegroundColor Green
        Write-Host "  Confidence: $([math]::Round($autofillData.confidence * 100, 2))%" -ForegroundColor Cyan
        
        if ($autofillData.fields) {
            Write-Host "`n  Extracted Fields:" -ForegroundColor Cyan
            Write-Host "    Business Name: $($autofillData.fields.business_name)" -ForegroundColor Gray
            Write-Host "    DTI Number: $($autofillData.fields.dti_number)" -ForegroundColor Gray
            Write-Host "    Permit Number: $($autofillData.fields.permit_number)" -ForegroundColor Gray
            Write-Host "    Address: $($autofillData.fields.business_address)" -ForegroundColor Gray
            
            # Verify expected values
            Write-Host "`n  Data Validation:" -ForegroundColor Cyan
            $expectedBusinessName = "DEVANTE SOFTWARE DEVELOPMENT SERVICES"
            if ($autofillData.fields.business_name -eq $expectedBusinessName) {
                Write-Host "    ✓ Business Name: CORRECT" -ForegroundColor Green
            } else {
                Write-Host "    ✗ Business Name: INCORRECT (expected '$expectedBusinessName')" -ForegroundColor Red
            }
            
            if ($autofillData.fields.dti_number) {
                Write-Host "    ✓ DTI Number: EXTRACTED ($($autofillData.fields.dti_number))" -ForegroundColor Green
            } else {
                Write-Host "    ✗ DTI Number: MISSING" -ForegroundColor Red
            }
            
            if ($autofillData.fields.permit_number) {
                Write-Host "    ✓ Permit Number: EXTRACTED ($($autofillData.fields.permit_number))" -ForegroundColor Green
            } else {
                Write-Host "    ✗ Permit Number: MISSING" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "  ✗ Autofill business failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "  ⊘ Skipping - DTI certificate not found" -ForegroundColor Yellow
}

# Step 5: Validate Rep ID Front
Write-Host "`n[5/6] Validating representative ID front..." -ForegroundColor Yellow
if (Test-Path $idFront) {
    $form = @{
        file = Get-Item -Path $idFront
        document_type = "REP_ID_FRONT"
        rep_id_type = "DRIVERS_LICENSE"
    }
    
    try {
        $validateResponse = Invoke-WebRequest -Uri "$API_BASE/api/agency/kyc/validate-document" `
            -Method POST `
            -Form $form `
            -WebSession $session
        
        $validateData = $validateResponse.Content | ConvertFrom-Json
        Write-Host "  Valid: $($validateData.valid)" -ForegroundColor $(if ($validateData.valid) { "Green" } else { "Red" })
        if ($validateData.details) {
            Write-Host "  Face Detected: $(-not $validateData.details.face_detection_skipped)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  ⚠ Validation request failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⊘ Skipping - PhilSys ID not found" -ForegroundColor Yellow
}

# Step 6: Autofill Representative ID Data (OCR)
Write-Host "`n[6/6] Testing autofill-id endpoint..." -ForegroundColor Yellow
if (Test-Path $idFront) {
    $form = @{
        id_front = Get-Item -Path $idFront
        id_type = "DRIVERS_LICENSE"
    }
    
    try {
        $autofillResponse = Invoke-WebRequest -Uri "$API_BASE/api/agency/kyc/autofill-id" `
            -Method POST `
            -Form $form `
            -WebSession $session
        
        $autofillData = $autofillResponse.Content | ConvertFrom-Json
        Write-Host "  Success: $($autofillData.success)" -ForegroundColor Green
        Write-Host "  Confidence: $([math]::Round($autofillData.confidence * 100, 2))%" -ForegroundColor Cyan
        
        if ($autofillData.fields) {
            Write-Host "`n  Extracted Fields:" -ForegroundColor Cyan
            Write-Host "    Full Name: $($autofillData.fields.rep_full_name)" -ForegroundColor Gray
            Write-Host "    ID Number: $($autofillData.fields.rep_id_number)" -ForegroundColor Gray
            Write-Host "    Birth Date: $($autofillData.fields.rep_birth_date)" -ForegroundColor Gray
            Write-Host "    Address: $($autofillData.fields.rep_address)" -ForegroundColor Gray
            
            # Verify expected values
            Write-Host "`n  Data Validation:" -ForegroundColor Cyan
            $expectedFullName = "Arthur Planta Tugade"
            $expectedLastName = "Tugade"
            $expectedFirstName = "Arthur"
            $expectedMiddleName = "Planta"
            
            if ($autofillData.fields.rep_full_name -eq $expectedFullName) {
                Write-Host "    ✓ Full Name: CORRECT ($expectedFullName)" -ForegroundColor Green
            } else {
                Write-Host "    ✗ Full Name: INCORRECT" -ForegroundColor Red
                Write-Host "      Expected: $expectedFullName" -ForegroundColor Yellow
                Write-Host "      Got: $($autofillData.fields.rep_full_name)" -ForegroundColor Yellow
            }
            
            # Check if name components are in the full name
            $fullName = $autofillData.fields.rep_full_name
            if ($fullName -match $expectedFirstName) {
                Write-Host "    ✓ First Name: FOUND ('$expectedFirstName' in name)" -ForegroundColor Green
            } else {
                Write-Host "    ✗ First Name: NOT FOUND (expected '$expectedFirstName')" -ForegroundColor Red
            }
            
            if ($fullName -match $expectedMiddleName) {
                Write-Host "    ✓ Middle Name: FOUND ('$expectedMiddleName' in name)" -ForegroundColor Green
            } else {
                Write-Host "    ✗ Middle Name: NOT FOUND (expected '$expectedMiddleName')" -ForegroundColor Red
            }
            
            if ($fullName -match $expectedLastName) {
                Write-Host "    ✓ Last Name: FOUND ('$expectedLastName' in name)" -ForegroundColor Green
            } else {
                Write-Host "    ✗ Last Name: NOT FOUND (expected '$expectedLastName')" -ForegroundColor Red
            }
            
            if ($autofillData.fields.rep_id_number) {
                Write-Host "    ✓ ID Number: EXTRACTED ($($autofillData.fields.rep_id_number))" -ForegroundColor Green
            } else {
                Write-Host "    ⚠ ID Number: MISSING" -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "  ✗ Autofill ID failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "  ⊘ Skipping - PhilSys ID not found" -ForegroundColor Yellow
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host "Check results above for OCR extraction accuracy`n" -ForegroundColor Gray
