"""
Diagnostic script to test KYC extraction flow

This script will:
1. Check if OCR text is being stored in kycFiles
2. Check if KYCExtractedData records are being created
3. Test the autofill API endpoint
4. Debug why auto-fill might not be working
"""

import os
import sys
import django

# Add backend to path
backend_path = os.path.join(os.path.dirname(__file__), 'apps', 'backend', 'src')
sys.path.insert(0, backend_path)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import kyc, kycFiles, KYCExtractedData, Accounts
from accounts.kyc_extraction_service import process_kyc_extraction


def diagnose_kyc_extraction():
    """Run comprehensive diagnostics on KYC extraction"""
    
    print("\n" + "="*80)
    print("KYC EXTRACTION DIAGNOSTIC")
    print("="*80 + "\n")
    
    # Step 1: Find recent KYC submissions
    print("📋 STEP 1: Finding recent KYC submissions...")
    recent_kycs = kyc.objects.all().order_by('-createdAt')[:5]
    
    if not recent_kycs:
        print("   ❌ No KYC records found in database")
        return
    
    print(f"   ✅ Found {recent_kycs.count()} recent KYC submissions:\n")
    
    for kyc_record in recent_kycs:
        print(f"\n{'='*80}")
        print(f"KYC #{kyc_record.kycID} - User: {kyc_record.accountFK.email}")
        print(f"Status: {kyc_record.kyc_status} | Created: {kyc_record.createdAt}")
        print(f"{'='*80}\n")
        
        # Step 2: Check for OCR text in kycFiles
        print("   📝 STEP 2: Checking OCR text in kycFiles...")
        kyc_files = kycFiles.objects.filter(kycID=kyc_record)
        
        if not kyc_files:
            print("      ❌ No files found for this KYC")
            continue
        
        files_with_ocr = []
        files_without_ocr = []
        
        for kf in kyc_files:
            if kf.ocr_text and len(kf.ocr_text) > 0:
                files_with_ocr.append((kf.idType, len(kf.ocr_text)))
                print(f"      ✅ {kf.idType or 'UNKNOWN'}: {len(kf.ocr_text)} chars of OCR text")
                print(f"         Preview: {kf.ocr_text[:100].replace(chr(10), ' ')[:100]}...")
            else:
                files_without_ocr.append(kf.idType or 'UNKNOWN')
        
        if files_without_ocr:
            print(f"      ⚠️  No OCR text: {', '.join(files_without_ocr)}")
        
        if not files_with_ocr:
            print("      ❌ PROBLEM: No OCR text found in any file!")
            print("         This means OCR extraction during upload failed or was skipped.")
            continue
        
        # Step 3: Check for KYCExtractedData record
        print("\n   🔍 STEP 3: Checking KYCExtractedData record...")
        
        try:
            extracted = KYCExtractedData.objects.get(kycID=kyc_record)
            print(f"      ✅ KYCExtractedData record EXISTS")
            print(f"         Status: {extracted.extraction_status}")
            print(f"         Confidence: {extracted.overall_confidence or 'N/A'}")
            print(f"         Extracted at: {extracted.extracted_at or 'Never'}")
            
            # Show extracted fields
            print("\n      📊 Extracted Fields:")
            fields_extracted = 0
            fields_empty = 0
            
            field_data = {
                'Full Name': extracted.extracted_full_name,
                'First Name': extracted.extracted_first_name,
                'Middle Name': extracted.extracted_middle_name,
                'Last Name': extracted.extracted_last_name,
                'Date of Birth': str(extracted.extracted_birth_date) if extracted.extracted_birth_date else '',
                'Address': extracted.extracted_address,
                'ID Number': extracted.extracted_id_number,
                'Nationality': extracted.extracted_nationality,
                'Sex': extracted.extracted_sex,
            }
            
            for field_name, field_value in field_data.items():
                if field_value and str(field_value).strip():
                    fields_extracted += 1
                    print(f"         ✅ {field_name}: {field_value}")
                else:
                    fields_empty += 1
                    print(f"         ❌ {field_name}: (empty)")
            
            print(f"\n      Summary: {fields_extracted} fields extracted, {fields_empty} empty")
            
            # Test autofill data generation
            print("\n      🔄 Testing get_autofill_data()...")
            autofill_data = extracted.get_autofill_data()
            
            print("         Auto-fill data fields with values:")
            for field_key, field_obj in autofill_data.items():
                if field_obj['value']:
                    print(f"         ✅ {field_key}: \"{field_obj['value']}\" (confidence: {field_obj['confidence']:.2f}, source: {field_obj['source']})")
            
            # Check if extraction failed
            if extracted.extraction_status == "FAILED":
                print(f"\n      ❌ PROBLEM: Extraction status is FAILED")
                print(f"         Raw extraction data: {extracted.raw_extraction_data}")
            
            elif extracted.extraction_status == "PENDING":
                print(f"\n      ⚠️  PROBLEM: Extraction status still PENDING")
                print(f"         Extraction was triggered but didn't complete")
                print(f"\n      🔧 Attempting manual extraction now...")
                
                try:
                    result = process_kyc_extraction(kyc_record)
                    if result:
                        print(f"         ✅ Manual extraction succeeded!")
                        print(f"            Status: {result.extraction_status}")
                        print(f"            Confidence: {result.overall_confidence:.2f}")
                    else:
                        print(f"         ❌ Manual extraction returned None")
                except Exception as e:
                    print(f"         ❌ Manual extraction failed: {str(e)}")
                    import traceback
                    traceback.print_exc()
            
        except KYCExtractedData.DoesNotExist:
            print(f"      ❌ PROBLEM: KYCExtractedData record DOES NOT EXIST!")
            print(f"         trigger_kyc_extraction_after_upload() was NOT called or FAILED")
            print(f"\n      🔧 Attempting manual extraction now...")
            
            try:
                result = process_kyc_extraction(kyc_record)
                if result:
                    print(f"         ✅ Manual extraction created record!")
                    print(f"            Status: {result.extraction_status}")
                    print(f"            Confidence: {result.overall_confidence:.2f}")
                    print(f"            Full Name: {result.extracted_full_name}")
                    print(f"            DOB: {result.extracted_birth_date}")
                    print(f"            ID#: {result.extracted_id_number}")
                else:
                    print(f"         ❌ Manual extraction returned None (likely no OCR text)")
            except Exception as e:
                print(f"         ❌ Manual extraction failed: {str(e)}")
                import traceback
                traceback.print_exc()
        
        print("\n")  # Spacing between KYC records


def test_autofill_api():
    """Test the autofill API endpoint for a specific user"""
    print("\n" + "="*80)
    print("TESTING /api/accounts/kyc/autofill ENDPOINT")
    print("="*80 + "\n")
    
    # Find a user with KYC
    kyc_record = kyc.objects.filter(kyc_status='PENDING').first()
    
    if not kyc_record:
        print("   ❌ No PENDING KYC found to test")
        return
    
    user = kyc_record.accountFK
    print(f"   Testing with user: {user.email}")
    
    # Simulate API call
    from accounts.api import get_kyc_autofill_data
    
    class MockRequest:
        def __init__(self, auth_user):
            self.auth = auth_user
    
    request = MockRequest(user)
    
    try:
        response = get_kyc_autofill_data(request)
        
        print(f"\n   API Response:")
        print(f"   - success: {response.get('success')}")
        print(f"   - has_extracted_data: {response.get('has_extracted_data')}")
        print(f"   - extraction_status: {response.get('extraction_status')}")
        print(f"   - needs_confirmation: {response.get('needs_confirmation')}")
        
        if response.get('has_extracted_data') and response.get('fields'):
            print(f"\n   Fields returned to frontend:")
            for field_key, field_data in response['fields'].items():
                if field_data.get('value'):
                    print(f"      ✅ {field_key}: \"{field_data['value']}\" (confidence: {field_data.get('confidence', 0):.2f})")
        
        if not response.get('has_extracted_data'):
            print(f"\n   ❌ PROBLEM: API returns has_extracted_data=False")
            print(f"      Message: {response.get('message')}")
    
    except Exception as e:
        print(f"\n   ❌ API call failed: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    try:
        diagnose_kyc_extraction()
        test_autofill_api()
        
        print("\n" + "="*80)
        print("DIAGNOSTIC COMPLETE")
        print("="*80 + "\n")
        
        print("📋 SUMMARY:")
        print("   If OCR text exists but KYCExtractedData doesn't:")
        print("      → trigger_kyc_extraction_after_upload() is not being called")
        print("      → OR it's failing silently (check logs)")
        print()
        print("   If KYCExtractedData exists but fields are empty:")
        print("      → Parser is not extracting data from OCR text")
        print("      → Check kyc_extraction_parser.py for regex issues")
        print()
        print("   If API returns has_extracted_data=False:")
        print("      → Frontend won't auto-fill (nothing to fill with)")
        print()
        print("   If API returns has_extracted_data=True:")
        print("      → Frontend SHOULD auto-fill (check mobile app code)")
        
    except Exception as e:
        print(f"\n❌ Diagnostic script failed: {str(e)}")
        import traceback
        traceback.print_exc()
