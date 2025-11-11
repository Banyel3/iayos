from ninja import Router
from ninja.responses import Response
from accounts.authentication import cookie_auth
from . import services, schemas
from typing import Optional

router = Router()


@router.get("/agencies/browse", auth=cookie_auth, response=schemas.AgencyBrowseResponse)
def browse_agencies(
    request,
    page: int = 1,
    limit: int = 20,
    city: Optional[str] = None,
    province: Optional[str] = None,
    min_rating: Optional[float] = None,
    sort_by: str = "rating"
):
    """
    Browse agencies with filters and pagination
    
    Query Parameters:
    - page: Page number (default: 1)
    - limit: Items per page (default: 20, max: 100)
    - city: Filter by city
    - province: Filter by province
    - min_rating: Minimum average rating (0-5)
    - sort_by: Sort field (rating, jobs, created)
    """
    try:
        # Validate limit
        if limit > 100:
            limit = 100
        if limit < 1:
            limit = 20
        
        # Validate page
        if page < 1:
            page = 1
        
        result = services.browse_agencies(
            page=page,
            limit=limit,
            city=city,
            province=province,
            min_rating=min_rating,
            kyc_status="APPROVED",  # Only show approved agencies to clients
            sort_by=sort_by
        )
        
        return result
        
    except Exception as e:
        print(f"Error browsing agencies: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": "Failed to browse agencies"}, status=500)


@router.get("/agencies/search", auth=cookie_auth, response=schemas.AgencySearchResponse)
def search_agencies(request, q: str, limit: int = 20):
    """
    Full-text search for agencies
    
    Query Parameters:
    - q: Search query (searches business name and description)
    - limit: Maximum results (default: 20, max: 100)
    """
    try:
        if not q or len(q.strip()) < 2:
            return Response(
                {"error": "Search query must be at least 2 characters"},
                status=400
            )
        
        # Validate limit
        if limit > 100:
            limit = 100
        if limit < 1:
            limit = 20
        
        result = services.search_agencies(query=q.strip(), limit=limit)
        return result
        
    except Exception as e:
        print(f"Error searching agencies: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": "Failed to search agencies"}, status=500)


@router.get("/agencies/{agency_id}", auth=cookie_auth, response=schemas.AgencyProfileResponse)
def get_agency_profile(request, agency_id: int):
    """
    Get detailed agency profile
    
    Path Parameters:
    - agency_id: Agency ID
    """
    try:
        result = services.get_agency_profile(agency_id=agency_id)
        return result
        
    except ValueError as e:
        return Response({"error": str(e)}, status=404)
    except Exception as e:
        print(f"Error fetching agency profile: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": "Failed to fetch agency profile"}, status=500)


@router.get("/agencies/{agency_id}/reviews", auth=cookie_auth, response=schemas.AgencyReviewsResponse)
def get_agency_reviews(request, agency_id: int, page: int = 1, limit: int = 10):
    """
    Get paginated reviews for an agency
    
    Path Parameters:
    - agency_id: Agency ID
    
    Query Parameters:
    - page: Page number (default: 1)
    - limit: Items per page (default: 10, max: 50)
    """
    try:
        # Validate limit
        if limit > 50:
            limit = 50
        if limit < 1:
            limit = 10
        
        # Validate page
        if page < 1:
            page = 1
        
        result = services.get_agency_reviews(
            agency_id=agency_id,
            page=page,
            limit=limit
        )
        return result
        
    except ValueError as e:
        return Response({"error": str(e)}, status=404)
    except Exception as e:
        print(f"Error fetching agency reviews: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": "Failed to fetch agency reviews"}, status=500)
