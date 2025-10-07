from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import httpx
from ....db.session import get_db
from ....models.invoice import Invoice
from ....schemas.invoice import InvoiceCreate, InvoiceResponse, InvoiceStatusUpdate
from ....core.sri import SRIClient
from ....core.config import settings

router = APIRouter()

@router.post("/", response_model=InvoiceResponse)
async def create_invoice(
    invoice: InvoiceCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # Get sale data from POS service
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{settings.POS_SERVICE_URL}/api/v1/sales/{invoice.sale_id}")
            if response.status_code != 200:
                raise HTTPException(status_code=404, detail="Sale not found")
            sale_data = response.json()
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="POS service unavailable")

    # Create invoice record
    db_invoice = Invoice(
        sale_id=invoice.sale_id,
        branch_id=invoice.branch_id,
        environment=invoice.environment
    )
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)

    # Process invoice in background
    background_tasks.add_task(process_invoice, db_invoice.id, sale_data)

    return db_invoice

@router.get("/", response_model=List[InvoiceResponse])
async def get_invoices(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    invoices = db.query(Invoice).offset(skip).limit(limit).all()
    return invoices

@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

async def process_invoice(invoice_id: int, sale_data: dict):
    """Background task to process invoice"""
    from ....db.session import SessionLocal

    db = SessionLocal()
    try:
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            return

        sri_client = SRIClient()

        # Generate access key
        # This would need proper RUC, establishment codes, etc.
        access_key = sri_client.generate_access_key(
            ruc="1234567890001",  # Should come from config
            date=sale_data["created_at"][:10].replace("-", ""),
            type_doc="01",
            establishment="001",
            sequential=str(invoice_id).zfill(9)
        )

        # Prepare invoice data for XML
        invoice_data = {
            "company_name": "Mi Empresa POS",
            "ruc": "1234567890001",
            "access_key": access_key,
            "establishment": "001",
            "emission_point": "001",
            "sequential": str(invoice_id).zfill(9),
            "address": "Dirección de la empresa",
            "date": sale_data["created_at"][:10],
            "buyer_id_type": "05",  # CEDULA
            "buyer_name": sale_data.get("customer_name", "CONSUMIDOR FINAL"),
            "buyer_id": "9999999999999",  # Consumidor final
            "subtotal": sale_data["total_amount"] - sale_data["tax_amount"],
            "discount": sale_data["discount_amount"],
            "tax_amount": sale_data["tax_amount"],
            "total": sale_data["total_amount"],
            "items": [
                {
                    "code": str(item["product_id"]),
                    "description": item["product_name"],
                    "quantity": item["quantity"],
                    "unit_price": item["unit_price"],
                    "discount": 0,
                    "subtotal": item["total_price"],
                    "tax": item["total_price"] * 0.12
                } for item in sale_data["items"]
            ]
        }

        # Generate XML
        xml_content = sri_client.generate_invoice_xml(invoice_data)

        # Sign XML
        signed_xml = sri_client.sign_xml(xml_content)

        # Update invoice
        invoice.invoice_number = sale_data.get("invoice_number")
        invoice.access_key = access_key
        invoice.xml_content = xml_content
        invoice.signed_xml = signed_xml
        invoice.status = "generated"

        db.commit()

        # Send to SRI
        sri_response = sri_client.send_to_sri(signed_xml)
        invoice.sri_response = str(sri_response)
        invoice.status = "sent" if sri_response.get("status") == "received" else "rejected"

        db.commit()

    except Exception as e:
        invoice.status = "error"
        invoice.sri_response = str(e)
        db.commit()
    finally:
        db.close()

@router.post("/{invoice_id}/check-authorization")
async def check_invoice_authorization(
    invoice_id: int,
    db: Session = Depends(get_db)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if not invoice.access_key:
        raise HTTPException(status_code=400, detail="Invoice not sent to SRI yet")

    sri_client = SRIClient()
    auth_response = sri_client.check_authorization(invoice.access_key)

    # Update status
    if auth_response.get("status") == "authorized":
        invoice.status = "authorized"
        # Parse authorization number and date from response
        invoice.authorization_number = "AUTH123"  # Should parse from response
    elif auth_response.get("status") == "not_authorized":
        invoice.status = "rejected"

    invoice.sri_response = str(auth_response)
    db.commit()

    return auth_response