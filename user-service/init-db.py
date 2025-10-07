#!/usr/bin/env python3

from app.db.session import engine, Base
from app.models.user import User

def init_db():
    Base.metadata.create_all(bind=engine)
    print("User database initialized")

if __name__ == "__main__":
    init_db()