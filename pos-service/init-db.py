#!/usr/bin/env python3

from app.db.session import engine, Base
from app.models.product import Product
from app.models.sale import Sale, SaleItem
from app.models.branch import Branch

def init_db():
    Base.metadata.create_all(bind=engine)
    print("POS database initialized")

if __name__ == "__main__":
    init_db()