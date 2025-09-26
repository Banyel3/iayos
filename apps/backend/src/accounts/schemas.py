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