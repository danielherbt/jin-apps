from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any
import traceback
import sys
import os

# Add the parent directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import auth router
auth_router = None
try:
    from app.api.v1.endpoints.auth import router as auth_router
    print(f"✅ Auth router imported successfully")
except ImportError as e:
    print(f"❌ Failed to import auth router: {e}")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Python path: {sys.path}")
    traceback.print_exc()
    auth_router = None
except Exception as e:
    print(f"❌ Unexpected error importing auth router: {e}")
    traceback.print_exc()
    auth_router = None

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
if auth_router:
    app.include_router(auth_router, prefix="/api/v1/auth", tags=["authentication"])
    print(f"✅ Auth router included in FastAPI app")
else:
    print(f"❌ Warning: Auth router was not included in FastAPI app")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "user"}

# Additional endpoints
@app.get("/api/v1/users")
async def get_users():
    return {"users": [], "message": "Users endpoint working"}
