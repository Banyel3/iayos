from ninja import Schema
from datetime import datetime
from pydantic import EmailStr
from typing import Optional

class createAccountSchema(Schema):
    #profile table
    firstName: str
    middleName: Optional[str] = ""  # Made optional with default empty string
    lastName: str
    contactNum: str  # Changed from int to str to match Profile model CharField
    birthDate: str
    #accounts table
    email: EmailStr
    password: str
    street_address: str
    city: str             # "Zamboanga City"
    province: str        # "Zamboanga del Sur"
    postal_code: str    # Changed from int to str to match Accounts model CharField
    country: str = "Philippines"

class logInSchema(Schema):
    email: EmailStr
    password: str

class assignRoleSchema(Schema):
    email: EmailStr
    selectedType: str

class createAgencySchema(Schema):
    email: EmailStr
    password: str
    businessName: str
    street_address: str
    city: str             # "Zamboanga City"
    province: str        # "Zamboanga del Sur"
    postal_code: str    # "7000"


    createdAt: Optional[datetime] = datetime.utcnow()
    

class forgotPasswordSchema(Schema):
    email: EmailStr

class resetPasswordSchema(Schema):
    newPassword: str
    confirmPassword: str

class KYCUploadSchema(Schema):
    accountID: int
    IDType: str
    clearanceType: str

class KYCUploadResponse(Schema):
    message: str
    kyc_id: int
    file_url: str
    file_name: str

class KYCStatusResponse(Schema):
    kyc_id: int
    status: str
    notes: Optional[str]
    reviewed_at: Optional[datetime]
    files: list

# Location Tracking Schemas
class UpdateLocationSchema(Schema):
    """Schema for updating user's GPS location"""
    latitude: float
    longitude: float

class LocationResponseSchema(Schema):
    """Schema for location response"""
    profile_id: int
    latitude: Optional[float]
    longitude: Optional[float]
    location_updated_at: Optional[datetime]
    location_sharing_enabled: bool
    message: str

class ToggleLocationSharingSchema(Schema):
    """Schema for toggling location sharing"""
    enabled: bool

class NearbyWorkersSchema(Schema):
    """Schema for finding nearby workers"""
    latitude: float
    longitude: float
    radius_km: Optional[float] = 10.0  # Default 10km radius
    specialization_id: Optional[int] = None  # Optional filter by specialization

class WorkerLocationSchema(Schema):
    """Schema for worker location in search results"""
    profile_id: int
    worker_id: int
    first_name: str
    last_name: str
    profile_img: Optional[str]
    latitude: float
    longitude: float
    distance_km: float
    availability_status: str
    specializations: list

class DepositFundsSchema(Schema):
    """Schema for wallet deposit request"""
    amount: float
    payment_method: Optional[str] = "GCASH"