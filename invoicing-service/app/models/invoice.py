from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from datetime import datetime
from ..db.session import Base

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, index=True)  # From POS service
    invoice_number = Column(String, unique=True, index=True)
    access_key = Column(String, unique=True, index=True)
    xml_content = Column(Text)
    signed_xml = Column(Text)
    status = Column(String, default="pending")  # pending, sent, authorized, rejected
    sri_response = Column(Text)
    authorization_number = Column(String)
    authorization_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    branch_id = Column(Integer, index=True)
    environment = Column(String, default="test")  # test or production