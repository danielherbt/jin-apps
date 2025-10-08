from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

app = FastAPI(
    title="Invoicing Service",
    version="1.0.0",
    description="Electronic Invoicing Service for SRI compliance"
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
    return {"status": "healthy", "service": "invoicing"}

# Simplified endpoints for testing
@app.get("/api/v1/invoices")
async def get_invoices():
    return {"invoices": [], "message": "Invoicing endpoint working"}

@app.post("/api/v1/invoices")
async def create_invoice(invoice_data: Dict[str, Any]):
    return {"message": "Invoice created", "invoice_id": "test-inv-123"}

@app.get("/api/v1/invoices/sri-status")
async def sri_status():
    return {"sri_environment": "test", "status": "connected"}
