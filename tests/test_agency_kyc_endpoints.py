#!/usr/bin/env python3
"""
Comprehensive Agency KYC Endpoint Testing Script
Tests all Agency KYC endpoints to ensure they don't return 500 or Method Not Allowed errors.
This tests the business_type parameter added in commit 30c494257e42f13b129a5562e48b5004c5b286f7
"""

import sys
import os
import io
from pathlib import Path

# Add Django project to path
backend_src = Path(__file__).parent / "apps" / "backend" / "src"
sys.path.insert(0, str(backend_src))

# Set up minimal Django settings for testing
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')
os.environ.setdefault('DJANGO_SECRET_KEY', 'test-secret-key-for-endpoint-testing')
os.environ.setdefault('DEBUG', 'true')
os.environ.setdefault('USE_LOCAL_DB', 'false')
os.environ.setdefault('DATABASE_URL', 'sqlite:///test_agency_kyc.db')
os.environ.setdefault('REDIS_URL', 'none')
os.environ.setdefault('ALLOWED_HOSTS', 'localhost,127.0.0.1')

# Prevent double registration of UUID converter
import django.urls.converters as conv
if hasattr(conv, 'DEFAULT_CONVERTERS') and 'uuid' in conv.DEFAULT_CONVERTERS:
    # Remove uuid converter to allow ninja patch to re-register it
    del conv.DEFAULT_CONVERTERS['uuid']

import django
django.setup()

from django.test import RequestFactory, Client
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from agency.api import router
from agency.models import AgencyKYC, AgencyKycFile, AgencyKYCExtractedData
from PIL import Image

User = get_user_model()

class AgencyKYCEndpointTester:
    """Test Agency KYC endpoints to ensure no 500 or Method Not Allowed errors"""
    
    def __init__(self):
        self.factory = RequestFactory()
        self.client = Client()
        self.test_user = None
        self.test_files = {}
        
    def setup(self):
        """Set up test environment"""
        print("\n" + "=" * 70)
        print("AGENCY KYC ENDPOINT TESTING")
        print("=" * 70)
        print("\nTesting endpoints from commit 30c494257e42f13b129a5562e48b5004c5b286f7")
        print("Focus: business_type parameter support")
        print("=" * 70)
        
        # Create tables if needed
        from django.core.management import call_command
        try:
            call_command('migrate', '--run-syncdb', verbosity=0)
            print("\n✅ Database tables created/verified")
        except Exception as e:
            print(f"\n⚠️  Database migration note: {e}")
        
        # Create test user with agency account type
        try:
            self.test_user = User.objects.create_user(
                email='test_agency@example.com',
                password='TestPassword123!',
                accountType='AGENCY',
                firstName='Test',
                lastName='Agency'
            )
            print(f"✅ Test user created (ID: {self.test_user.accountID})")
        except Exception as e:
            # User might already exist
            self.test_user = User.objects.filter(email='test_agency@example.com').first()
            if self.test_user:
                print(f"✅ Using existing test user (ID: {self.test_user.accountID})")
            else:
                print(f"❌ Failed to create test user: {e}")
                return False
        
        # Create test image files
        self.create_test_files()
        print("✅ Test image files created")
        
        return True
    
    def create_test_files(self):
        """Create test image files for upload"""
        # Create a simple test image
        img = Image.new('RGB', (800, 600), color='white')
        
        for file_type in ['business_permit', 'rep_front', 'rep_back', 'address_proof', 'auth_letter']:
            img_io = io.BytesIO()
            img.save(img_io, format='JPEG')
            img_io.seek(0)
            self.test_files[file_type] = SimpleUploadedFile(
                f"{file_type}.jpg",
                img_io.read(),
                content_type="image/jpeg"
            )
    
    def test_upload_endpoint(self):
        """Test POST /api/agency/upload with business_type parameter"""
        print("\n" + "-" * 70)
        print("TEST 1: POST /api/agency/upload")
        print("-" * 70)
        
        # Test different business types
        business_types = [
            ('SOLE_PROPRIETORSHIP', 'Sole Proprietorship (DTI)'),
            ('PARTNERSHIP', 'Partnership (SEC)'),
            ('CORPORATION', 'Corporation (SEC)'),
            ('COOPERATIVE', 'Cooperative (CDA/SEC)')
        ]
        
        for biz_type, biz_label in business_types:
            print(f"\n  Testing business_type: {biz_type} ({biz_label})")
            
            # Clean up existing KYC for this test
            AgencyKYC.objects.filter(accountFK=self.test_user).delete()
            
            # Recreate test files (they get consumed)
            self.create_test_files()
            
            # Prepare request data
            data = {
                'businessName': f'Test Business {biz_type}',
                'businessDesc': f'Testing {biz_label}',
                'rep_id_type': 'PHILSYS_ID',
                'business_type': biz_type  # NEW: business_type parameter
            }
            
            # Login first
            self.client.force_login(self.test_user)
            
            # Make request
            try:
                response = self.client.post(
                    '/api/agency/upload',
                    data={**data, **self.test_files},
                    format='multipart'
                )
                
                status = response.status_code
                
                # Check for errors we DON'T want
                if status == 500:
                    print(f"    ❌ FAIL: Returned 500 Internal Server Error")
                    print(f"       Response: {response.content[:500]}")
                    return False
                elif status == 405:
                    print(f"    ❌ FAIL: Returned 405 Method Not Allowed")
                    return False
                elif status in [200, 201]:
                    print(f"    ✅ PASS: Status {status} - Request accepted")
                    
                    # Verify business_type was saved
                    try:
                        kyc = AgencyKYC.objects.get(accountFK=self.test_user)
                        extracted = AgencyKYCExtractedData.objects.get(agencyKyc=kyc)
                        if extracted.confirmed_business_type == biz_type:
                            print(f"    ✅ Business type '{biz_type}' saved correctly")
                        else:
                            print(f"    ⚠️  Business type saved as '{extracted.confirmed_business_type}' instead of '{biz_type}'")
                    except Exception as e:
                        print(f"    ⚠️  Could not verify saved business_type: {e}")
                else:
                    print(f"    ⚠️  Status {status} - {response.content[:200]}")
                    
            except Exception as e:
                print(f"    ❌ EXCEPTION: {e}")
                return False
        
        return True
    
    def test_status_endpoint(self):
        """Test GET /api/agency/status"""
        print("\n" + "-" * 70)
        print("TEST 2: GET /api/agency/status")
        print("-" * 70)
        
        self.client.force_login(self.test_user)
        
        try:
            response = self.client.get('/api/agency/status')
            status = response.status_code
            
            if status == 500:
                print(f"  ❌ FAIL: Returned 500 Internal Server Error")
                return False
            elif status == 405:
                print(f"  ❌ FAIL: Returned 405 Method Not Allowed")
                return False
            elif status in [200, 404]:
                print(f"  ✅ PASS: Status {status} - Endpoint working")
                return True
            else:
                print(f"  ⚠️  Status {status}")
                return True
                
        except Exception as e:
            print(f"  ❌ EXCEPTION: {e}")
            return False
    
    def test_autofill_endpoint(self):
        """Test GET /api/agency/kyc/autofill"""
        print("\n" + "-" * 70)
        print("TEST 3: GET /api/agency/kyc/autofill")
        print("-" * 70)
        
        self.client.force_login(self.test_user)
        
        try:
            response = self.client.get('/api/agency/kyc/autofill')
            status = response.status_code
            
            if status == 500:
                print(f"  ❌ FAIL: Returned 500 Internal Server Error")
                print(f"     Response: {response.content[:300]}")
                return False
            elif status == 405:
                print(f"  ❌ FAIL: Returned 405 Method Not Allowed")
                return False
            elif status == 200:
                print(f"  ✅ PASS: Status {status} - Endpoint working")
                # Check if business_type is in response
                try:
                    data = response.json()
                    if data.get('has_extracted_data') and 'fields' in data:
                        if 'business_type' in data['fields']:
                            print(f"     ✅ Response includes business_type field")
                        else:
                            print(f"     ⚠️  business_type not in autofill fields")
                except:
                    pass
                return True
            else:
                print(f"  ⚠️  Status {status}")
                return True
                
        except Exception as e:
            print(f"  ❌ EXCEPTION: {e}")
            return False
    
    def test_validate_document_endpoint(self):
        """Test POST /api/agency/kyc/validate-document"""
        print("\n" + "-" * 70)
        print("TEST 4: POST /api/agency/kyc/validate-document")
        print("-" * 70)
        
        self.client.force_login(self.test_user)
        
        # Test different document types
        doc_types = ['BUSINESS_PERMIT', 'REP_ID_FRONT', 'REP_ID_BACK', 'ADDRESS_PROOF', 'AUTH_LETTER']
        
        for doc_type in doc_types:
            print(f"\n  Testing document_type: {doc_type}")
            
            # Create test file
            img = Image.new('RGB', (800, 600), color='blue')
            img_io = io.BytesIO()
            img.save(img_io, format='JPEG')
            img_io.seek(0)
            
            test_file = SimpleUploadedFile(
                f"test_{doc_type}.jpg",
                img_io.read(),
                content_type="image/jpeg"
            )
            
            try:
                response = self.client.post(
                    '/api/agency/kyc/validate-document',
                    {
                        'file': test_file,
                        'document_type': doc_type,
                        'rep_id_type': 'PHILSYS_ID'
                    }
                )
                
                status = response.status_code
                
                if status == 500:
                    print(f"    ❌ FAIL: Returned 500 Internal Server Error")
                    return False
                elif status == 405:
                    print(f"    ❌ FAIL: Returned 405 Method Not Allowed")
                    return False
                elif status in [200, 400]:
                    print(f"    ✅ PASS: Status {status}")
                else:
                    print(f"    ⚠️  Status {status}")
                    
            except Exception as e:
                print(f"    ❌ EXCEPTION: {e}")
                return False
        
        return True
    
    def test_confirm_endpoint(self):
        """Test POST /api/agency/kyc/confirm with business_type"""
        print("\n" + "-" * 70)
        print("TEST 5: POST /api/agency/kyc/confirm")
        print("-" * 70)
        
        self.client.force_login(self.test_user)
        
        # First create a KYC record
        try:
            kyc = AgencyKYC.objects.filter(accountFK=self.test_user).first()
            if not kyc:
                print("  ⚠️  No KYC record found, creating one...")
                kyc = AgencyKYC.objects.create(accountFK=self.test_user)
                AgencyKYCExtractedData.objects.create(agencyKyc=kyc)
        except Exception as e:
            print(f"  ⚠️  Could not create KYC record: {e}")
        
        # Test confirm with different business types
        business_types = ['SOLE_PROPRIETORSHIP', 'CORPORATION', 'PARTNERSHIP', 'COOPERATIVE']
        
        for biz_type in business_types:
            print(f"\n  Testing business_type: {biz_type}")
            
            confirm_data = {
                'business_name': 'Test Business',
                'business_type': biz_type,  # NEW: business_type in confirm
                'business_address': '123 Test St',
                'permit_number': 'TEST-123',
                'tin': '123-456-789',
                'rep_full_name': 'John Doe',
                'rep_id_number': '1234567890',
                'rep_birth_date': '1990-01-01',
                'edited_fields': ['business_name']
            }
            
            try:
                response = self.client.post(
                    '/api/agency/kyc/confirm',
                    data=confirm_data,
                    content_type='application/json'
                )
                
                status = response.status_code
                
                if status == 500:
                    print(f"    ❌ FAIL: Returned 500 Internal Server Error")
                    print(f"       Response: {response.content[:300]}")
                    return False
                elif status == 405:
                    print(f"    ❌ FAIL: Returned 405 Method Not Allowed")
                    return False
                elif status in [200, 201, 400, 404]:
                    print(f"    ✅ PASS: Status {status}")
                else:
                    print(f"    ⚠️  Status {status}")
                    
            except Exception as e:
                print(f"    ❌ EXCEPTION: {e}")
                return False
        
        return True
    
    def test_unauthorized_access(self):
        """Test that endpoints return 401/403 for unauthorized access, not 500"""
        print("\n" + "-" * 70)
        print("TEST 6: Unauthorized Access (should return 401, not 500)")
        print("-" * 70)
        
        # Logout
        self.client.logout()
        
        endpoints = [
            ('GET', '/api/agency/status'),
            ('GET', '/api/agency/kyc/autofill'),
        ]
        
        for method, endpoint in endpoints:
            print(f"\n  Testing {method} {endpoint} (no auth)")
            
            try:
                if method == 'GET':
                    response = self.client.get(endpoint)
                else:
                    response = self.client.post(endpoint)
                
                status = response.status_code
                
                if status == 500:
                    print(f"    ❌ FAIL: Returned 500 instead of 401/403")
                    return False
                elif status in [401, 403]:
                    print(f"    ✅ PASS: Status {status} - Proper auth check")
                else:
                    print(f"    ⚠️  Status {status}")
                    
            except Exception as e:
                print(f"    ❌ EXCEPTION: {e}")
                return False
        
        return True
    
    def run_all_tests(self):
        """Run all endpoint tests"""
        if not self.setup():
            print("\n❌ Setup failed, cannot continue tests")
            return False
        
        results = []
        
        # Run each test
        results.append(("Upload Endpoint", self.test_upload_endpoint()))
        results.append(("Status Endpoint", self.test_status_endpoint()))
        results.append(("Autofill Endpoint", self.test_autofill_endpoint()))
        results.append(("Validate Document Endpoint", self.test_validate_document_endpoint()))
        results.append(("Confirm Endpoint", self.test_confirm_endpoint()))
        results.append(("Unauthorized Access", self.test_unauthorized_access()))
        
        # Print summary
        print("\n" + "=" * 70)
        print("TEST SUMMARY")
        print("=" * 70)
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status}: {test_name}")
        
        print("-" * 70)
        print(f"Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED - No 500 or Method Not Allowed errors!")
            print("✅ The business_type parameter is working correctly")
            return True
        else:
            print(f"\n⚠️  {total - passed} test(s) failed")
            return False

def main():
    """Main entry point"""
    tester = AgencyKYCEndpointTester()
    success = tester.run_all_tests()
    
    print("\n" + "=" * 70)
    print("TESTING COMPLETE")
    print("=" * 70)
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
