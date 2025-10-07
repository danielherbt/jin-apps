from pydantic import BaseModel
from typing import Optional

class BranchBase(BaseModel):
    name: str
    address: str
    phone: Optional[str] = None
    email: Optional[str] = None
    manager_id: Optional[int] = None

class BranchCreate(BranchBase):
    pass

class BranchUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    manager_id: Optional[int] = None
    is_active: Optional[bool] = None

class BranchResponse(BranchBase):
    id: int
    is_active: bool

    class Config:
        orm_mode = True