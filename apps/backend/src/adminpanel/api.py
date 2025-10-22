from ninja import Router
# from .schemas import createAccountSchema, logInSchema, createAgencySchema, forgotPasswordSchema, resetPasswordSchema
# from .services import create_account_individ, create_account_agency, login_account, _verify_account, forgot_password_request, reset_password_verify, logout_account, refresh_token, fetch_currentUser, generateCookie
from ninja.responses import Response
from django.shortcuts import redirect
from django.urls import reverse
from .service import fetchAll_kyc, review_kyc_items, approve_kyc, reject_kyc, fetch_kyc_logs
from .service import approve_agency_kyc, reject_agency_kyc

router = Router(tags=["adminpanel"])



@router.get("/kyc/all")
def get_all_kyc(request):
    try:
        return fetchAll_kyc(request)
    except Exception as e:
        print(f"❌ Error in get_all_kyc: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
    
@router.post("/kyc/review")
def review_kyc(request):
    try:
        result = review_kyc_items(request)
        print(f"✅ Successfully generated signed URLs: {result}")
        return result
    except Exception as e:
        print(f"❌ Error in review_kyc: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
    
@router.post("/kyc/approve")
def approve_kyc_verification(request):
    try:
        result = approve_kyc(request)
        print(f"✅ Successfully approved KYC: {result}")
        return result
    except ValueError as e:
        print(f"❌ Validation error approving KYC: {str(e)}")
        return {"success": False, "error": str(e)}
    except Exception as e:
        print(f"❌ Error approving KYC Verification: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.post("/kyc/approve-agency")
def approve_agency_kyc_verification(request):
    try:
        result = approve_agency_kyc(request)
        print(f"✅ Successfully approved Agency KYC: {result}")
        return result
    except ValueError as e:
        print(f"❌ Validation error approving Agency KYC: {str(e)}")
        return {"success": False, "error": str(e)}
    except Exception as e:
        print(f"❌ Error approving Agency KYC Verification: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}

@router.post("/kyc/reject")
def reject_kyc_verification(request):
    try:
        result = reject_kyc(request)
        print(f"✅ Successfully rejected KYC: {result}")
        return result
    except ValueError as e:
        print(f"❌ Validation error rejecting KYC: {str(e)}")
        return {"success": False, "error": str(e)}
    except Exception as e:
        print(f"❌ Error rejecting KYC Verification: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.post("/kyc/reject-agency")
def reject_agency_kyc_verification(request):
    try:
        result = reject_agency_kyc(request)
        print(f"✅ Successfully rejected Agency KYC: {result}")
        return result
    except ValueError as e:
        print(f"❌ Validation error rejecting Agency KYC: {str(e)}")
        return {"success": False, "error": str(e)}
    except Exception as e:
        print(f"❌ Error rejecting Agency KYC Verification: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.post("/kyc/create-agency")
def create_agency_kyc_from_paths(request):
    """Admin helper: create AgencyKYC and file records from already-uploaded Supabase paths.

    Expects JSON body: { accountID: int, businessName?: str, businessDesc?: str, files: { <FILE_TYPE>: <path>, ... } }
    FILE_TYPE values: BUSINESS_PERMIT, REP_ID_FRONT, REP_ID_BACK, ADDRESS_PROOF, AUTH_LETTER
    """
    import json
    try:
        body = json.loads(request.body.decode('utf-8'))
        account_id = body.get('accountID')
        businessName = body.get('businessName')
        businessDesc = body.get('businessDesc')
        files = body.get('files', {})

        if not account_id:
            return {"success": False, "error": "accountID is required"}

        from agency.services import create_agency_kyc_from_paths as svc
        result = svc(account_id, files, businessName=businessName, businessDesc=businessDesc)
        return {"success": True, **result}
    except ValueError as e:
        return {"success": False, "error": str(e)}
    except Exception as e:
        print(f"❌ Error in create_agency_kyc_from_paths: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}

@router.get("/kyc/logs")
def get_kyc_logs(request, action: str = None, limit: int = 100):
    """
    Get KYC audit logs with optional filtering.
    
    Query params:
    - action: Filter by "APPROVED" or "Rejected" (optional)
    - limit: Max number of logs to return (default 100, max 500)
    """
    try:
        # Validate limit
        if limit > 500:
            limit = 500
        
        result = fetch_kyc_logs(action_filter=action, limit=limit)
        print(f"✅ Successfully fetched {len(result)} KYC logs")
        return {"success": True, "logs": result, "count": len(result)}
    except Exception as e:
        print(f"❌ Error fetching KYC logs: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}
