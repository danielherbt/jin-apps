from sqlalchemy import Column, Integer, String, Boolean
from ..db.session import Base

class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    address = Column(String)
    phone = Column(String)
    email = Column(String)
    is_active = Column(Boolean, default=True)
    manager_id = Column(Integer)  # From user service