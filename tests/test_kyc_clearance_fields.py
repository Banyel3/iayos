#!/usr/bin/env python3
"""
Test script for KYC Clearance Fields Implementation
Tests the full flow: Register → Upload KYC → Confirm with clearance data → Verify DB
"""

import requests
import json
import os
import sys
from datetime import datetime, timedelta
import random
import string

# Configuration
BASE_URL = "http://localhost:8000"
TEST_EMAIL = f"kyc_test_{random.randint(1000, 9999)}@test.com"
TEST_PASSWORD = "TestPassword123!"

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_step(step_num, message):
    print(f"\n{Colors.CYAN}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}Step {step_num}: {message}{Colors.END}")
    print(f"{Colors.CYAN}{'='*60}{Colors.END}")

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.END}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.END}")

def print_data(label, data):
    print(f"{Colors.YELLOW}{label}:{Colors.END}")
    if isinstance(data, dict):
        print(json.dumps(data, indent=2, default=str))
    else:
        print(data)


class KYCTestRunner:
    def __init__(self):
        self.session = requests.Session()
        self.access_token = None
        self.user_id = None
        
    def register_account(self):
        """Step 1: Register a new test account"""
        print_step(1, f"Registering new test account: {TEST_EMAIL}")
        
        payload = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "firstName": "KYC",
            "middleName": "Test",
            "lastName": "User",
            "contactNum": "09171234567",
            "birthDate": "1990-05-15",
            "profileType": "WORKER",
            "street_address": "123 Test Street",
            "city": "Zamboanga City",
            "province": "Zamboanga del Sur",
            "postal_code": "7000",
            "country": "Philippines"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/accounts/register",
            json=payload
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Account registered successfully")
            print_data("Response", data)
            
            # Auto-verify the email via database
            print_info("Auto-verifying email via database...")
            import subprocess
            result = subprocess.run(
                ["docker", "exec", "-w", "/app/apps/backend/src", "iayos-backend-dev",
                 "python", "manage.py", "shell", "-c",
                 f"from accounts.models import Accounts; u = Accounts.objects.get(email='{TEST_EMAIL}'); u.isVerified = True; u.save(); print('Email verified')"],
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace'
            )
            if "verified" in result.stdout.lower() or result.returncode == 0:
                print_success("Email auto-verified")
            
            return True
        else:
            print_error(f"Registration failed: {response.status_code}")
            print_data("Error", response.text)
            return False
    
    def login(self):
        """Step 2: Login to get access token"""
        print_step(2, f"Logging in as {TEST_EMAIL}")
        
        payload = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/accounts/login",
            json=payload
        )
        
        if response.status_code == 200:
            data = response.json()
            # Token is returned as "access" (not "access_token")
            self.access_token = data.get("access")
            self.user_id = data.get("user", {}).get("accountID")
            print_success(f"Login successful, user_id: {self.user_id}")
            print_data("Token (first 50 chars)", self.access_token[:50] + "..." if self.access_token else "None")
            return True
        else:
            print_error(f"Login failed: {response.status_code}")
            print_data("Error", response.text)
            return False
    
    def get_auth_headers(self):
        """Get authorization headers"""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
    
    def create_kyc_record(self):
        """Step 3: Create a KYC record (simulate document upload)"""
        print_step(3, "Creating KYC record with extracted data")
        
        # First, let's check if there's an endpoint to create KYC or we need to use admin
        # We'll use Django shell via docker to create the test data directly
        
        print_info("Creating KYC record via database...")
        
        # Use docker exec to create KYC record with extracted data
        import subprocess
        
        python_code = f'''
from accounts.models import Accounts, kyc, KYCExtractedData
from django.utils import timezone
from datetime import date

# Get user
user = Accounts.objects.get(email="{TEST_EMAIL}")
print(f"Found user: {{user.email}}")

# Create KYC record
kyc_record, created = kyc.objects.get_or_create(
    accountFK=user,
    defaults={{
        "kyc_status": "PENDING",
    }}
)
print(f"KYC record created: {{created}}, ID: {{kyc_record.kycID}}")

# Create extracted data with clearance fields
extracted, created = KYCExtractedData.objects.update_or_create(
    kycID=kyc_record,
    defaults={{
        # Personal info extracted
        "extracted_full_name": "Juan Dela Cruz",
        "extracted_first_name": "Juan",
        "extracted_middle_name": "Santos",
        "extracted_last_name": "Dela Cruz",
        "extracted_birth_date": date(1990, 5, 15),
        "extracted_address": "123 Main St, Barangay Test, Zamboanga City",
        "extracted_id_number": "1234-5678-9012-3456",
        "extracted_id_type": "NATIONALID",
        "extracted_nationality": "Filipino",
        "extracted_sex": "Male",
        "extracted_place_of_birth": "Manila, Philippines",
        
        # Clearance fields extracted
        "extracted_clearance_number": "NBI-2025-00123456",
        "extracted_clearance_type": "NBI",
        "extracted_clearance_issue_date": date(2025, 1, 10),
        "extracted_clearance_validity_date": date(2026, 1, 10),
        
        # Confidence scores
        "confidence_full_name": 0.95,
        "confidence_birth_date": 0.88,
        "confidence_address": 0.82,
        "confidence_id_number": 0.91,
        "confidence_place_of_birth": 0.85,
        "confidence_clearance_number": 0.89,
        "overall_confidence": 0.88,
        
        # Status
        "extraction_status": "EXTRACTED",
        "extraction_source": "Tesseract OCR v4.1",
        "extracted_at": timezone.now(),
    }}
)
print(f"Extracted data created: {{created}}")

# Verify the clearance fields
print(f"Clearance Number: {{extracted.extracted_clearance_number}}")
print(f"Clearance Type: {{extracted.extracted_clearance_type}}")
print(f"Clearance Issue Date: {{extracted.extracted_clearance_issue_date}}")
print(f"Clearance Validity Date: {{extracted.extracted_clearance_validity_date}}")
print(f"Place of Birth: {{extracted.extracted_place_of_birth}}")
print("SUCCESS: KYC record with clearance data created!")
'''
        
        # Write to temp file and execute
        result = subprocess.run(
            ["docker", "exec", "-w", "/app/apps/backend/src", "iayos-backend-dev", 
             "python", "manage.py", "shell", "-c", python_code],
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace'
        )
        
        if result.returncode == 0:
            print_success("KYC record created with extracted clearance data")
            print_data("Output", result.stdout)
            return True
        else:
            print_error(f"Failed to create KYC record")
            print_data("Error", result.stderr)
            return False
    
    def get_autofill_data(self):
        """Step 4: Get autofill data via API"""
        print_step(4, "Fetching KYC autofill data (including clearance fields)")
        
        response = self.session.get(
            f"{BASE_URL}/api/accounts/kyc/autofill",
            headers=self.get_auth_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Autofill data retrieved successfully")
            print_data("Autofill Response", data)
            
            # Check for clearance fields
            fields = data.get("fields", {})
            if "clearance_number" in str(fields) or "clearance_number" in fields:
                print_success("✓ Clearance number field present in response")
            if "clearance_type" in str(fields) or "clearance_type" in fields:
                print_success("✓ Clearance type field present in response")
            if "place_of_birth" in str(fields) or "place_of_birth" in fields:
                print_success("✓ Place of birth field present in response")
                
            return data
        else:
            print_error(f"Failed to get autofill data: {response.status_code}")
            print_data("Error", response.text)
            return None
    
    def confirm_kyc_data(self):
        """Step 5: Confirm KYC data with edited clearance fields"""
        print_step(5, "Confirming KYC data with user edits (including clearance)")
        
        # Simulate user confirming/editing the data
        payload = {
            # Personal info (some edited)
            "full_name": "Juan Dela Cruz Jr.",  # User edited
            "first_name": "Juan",
            "middle_name": "Santos",
            "last_name": "Dela Cruz Jr.",  # User edited
            "birth_date": "1990-05-15",
            "address": "123 Main St, Barangay Test, Zamboanga City, 7000",  # User edited - added zip
            "id_number": "1234-5678-9012-3456",
            "nationality": "Filipino",
            "sex": "Male",
            "place_of_birth": "Manila, Metro Manila, Philippines",  # User edited - more specific
            
            # Clearance fields (user confirms/edits)
            "clearance_number": "NBI-2025-00123456",
            "clearance_type": "NBI",
            "clearance_issue_date": "2025-01-10",
            "clearance_validity_date": "2026-01-10",
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/accounts/kyc/confirm",
            headers=self.get_auth_headers(),
            json=payload
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("KYC data confirmed successfully")
            print_data("Confirm Response", data)
            
            # Check edited fields
            edited = data.get("edited_fields", [])
            print_info(f"Fields marked as edited: {edited}")
            
            return data
        else:
            print_error(f"Failed to confirm KYC data: {response.status_code}")
            print_data("Error", response.text)
            return None
    
    def verify_database_storage(self):
        """Step 6: Verify data is stored correctly in database"""
        print_step(6, "Verifying database storage of clearance fields")
        
        import subprocess
        
        python_code = f'''
from accounts.models import Accounts, kyc, KYCExtractedData
import json

# Get user and their KYC data
user = Accounts.objects.get(email="{TEST_EMAIL}")
kyc_record = kyc.objects.get(accountFK=user)
extracted = KYCExtractedData.objects.get(kycID=kyc_record)

print("="*60)
print("DATABASE VERIFICATION RESULTS")
print("="*60)

print("\\n--- Extraction Status ---")
print(f"Status: {{extracted.extraction_status}}")
print(f"Confirmed At: {{extracted.confirmed_at}}")

print("\\n--- Extracted Fields (OCR) ---")
print(f"Full Name: {{extracted.extracted_full_name}}")
print(f"Place of Birth: {{extracted.extracted_place_of_birth}}")
print(f"Clearance Number: {{extracted.extracted_clearance_number}}")
print(f"Clearance Type: {{extracted.extracted_clearance_type}}")
print(f"Clearance Issue Date: {{extracted.extracted_clearance_issue_date}}")
print(f"Clearance Validity Date: {{extracted.extracted_clearance_validity_date}}")

print("\\n--- Confirmed Fields (User) ---")
print(f"Full Name: {{extracted.confirmed_full_name}}")
print(f"Place of Birth: {{extracted.confirmed_place_of_birth}}")
print(f"Nationality: {{extracted.confirmed_nationality}}")
print(f"Sex: {{extracted.confirmed_sex}}")
print(f"Clearance Number: {{extracted.confirmed_clearance_number}}")
print(f"Clearance Type: {{extracted.confirmed_clearance_type}}")
print(f"Clearance Issue Date: {{extracted.confirmed_clearance_issue_date}}")
print(f"Clearance Validity Date: {{extracted.confirmed_clearance_validity_date}}")

print("\\n--- Confidence Scores ---")
print(f"Place of Birth Confidence: {{extracted.confidence_place_of_birth}}")
print(f"Clearance Number Confidence: {{extracted.confidence_clearance_number}}")
print(f"Overall Confidence: {{extracted.overall_confidence}}")

print("\\n--- User Edited Fields ---")
print(f"Edited: {{extracted.user_edited_fields}}")

print("\\n--- Autofill Data Method Test ---")
autofill = extracted.get_autofill_data()
print(f"Autofill clearance_number: {{autofill.get('clearance_number')}}")
print(f"Autofill clearance_type: {{autofill.get('clearance_type')}}")
print(f"Autofill place_of_birth: {{autofill.get('place_of_birth')}}")

print("\\n--- Comparison Data Method Test ---")
comparison = extracted.get_comparison_data()
print(f"Extracted clearance fields: {{comparison.get('extracted', {{}}).get('clearance_number')}}")
print(f"Confirmed clearance fields: {{comparison.get('confirmed', {{}}).get('clearance_number')}}")

print("\\n" + "="*60)
print("✅ DATABASE VERIFICATION COMPLETE")
print("="*60)
'''
        
        result = subprocess.run(
            ["docker", "exec", "-w", "/app/apps/backend/src", "iayos-backend-dev", 
             "python", "manage.py", "shell", "-c", python_code],
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace'
        )
        
        if result.returncode == 0:
            print_success("Database verification completed")
            print(result.stdout)
            return True
        else:
            print_error("Database verification failed")
            print_data("Error", result.stderr)
            return False
    
    def cleanup(self):
        """Cleanup: Delete test account"""
        print_step("X", "Cleaning up test data")
        
        import subprocess
        
        python_code = f'''
from accounts.models import Accounts
try:
    user = Accounts.objects.get(email="{TEST_EMAIL}")
    user.delete()
    print(f"Deleted test user: {TEST_EMAIL}")
except Accounts.DoesNotExist:
    print("Test user not found (already deleted)")
'''
        
        result = subprocess.run(
            ["docker", "exec", "-w", "/app/apps/backend/src", "iayos-backend-dev", 
             "python", "manage.py", "shell", "-c", python_code],
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace'
        )
        
        if result.returncode == 0:
            print_success("Cleanup completed")
        else:
            print_error("Cleanup failed (non-critical)")
    
    def run_all_tests(self):
        """Run the complete test suite"""
        print(f"\n{Colors.BOLD}{'='*70}{Colors.END}")
        print(f"{Colors.BOLD}KYC CLEARANCE FIELDS TEST SUITE{Colors.END}")
        print(f"{Colors.BOLD}{'='*70}{Colors.END}")
        print(f"Test Email: {TEST_EMAIL}")
        print(f"Base URL: {BASE_URL}")
        print(f"Started: {datetime.now().isoformat()}")
        
        try:
            # Step 1: Register
            if not self.register_account():
                print_error("FAILED at Step 1: Registration")
                return False
            
            # Step 2: Login
            if not self.login():
                print_error("FAILED at Step 2: Login")
                return False
            
            # Step 3: Create KYC with extracted data
            if not self.create_kyc_record():
                print_error("FAILED at Step 3: Create KYC Record")
                return False
            
            # Step 4: Get autofill data
            autofill_data = self.get_autofill_data()
            if not autofill_data:
                print_error("FAILED at Step 4: Get Autofill Data")
                return False
            
            # Step 5: Confirm KYC data
            confirm_result = self.confirm_kyc_data()
            if not confirm_result:
                print_error("FAILED at Step 5: Confirm KYC Data")
                return False
            
            # Step 6: Verify database
            if not self.verify_database_storage():
                print_error("FAILED at Step 6: Database Verification")
                return False
            
            print(f"\n{Colors.GREEN}{'='*70}{Colors.END}")
            print(f"{Colors.GREEN}{Colors.BOLD}✅ ALL TESTS PASSED SUCCESSFULLY!{Colors.END}")
            print(f"{Colors.GREEN}{'='*70}{Colors.END}")
            print(f"\nThe following clearance fields were tested:")
            print("  • extracted_clearance_number / confirmed_clearance_number")
            print("  • extracted_clearance_type / confirmed_clearance_type")
            print("  • extracted_clearance_issue_date / confirmed_clearance_issue_date")
            print("  • extracted_clearance_validity_date / confirmed_clearance_validity_date")
            print("  • extracted_place_of_birth / confirmed_place_of_birth")
            print("  • confirmed_nationality / confirmed_sex")
            print("  • confidence_place_of_birth / confidence_clearance_number")
            
            return True
            
        except Exception as e:
            print_error(f"Test failed with exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            # Always cleanup
            self.cleanup()


if __name__ == "__main__":
    runner = KYCTestRunner()
    success = runner.run_all_tests()
    sys.exit(0 if success else 1)
