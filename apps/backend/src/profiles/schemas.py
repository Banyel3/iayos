from ninja import Schema
from typing import Optional



class DepositFundsSchema(Schema):
    amount: float
    payment_method: str = "GCASH"


class ProductCreateSchema(Schema):
    name: str
    description: Optional[str] = None
    price: Optional[float] = None


class ProductSchema(Schema):
    productID: int
    name: str
    description: Optional[str] = None
    price: Optional[float] = None
    createdAt: str
    updatedAt: str
