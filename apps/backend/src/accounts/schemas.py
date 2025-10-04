from ninja import Schema
from datetime import datetime
from pydantic import EmailStr
from typing import Optional

class createAccountSchema(Schema):
    #profile table
    firstName: str
    lastName: str
    contactNum: int
    birthDate: str
    #accounts table
    email: EmailStr
    password: str
    createdAt: Optional[datetime] = datetime.utcnow()

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
    createdAt: Optional[datetime] = datetime.utcnow()

class forgotPasswordSchema(Schema):
    email: EmailStr

class resetPasswordSchema(Schema):
    newPassword: str
    confirmPassword: str