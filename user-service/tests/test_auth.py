import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import Base

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_register_user():
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123",
        "role": "user"
    }
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"

def test_login():
    # First register
    user_data = {
        "username": "logintest",
        "email": "login@example.com",
        "password": "testpass123",
        "role": "user"
    }
    client.post("/api/v1/auth/register", json=user_data)

    # Then login
    login_data = {
        "username": "logintest",
        "password": "testpass123"
    }
    response = client.post("/api/v1/auth/token", data=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"