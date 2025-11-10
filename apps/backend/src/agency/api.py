from ninja import Router, Form
from ninja.responses import Response
from accounts.authentication import cookie_auth
from . import services, schemas

router = Router()


@router.post("/upload", auth=cookie_auth, response=schemas.AgencyKYCUploadResponse)
def upload_agency_kyc(request,
                      businessName: str = Form(None),
                      businessDesc: str = Form(None)):
    """Upload agency KYC documents. Expects multipart/form-data. Files are read from request.FILES to avoid bytes validation errors."""
    try:
        # Get account ID from authenticated user
        account_id = request.auth.accountID
        
        class Payload:
            def __init__(self, accountID, businessName=None, businessDesc=None):
                self.accountID = accountID
                self.businessName = businessName
                self.businessDesc = businessDesc

        payload = Payload(accountID=account_id, businessName=businessName, businessDesc=businessDesc)

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


# Employee management endpoints

@router.get("/employees", auth=cookie_auth)
def get_employees(request):
    """Get all employees for the authenticated agency."""
    try:
        account_id = request.auth.accountID
        employees = services.get_agency_employees(account_id)
        return {"employees": employees}
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error fetching employees: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.post("/employees", auth=cookie_auth)
def add_employee(request, name: str = Form(...), email: str = Form(...), role: str = Form(...), avatar: str = Form(None), rating: float = Form(None)):
    """Add a new employee to the agency."""
    try:
        account_id = request.auth.accountID
        result = services.add_agency_employee(account_id, name, email, role, avatar, rating)
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error adding employee: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.delete("/employees/{employee_id}", auth=cookie_auth)
def remove_employee(request, employee_id: int):
    """Remove an employee from the agency."""
    try:
        account_id = request.auth.accountID
        result = services.remove_agency_employee(account_id, employee_id)
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error removing employee: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.get("/profile", auth=cookie_auth)
def get_profile(request):
    """Get complete agency profile with statistics."""
    try:
        account_id = request.auth.accountID
        profile = services.get_agency_profile(account_id)
        return profile
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error fetching agency profile: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.post("/profile/update", auth=cookie_auth)
def update_profile(request, 
                   business_name: str = Form(None), 
                   business_description: str = Form(None), 
                   contact_number: str = Form(None)):
    """Update agency profile information."""
    try:
        account_id = request.auth.accountID
        
        # Debug: print received values
        print(f"Received update request:")
        print(f"  business_name: {business_name}")
        print(f"  business_description: {business_description}")
        print(f"  contact_number: {contact_number}")
        
        result = services.update_agency_profile(
            account_id, 
            business_name=business_name,
            business_desc=business_description,
            contact_number=contact_number
        )
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error updating agency profile: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


@router.put("/profile", auth=cookie_auth)
def update_profile(request, business_description: str = Form(None), contact_number: str = Form(None)):
    """Update agency profile information."""
    try:
        account_id = request.auth.accountID
        result = services.update_agency_profile(account_id, business_description, contact_number)
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error updating agency profile: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)


# Simplified agency job endpoints - Direct invite/hire model

@router.get("/jobs", auth=cookie_auth)
def get_agency_jobs(request, status: str = None, page: int = 1, limit: int = 20):
    """
    Get all jobs assigned to this agency (direct hires/invites).
    
    Query Parameters:
    - status: Filter by job status (ACTIVE, IN_PROGRESS, COMPLETED, CANCELLED)
    - page: Page number for pagination (default: 1)
    - limit: Items per page (default: 20, max: 100)
    """
    try:
        account_id = request.auth.accountID
        
        # Validate limit
        if limit > 100:
            limit = 100
        
        result = services.get_agency_jobs(
            account_id=account_id,
            status_filter=status,
            page=page,
            limit=limit
        )
        return result
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        print(f"Error fetching agency jobs: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)
