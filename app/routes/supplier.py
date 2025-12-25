from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import date
from decimal import Decimal
from database import get_db
from models import SupplierInventory, SupplierReturn, ClothVariety
from schemas import (
    SupplierInventoryCreate, SupplierInventoryResponse,
    SupplierReturnCreate, SupplierReturnResponse,
    DailySupplierSummary
)

router = APIRouter(prefix="/supplier", tags=["Supplier Management"])

# Supplier Inventory Endpoints
@router.post("/inventory", response_model=SupplierInventoryResponse, status_code=status.HTTP_201_CREATED)
def add_supplier_inventory(inventory: SupplierInventoryCreate, db: Session = Depends(get_db)):
    """Record daily supply from supplier"""
    # Check if variety exists
    variety = db.query(ClothVariety).filter(ClothVariety.id == inventory.variety_id).first()
    if not variety:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cloth variety with ID {inventory.variety_id} not found"
        )
    
    # Calculate total amount
    total_amount = inventory.quantity * inventory.price_per_item
    
    db_inventory = SupplierInventory(
        **inventory.model_dump(),
        total_amount=total_amount
    )
    db.add(db_inventory)
    db.commit()
    db.refresh(db_inventory)
    return db_inventory

@router.get("/inventory", response_model=List[SupplierInventoryResponse])
def get_all_inventory(db: Session = Depends(get_db)):
    """Get all supplier inventory records"""
    inventories = db.query(SupplierInventory).all()
    return inventories

@router.get("/inventory/date/{supply_date}", response_model=List[SupplierInventoryResponse])
def get_inventory_by_date(supply_date: date, db: Session = Depends(get_db)):
    """Get supplier inventory for a specific date"""
    inventories = db.query(SupplierInventory).filter(
        SupplierInventory.supply_date == supply_date
    ).all()
    return inventories

@router.delete("/inventory/{inventory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory(inventory_id: int, db: Session = Depends(get_db)):
    """Delete a supplier inventory record"""
    inventory = db.query(SupplierInventory).filter(SupplierInventory.id == inventory_id).first()
    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory record with ID {inventory_id} not found"
        )
    
    db.delete(inventory)
    db.commit()
    return None

# Supplier Return Endpoints
@router.post("/returns", response_model=SupplierReturnResponse, status_code=status.HTTP_201_CREATED)
def add_supplier_return(return_item: SupplierReturnCreate, db: Session = Depends(get_db)):
    """Record returns to supplier"""
    # Check if variety exists
    variety = db.query(ClothVariety).filter(ClothVariety.id == return_item.variety_id).first()
    if not variety:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cloth variety with ID {return_item.variety_id} not found"
        )
    
    # Calculate total amount
    total_amount = return_item.quantity * return_item.price_per_item
    
    db_return = SupplierReturn(
        **return_item.model_dump(),
        total_amount=total_amount
    )
    db.add(db_return)
    db.commit()
    db.refresh(db_return)
    return db_return

@router.get("/returns", response_model=List[SupplierReturnResponse])
def get_all_returns(db: Session = Depends(get_db)):
    """Get all supplier return records"""
    returns = db.query(SupplierReturn).all()
    return returns

@router.get("/returns/date/{return_date}", response_model=List[SupplierReturnResponse])
def get_returns_by_date(return_date: date, db: Session = Depends(get_db)):
    """Get supplier returns for a specific date"""
    returns = db.query(SupplierReturn).filter(
        SupplierReturn.return_date == return_date
    ).all()
    return returns

@router.delete("/returns/{return_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_return(return_id: int, db: Session = Depends(get_db)):
    """Delete a supplier return record"""
    return_record = db.query(SupplierReturn).filter(SupplierReturn.id == return_id).first()
    if not return_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Return record with ID {return_id} not found"
        )
    
    db.delete(return_record)
    db.commit()
    return None

# Daily Summary Endpoint
@router.get("/daily-summary/{summary_date}", response_model=DailySupplierSummary)
def get_daily_supplier_summary(summary_date: date, db: Session = Depends(get_db)):
    """Get supplier summary for a specific date (supply - returns = net)"""
    
    # Calculate total supply
    supply_result = db.query(
        func.sum(SupplierInventory.total_amount).label('total'),
        func.count(SupplierInventory.id).label('count')
    ).filter(SupplierInventory.supply_date == summary_date).first()
    
    total_supply = supply_result.total if supply_result.total else Decimal('0.00')
    supply_count = supply_result.count if supply_result.count else 0
    
    # Calculate total returns
    return_result = db.query(
        func.sum(SupplierReturn.total_amount).label('total'),
        func.count(SupplierReturn.id).label('count')
    ).filter(SupplierReturn.return_date == summary_date).first()
    
    total_returns = return_result.total if return_result.total else Decimal('0.00')
    return_count = return_result.count if return_result.count else 0
    
    # Calculate net amount
    net_amount = total_supply - total_returns
    
    return DailySupplierSummary(
        date=summary_date,
        total_supply=total_supply,
        total_returns=total_returns,
        net_amount=net_amount,
        supply_count=supply_count,
        return_count=return_count
    )

# Supplier-wise Summary
@router.get("/supplier-summary/{summary_date}")
def get_supplier_wise_summary(summary_date: date, db: Session = Depends(get_db)):
    """Get summary grouped by supplier for a specific date"""
    
    # Get supply by supplier
    supplies = db.query(
        SupplierInventory.supplier_name,
        func.sum(SupplierInventory.total_amount).label('total_supply'),
        func.sum(SupplierInventory.quantity).label('total_quantity'),
        func.count(SupplierInventory.id).label('record_count')
    ).filter(
        SupplierInventory.supply_date == summary_date
    ).group_by(SupplierInventory.supplier_name).all()
    
    # Get returns by supplier
    returns = db.query(
        SupplierReturn.supplier_name,
        func.sum(SupplierReturn.total_amount).label('total_returns'),
        func.sum(SupplierReturn.quantity).label('total_quantity'),
        func.count(SupplierReturn.id).label('record_count')
    ).filter(
        SupplierReturn.return_date == summary_date
    ).group_by(SupplierReturn.supplier_name).all()
    
    # Combine data by supplier
    supplier_data = {}
    
    for supply in supplies:
        supplier_data[supply.supplier_name] = {
            'supplier_name': supply.supplier_name,
            'total_supply': float(supply.total_supply),
            'supply_quantity': supply.total_quantity,
            'supply_records': supply.record_count,
            'total_returns': 0,
            'return_quantity': 0,
            'return_records': 0,
            'net_amount': float(supply.total_supply)
        }
    
    for return_item in returns:
        if return_item.supplier_name in supplier_data:
            supplier_data[return_item.supplier_name]['total_returns'] = float(return_item.total_returns)
            supplier_data[return_item.supplier_name]['return_quantity'] = return_item.total_quantity
            supplier_data[return_item.supplier_name]['return_records'] = return_item.record_count
            supplier_data[return_item.supplier_name]['net_amount'] -= float(return_item.total_returns)
        else:
            supplier_data[return_item.supplier_name] = {
                'supplier_name': return_item.supplier_name,
                'total_supply': 0,
                'supply_quantity': 0,
                'supply_records': 0,
                'total_returns': float(return_item.total_returns),
                'return_quantity': return_item.total_quantity,
                'return_records': return_item.record_count,
                'net_amount': -float(return_item.total_returns)
            }
    
    return {
        'date': summary_date,
        'suppliers': list(supplier_data.values())
    }