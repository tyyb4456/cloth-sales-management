from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import date
from decimal import Decimal
from database import get_db
from models import Sale, ClothVariety
from schemas import SaleCreate, SaleResponse, DailySalesSummary, SalespersonSummary

router = APIRouter(prefix="/sales", tags=["Sales Management"])

@router.post("/", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
def create_sale(sale: SaleCreate, db: Session = Depends(get_db)):
    """Record a new sale"""
    # Check if variety exists
    variety = db.query(ClothVariety).filter(ClothVariety.id == sale.variety_id).first()
    if not variety:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cloth variety with ID {sale.variety_id} not found"
        )
    
    # Calculate profit
    profit_per_item = sale.selling_price - sale.cost_price
    total_profit = profit_per_item * sale.quantity
    
    db_sale = Sale(
        **sale.model_dump(),
        profit=total_profit
    )
    db.add(db_sale)
    db.commit()
    db.refresh(db_sale)
    return db_sale

@router.get("/", response_model=List[SaleResponse])
def get_all_sales(db: Session = Depends(get_db)):
    """Get all sales records"""
    sales = db.query(Sale).all()
    return sales

@router.get("/date/{sale_date}", response_model=List[SaleResponse])
def get_sales_by_date(sale_date: date, db: Session = Depends(get_db)):
    """Get all sales for a specific date"""
    sales = db.query(Sale).filter(Sale.sale_date == sale_date).all()
    return sales

@router.get("/salesperson/{salesperson_name}", response_model=List[SaleResponse])
def get_sales_by_salesperson(salesperson_name: str, db: Session = Depends(get_db)):
    """Get all sales by a specific salesperson"""
    sales = db.query(Sale).filter(Sale.salesperson_name == salesperson_name).all()
    return sales

@router.get("/daily-summary/{sale_date}", response_model=DailySalesSummary)
def get_daily_sales_summary(sale_date: date, db: Session = Depends(get_db)):
    """Get sales summary for a specific date"""
    
    result = db.query(
        func.sum(Sale.selling_price * Sale.quantity).label('total_sales'),
        func.sum(Sale.profit).label('total_profit'),
        func.sum(Sale.quantity).label('total_quantity'),
        func.count(Sale.id).label('sales_count')
    ).filter(Sale.sale_date == sale_date).first()
    
    total_sales = result.total_sales if result.total_sales else Decimal('0.00')
    total_profit = result.total_profit if result.total_profit else Decimal('0.00')
    total_quantity = result.total_quantity if result.total_quantity else 0
    sales_count = result.sales_count if result.sales_count else 0
    
    return DailySalesSummary(
        date=sale_date,
        total_sales_amount=total_sales,
        total_profit=total_profit,
        total_quantity_sold=total_quantity,
        sales_count=sales_count
    )

@router.get("/salesperson-summary/{salesperson_name}/{sale_date}", response_model=SalespersonSummary)
def get_salesperson_summary(salesperson_name: str, sale_date: date, db: Session = Depends(get_db)):
    """Get sales summary for a specific salesperson on a specific date"""
    
    result = db.query(
        func.sum(Sale.selling_price * Sale.quantity).label('total_sales'),
        func.sum(Sale.profit).label('total_profit'),
        func.sum(Sale.quantity).label('total_items'),
        func.count(Sale.id).label('sales_count')
    ).filter(
        Sale.salesperson_name == salesperson_name,
        Sale.sale_date == sale_date
    ).first()
    
    total_sales = result.total_sales if result.total_sales else Decimal('0.00')
    total_profit = result.total_profit if result.total_profit else Decimal('0.00')
    total_items = result.total_items if result.total_items else 0
    sales_count = result.sales_count if result.sales_count else 0
    
    return SalespersonSummary(
        salesperson_name=salesperson_name,
        date=sale_date,
        total_sales=total_sales,
        total_profit=total_profit,
        total_items_sold=total_items,
        sales_count=sales_count
    )

@router.delete("/{sale_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sale(sale_id: int, db: Session = Depends(get_db)):
    """Delete a sale record"""
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sale with ID {sale_id} not found"
        )
    
    db.delete(sale)
    db.commit()
    return None
