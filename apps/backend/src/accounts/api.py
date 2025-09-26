from ninja import Router, Schema
from .schemas import createAccountSchema, logInSchema
from .services import create_account, login_account


router = Router(tags=["Accounts"])

@router.post("/register")
def register(request, payload: createAccountSchema):
    result = create_account(payload)
    return result

@router.post("/login")
def login(request, payload: logInSchema):
    result = login_account(payload)
    return result

@router.get("/me")
def get_current_user(request):
    # For now, return a placeholder - implement JWT authentication later
    return {"message": "User profile endpoint - implement JWT authentication"}

@router.post("/logout")
def logout(request):
    # Placeholder for logout functionality
    return {"message": "Logged out successfully"}

@router.post("/refresh")
def refresh_token(request):
    # Placeholder for token refresh functionality
    return {"message": "Token refresh endpoint - implement JWT refresh"}