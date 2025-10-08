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

# Simplified endpoints for testing
@app.get("/api/v1/sales")
async def get_sales():
    return {"sales": [], "message": "Sales endpoint working"}

@app.post("/api/v1/sales")
async def create_sale(sale_data: Dict[str, Any]):
    return {"message": "Sale created", "sale_id": "test-123"}

@app.get("/api/v1/inventory")
async def get_inventory():
    return {"inventory": [], "message": "Inventory endpoint working"}

@app.get("/api/v1/branches")
async def get_branches():
    return {"branches": [], "message": "Branches endpoint working"}
