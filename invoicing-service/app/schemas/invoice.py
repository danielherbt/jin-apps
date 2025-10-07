from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InvoiceBase(BaseModel):
    sale_id: int
    branch_id: int
    environment: Optional[str] = "test"

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceResponse(InvoiceBase):
    id: int
    invoice_number: Optional[str]
    access_key: Optional[str]
    status: str
    authorization_number: Optional[str]
    authorization_date: Optional[datetime]
    created_at: datetime

    class Config:
        orm_mode = True

class InvoiceStatusUpdate(BaseModel):
    status: str
    sri_response: Optional[str] = None
    authorization_number: Optional[str] = None
    authorization_date: Optional[datetime] = None