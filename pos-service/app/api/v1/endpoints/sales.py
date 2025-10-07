from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ....db.session import get_db
from ....models.sale import Sale, SaleItem
from ....models.product import Product
from ....schemas.sale import SaleCreate, SaleResponse
from ....core.auth import get_current_user
import uuid

router = APIRouter()

@router.post("/", response_model=SaleResponse)
async def create_sale(
    sale: SaleCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Validate products and calculate totals
    total_amount = 0
    tax_amount = 0

    for item in sale.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product.stock_quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")

        total_amount += item.total_price
        # Calculate tax (12% IVA in Ecuador)
        tax_amount += item.total_price * 0.12

        # Update stock
        product.stock_quantity -= item.quantity

    # Apply discount
    total_amount -= sale.discount_amount or 0

    # Create sale
    invoice_number = f"INV-{uuid.uuid4().hex[:8].upper()}"
    db_sale = Sale(
        total_amount=total_amount,
        tax_amount=tax_amount,
        discount_amount=sale.discount_amount or 0,
        payment_method=sale.payment_method,
        branch_id=sale.branch_id,
        user_id=current_user["user_id"],
        customer_name=sale.customer_name,
        invoice_number=invoice_number
    )
    db.add(db_sale)
    db.commit()
    db.refresh(db_sale)

    # Create sale items
    for item in sale.items:
        db_item = SaleItem(
            sale_id=db_sale.id,
            product_id=item.product_id,
            product_name=item.product_name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item.total_price
        )
        db.add(db_item)

    db.commit()

    # Return with items
    db.refresh(db_sale)
    return db_sale

@router.get("/", response_model=List[SaleResponse])
async def get_sales(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    sales = db.query(Sale).offset(skip).limit(limit).all()
    return sales

@router.get("/{sale_id}", response_model=SaleResponse)
async def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale