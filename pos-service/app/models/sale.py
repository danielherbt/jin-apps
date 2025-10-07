from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db.session import Base

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    total_amount = Column(Float)
    tax_amount = Column(Float, default=0)
    discount_amount = Column(Float, default=0)
    payment_method = Column(String)  # cash, card, etc.
    status = Column(String, default="completed")  # completed, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)
    branch_id = Column(Integer, index=True)
    user_id = Column(Integer)  # From user service
    customer_name = Column(String, nullable=True)
    invoice_number = Column(String, unique=True, index=True)

    items = relationship("SaleItem", back_populates="sale")

class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"))
    product_id = Column(Integer)
    product_name = Column(String)
    quantity = Column(Integer)
    unit_price = Column(Float)
    total_price = Column(Float)

    sale = relationship("Sale", back_populates="items")