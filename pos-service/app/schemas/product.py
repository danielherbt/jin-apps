from pydantic import BaseModel
from typing import Optional

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    cost: float
    sku: str
    barcode: Optional[str] = None
    category: Optional[str] = None
    stock_quantity: int = 0
    min_stock: int = 0
    branch_id: int

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    category: Optional[str] = None
    stock_quantity: Optional[int] = None
    min_stock: Optional[int] = None
    is_active: Optional[bool] = None

class ProductResponse(ProductBase):
    id: int
    is_active: bool

    class Config:
        orm_mode = True