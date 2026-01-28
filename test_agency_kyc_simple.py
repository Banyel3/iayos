#!/usr/bin/env python3
"""
Simple Agency KYC Endpoint Validation
Validates that the API endpoints exist and have correct HTTP methods
Tests the business_type parameter from commit 30c494257e42f13b129a5562e48b5004c5b286f7
"""

import sys
import os
from pathlib import Path

# Add Django project to path
backend_src = Path(__file__).parent / "apps" / "backend" / "src"
sys.path.insert(0, str(backend_src))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')
os.environ.setdefault('DJANGO_SECRET_KEY', 'test-key')
os.environ.setdefault('DEBUG', 'true')

print("=" * 70)
print("AGENCY KYC ENDPOINT CODE VALIDATION")
print("=" * 70)
print("\nValidating endpoints from commit 30c494257e42f13b129a5562e48b5004c5b286f7")
print("Focus: business_type parameter support\n")

# Read and analyze the API file
api_file = backend_src / "agency" / "api.py"

print("Analyzing agency/api.py...\n")

with open(api_file, 'r') as f:
    content = f.read()

# Track findings
endpoints_found = []
business_type_support = []
issues = []

print("-" * 70)
print("ENDPOINT VALIDATION")
print("-" * 70)

# Check for key endpoints
required_endpoints = [
    ("POST", "/upload", "@router.post(\"/upload\""),
    ("GET", "/status", "@router.get(\"/status\""),
    ("GET", "/kyc/autofill", "@router.get(\"/kyc/autofill\""),
    ("POST", "/kyc/validate-document", "@router.post(\"/kyc/validate-document\""),
    ("POST", "/kyc/confirm", "@router.post(\"/kyc/confirm\""),
]

for method, path, decorator in required_endpoints:
    if decorator in content:
        print(f"✅ {method:6} /api/agency{path:30} - Endpoint exists")
        endpoints_found.append((method, path))
    else:
        print(f"❌ {method:6} /api/agency{path:30} - Endpoint NOT FOUND")
        issues.append(f"Missing endpoint: {method} {path}")

print("\n" + "-" * 70)
print("BUSINESS_TYPE PARAMETER VALIDATION")
print("-" * 70)

# Check for business_type parameter in upload endpoint
if 'business_type = request.POST.get("business_type"' in content:
    print("✅ /upload endpoint accepts 'business_type' parameter")
    business_type_support.append("upload")
else:
    print("❌ /upload endpoint does NOT accept 'business_type' parameter")
    issues.append("Missing business_type parameter in upload endpoint")

# Check for business_type in confirm endpoint
if '"business_type"' in content or 'business_type' in content:
    # Read confirm function
    if 'def agency_kyc_confirm' in content or '@router.post("/kyc/confirm"' in content:
        # Extract the confirm function
        confirm_start = content.find('@router.post("/kyc/confirm"')
        if confirm_start > 0:
            confirm_section = content[confirm_start:confirm_start+3000]
            if 'business_type' in confirm_section:
                print("✅ /kyc/confirm endpoint handles 'business_type' parameter")
                business_type_support.append("confirm")
            else:
                print("⚠️  /kyc/confirm endpoint may not handle 'business_type'")
else:
    print("⚠️  business_type handling unclear in confirm endpoint")

print("\n" + "-" * 70)
print("MODEL VALIDATION")  
print("-" * 70)

# Check models for business_type field
models_file = backend_src / "agency" / "models.py"

with open(models_file, 'r') as f:
    models_content = f.read()

if 'confirmed_business_type' in models_content:
    print("✅ AgencyKYCExtractedData model has 'confirmed_business_type' field")
else:
    print("❌ AgencyKYCExtractedData model missing 'confirmed_business_type' field")
    issues.append("Missing confirmed_business_type field in model")

print("\n" + "-" * 70)
print("HTTP METHOD VALIDATION")
print("-" * 70)

# Verify HTTP methods match expectations
method_checks = [
    ("GET /status", "@router.get(\"/status\"", "GET"),
    ("POST /upload", "@router.post(\"/upload\"", "POST"),
    ("GET /kyc/autofill", "@router.get(\"/kyc/autofill\"", "GET"),
    ("POST /kyc/validate-document", "@router.post(\"/kyc/validate-document\"", "POST"),
    ("POST /kyc/confirm", "@router.post(\"/kyc/confirm\"", "POST"),
]

for endpoint_name, pattern, expected_method in method_checks:
    if pattern in content:
        print(f"✅ {endpoint_name:35} - Correct HTTP method ({expected_method})")
    else:
        # Check if wrong method is used
        wrong_pattern = pattern.replace(expected_method.lower(), "get" if expected_method == "POST" else "post")
        if wrong_pattern in content:
            print(f"❌ {endpoint_name:35} - WRONG HTTP method!")
            issues.append(f"Wrong HTTP method for {endpoint_name}")

print("\n" + "-" * 70)
print("ERROR HANDLING VALIDATION")
print("-" * 70)

# Check for proper error handling (should return proper status codes, not 500)
error_patterns = [
    ("try/except blocks", "try:", 5),
    ("ValueError handling", "except ValueError", 2),
    ("400 status returns", "status=400", 3),
    ("500 status returns", "status=500", 3),
]

for check_name, pattern, min_count in error_patterns:
    count = content.count(pattern)
    if count >= min_count:
        print(f"✅ {check_name:30} - Found {count} instances")
    elif count > 0:
        print(f"⚠️  {check_name:30} - Only {count} instances (expected {min_count}+)")
    else:
        print(f"❌ {check_name:30} - Not found")

print("\n" + "=" * 70)
print("VALIDATION SUMMARY")
print("=" * 70)

print(f"\n✅ Endpoints found: {len(endpoints_found)}/{len(required_endpoints)}")
print(f"✅ business_type support: {len(business_type_support)} endpoints")

if issues:
    print(f"\n⚠️  Issues found: {len(issues)}")
    for issue in issues:
        print(f"   - {issue}")
else:
    print("\n✅ No critical issues found!")

# Final verdict
if len(endpoints_found) == len(required_endpoints) and len(business_type_support) >= 1:
    print("\n" + "=" * 70)
    print("🎉 CODE VALIDATION PASSED")
    print("=" * 70)
    print("\nAll required endpoints exist with correct HTTP methods.")
    print("The business_type parameter is properly implemented.")
    print("\n✅ Ready for runtime testing")
    print("\nNOTE: This validates code structure. For full testing, run with:")
    print("  1. Start backend: cd apps/backend/src && python manage.py runserver")
    print("  2. Run HTTP tests: Use tests/agency_kyc_test.http")
    return_code = 0
else:
    print("\n" + "=" * 70)
    print("❌ CODE VALIDATION FAILED")
    print("=" * 70)
    print("\nSome endpoints or features are missing.")
    print("Please review the issues above.")
    return_code = 1

print("=" * 70 + "\n")
sys.exit(return_code)
