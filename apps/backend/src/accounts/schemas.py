from ninja import Schemas
from datetime import datetime
from pydantic import EmailStr


class createAccountSchema(Schemas):
    #profile table
    firstName: str
    lastName: str
    contactNum: int
    birthDate: str
    #accounts table
    email: EmailStr
    password: str
    createdAt: datetime

class logInSchema(Schemas):
    email: EmailStr
    password: str