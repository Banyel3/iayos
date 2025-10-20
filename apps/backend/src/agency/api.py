from ninja import Router, Form
from ninja.responses import Response
from accounts.authentication import cookie_auth
from . import services, schemas

router = Router()


@router.post("/upload", auth=cookie_auth, response=schemas.AgencyKYCUploadResponse)
def upload_agency_kyc(request,
                      accountID: int = Form(...),
                      businessName: str = Form(None),
                      businessDesc: str = Form(None)):
    """Upload agency KYC documents. Expects multipart/form-data. Files are read from request.FILES to avoid bytes validation errors."""
    try:
        # `request` is authenticated via cookie_auth and request.auth is user
        class Payload:
            def __init__(self, accountID, businessName=None, businessDesc=None):
                self.accountID = accountID
                self.businessName = businessName
                self.businessDesc = businessDesc

        payload = Payload(accountID=accountID, businessName=businessName, businessDesc=businessDesc)

        # Read uploaded files from request.FILES (Django's UploadedFile objects)
        business_permit = request.FILES.get("business_permit")
        rep_front = request.FILES.get("rep_front")
        rep_back = request.FILES.get("rep_back")
        address_proof = request.FILES.get("address_proof")
        auth_letter = request.FILES.get("auth_letter")

        result = services.upload_agency_kyc(payload, business_permit, rep_front, rep_back, address_proof, auth_letter)

        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error in upload_agency_kyc: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.get("/status", auth=cookie_auth, response=schemas.AgencyKYCStatusResponse)
def agency_kyc_status(request):
    try:
        account_id = request.auth.accountID
        result = services.get_agency_kyc_status(account_id)
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error fetching agency kyc status: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)
