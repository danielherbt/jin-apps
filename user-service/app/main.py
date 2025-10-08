from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any
try:
    from .api.v1.endpoints import auth
except ImportError:
    auth = None

app = FastAPI(
    title="User Management Service",
    version="1.0.0",
    description="User Management Service for POS System"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers if available
if auth:
    app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "user"}

# Simplified endpoints for testing
@app.get("/api/v1/users")
async def get_users():
    return {"users": [], "message": "Users endpoint working"}

@app.post("/api/v1/auth/login")
async def login(credentials: Dict[str, Any]):
    username = credentials.get("username")
    if username == "admin":
        return {"access_token": "fake-token", "token_type": "bearer"}
    return {"error": "Invalid credentials"}
