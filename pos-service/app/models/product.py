from sqlalchemy import Column, Integer, String, Float, Boolean
from ..db.session import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    price = Column(Float)
    cost = Column(Float)
    sku = Column(String, unique=True, index=True)
    barcode = Column(String, unique=True, index=True)
    category = Column(String)
    stock_quantity = Column(Integer, default=0)
    min_stock = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    branch_id = Column(Integer, index=True)  # For multi-branch