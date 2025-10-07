#!/usr/bin/env python3

from app.db.session import engine, Base
from app.models.invoice import Invoice

def init_db():
    Base.metadata.create_all(bind=engine)
    print("Invoicing database initialized")

if __name__ == "__main__":
    init_db()