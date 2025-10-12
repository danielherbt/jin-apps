from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

app = FastAPI(
    title="POS Service",
    version="1.0.0",
    description="POS Service for Point of Sale operations"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "pos"}

# Include API routers
try:
    from .api.v1.endpoints import sales, inventory, branches
    app.include_router(sales.router, prefix="/api/v1/sales", tags=["sales"])
    app.include_router(inventory.router, prefix="/api/v1/inventory", tags=["inventory"])
    app.include_router(branches.router, prefix="/api/v1/branches", tags=["branches"])
except ImportError:
    # Fallback for testing
    pass
