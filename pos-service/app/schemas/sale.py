from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SaleItemBase(BaseModel):
    product_id: int
    quantity: int
    unit_price: float

class SaleItemCreate(SaleItemBase):
    product_name: str
    total_price: float

class SaleItemResponse(SaleItemBase):
    id: int
    sale_id: int
    product_name: str
    total_price: float

    class Config:
        orm_mode = True

class SaleBase(BaseModel):
    branch_id: int
    user_id: int
    payment_method: str
    customer_name: Optional[str] = None

class SaleCreate(SaleBase):
    items: List[SaleItemCreate]
    discount_amount: Optional[float] = 0

class SaleResponse(SaleBase):
    id: int
    total_amount: float
    tax_amount: float
    discount_amount: float
    status: str
    created_at: datetime
    invoice_number: Optional[str]
    items: List[SaleItemResponse]

    class Config:
        orm_mode = True