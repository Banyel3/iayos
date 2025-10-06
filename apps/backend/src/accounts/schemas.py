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
    postal_code: int    # "7000"


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