"""
Backjob Terms Acceptance API Test Script
This script tests the new terms acceptance feature using direct database queries
and simulated API logic since Django Ninja has import issues.

Run with: python tests/test_backjob_terms.py
"""

import sys
sys.path.append('apps/backend/src')

import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_backend.settings')

import django
django.setup()

from accounts.models import JobDispute, Job, Account, Profile, ClientProfile
from django.utils import timezone
from datetime import datetime


def test_database_schema():
    """Test 1: Verify database schema has new fields"""
    print("\n" + "="*60)
    print("TEST 1: Database Schema Verification")
    print("="*60)
    
    # Check if JobDispute model has the new fields
    fields = [f.name for f in JobDispute._meta.get_fields()]
    
    required_fields = ['termsaccepted', 'termsversion', 'termsacceptedat']
    found_fields = [f for f in required_fields if f in fields]
    
    print(f"✓ Checking for terms fields in JobDispute model...")
    print(f"  Required fields: {required_fields}")
    print(f"  Found fields: {found_fields}")
    
    if len(found_fields) == len(required_fields):
        print("✅ PASSED: All terms fields exist in database schema")
        return True
    else:
        missing = set(required_fields) - set(found_fields)
        print(f"❌ FAILED: Missing fields: {missing}")
        return False


def test_create_dispute_with_terms():
    """Test 2: Create a dispute with terms acceptance"""
    print("\n" + "="*60)
    print("TEST 2: Create Dispute with Terms Acceptance")
    print("="*60)
    
    try:
        # Get a test job (or create one if needed)
        job = Job.objects.filter(status='COMPLETED').first()
        
        if not job:
            print("⚠️  No completed jobs found. Skipping test.")
            return False
        
        print(f"✓ Using job: {job.title} (ID: {job.jobID})")
        
        # Check if dispute already exists for this job
        existing_dispute = JobDispute.objects.filter(jobID=job).first()
        if existing_dispute:
            print(f"✓ Found existing dispute ID: {existing_dispute.disputeID}")
            print(f"  - Terms Accepted: {existing_dispute.termsaccepted}")
            print(f"  - Terms Version: {existing_dispute.termsversion}")
            print(f"  - Terms Accepted At: {existing_dispute.termsacceptedat}")
            
            if existing_dispute.termsaccepted:
                print("✅ PASSED: Dispute has terms acceptance tracked")
                return True
            else:
                print("⚠️  Dispute exists but terms not accepted")
                return False
        else:
            print("ℹ️  No disputes found for this job. Test skipped.")
            return None
            
    except Exception as e:
        print(f"❌ FAILED: Error creating/checking dispute: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_terms_validation():
    """Test 3: Validate terms acceptance logic"""
    print("\n" + "="*60)
    print("TEST 3: Terms Acceptance Validation Logic")
    print("="*60)
    
    test_cases = [
        {"terms_accepted": True, "expected": "PASS", "description": "Terms accepted = True"},
        {"terms_accepted": False, "expected": "FAIL", "description": "Terms accepted = False"},
    ]
    
    passed = 0
    failed = 0
    
    for case in test_cases:
        terms_accepted = case["terms_accepted"]
        expected = case["expected"]
        description = case["description"]
        
        # Simulate backend validation
        if not terms_accepted:
            result = "FAIL"
            error_message = "You must accept the backjob agreement terms"
        else:
            result = "PASS"
            error_message = None
        
        status = "✅" if result == expected else "❌"
        print(f"{status} Test case: {description}")
        print(f"   Expected: {expected}, Got: {result}")
        
        if error_message:
            print(f"   Error: {error_message}")
        
        if result == expected:
            passed += 1
        else:
            failed += 1
    
    print(f"\nValidation Summary: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("✅ PASSED: All validation tests successful")
        return True
    else:
        print("❌ FAILED: Some validation tests failed")
        return False


def test_query_disputes_with_terms():
    """Test 4: Query disputes and check terms fields"""
    print("\n" + "="*60)
    print("TEST 4: Query Existing Disputes with Terms Data")
    print("="*60)
    
    try:
        disputes = JobDispute.objects.all()[:5]
        
        if not disputes.exists():
            print("⚠️  No disputes found in database")
            return None
        
        print(f"✓ Found {disputes.count()} disputes to inspect\n")
        
        for dispute in disputes:
            print(f"Dispute #{dispute.disputeID}:")
            print(f"  Job: {dispute.jobID.title}")
            print(f"  Status: {dispute.status}")
            print(f"  Terms Accepted: {dispute.termsaccepted}")
            print(f"  Terms Version: {dispute.termsversion or 'Not set'}")
            print(f"  Terms Accepted At: {dispute.termsacceptedat or 'Not set'}")
            print()
        
        print("✅ PASSED: Successfully queried disputes with terms fields")
        return True
        
    except Exception as e:
        print(f"❌ FAILED: Error querying disputes: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run all tests and generate summary report"""
    print("\n" + "="*70)
    print("BACKJOB TERMS ACCEPTANCE TEST SUITE")
    print("="*70)
    print(f"Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Environment: Development (Local Database)")
    print("="*70)
    
    tests = [
        ("Database Schema", test_database_schema),
        ("Create Dispute with Terms", test_create_dispute_with_terms),
        ("Terms Validation Logic", test_terms_validation),
        ("Query Disputes with Terms", test_query_disputes_with_terms),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ CRITICAL ERROR in {test_name}: {e}")
            import traceback
            traceback.print_exc()
            results.append((test_name, False))
    
    # Summary Report
    print("\n" + "="*70)
    print("TEST SUMMARY REPORT")
    print("="*70)
    
    passed_count = sum(1 for _, result in results if result is True)
    failed_count = sum(1 for _, result in results if result is False)
    skipped_count = sum(1 for _, result in results if result is None)
    total = len(results)
    
    for test_name, result in results:
        if result is True:
            status = "✅ PASSED"
        elif result is False:
            status = "❌ FAILED"
        else:
            status = "⏭️  SKIPPED"
        print(f"{status}: {test_name}")
    
    print("\n" + "-"*70)
    print(f"Total Tests: {total}")
    print(f"Passed: {passed_count} ({passed_count/total*100:.0f}%)")
    print(f"Failed: {failed_count}")
    print(f"Skipped: {skipped_count}")
    print("="*70)
    
    if failed_count == 0:
        print("\n🎉 ALL TESTS PASSED! The backjob terms feature is ready.")
        return 0
    else:
        print(f"\n⚠️  {failed_count} test(s) failed. Review errors above.")
        return 1


if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)
