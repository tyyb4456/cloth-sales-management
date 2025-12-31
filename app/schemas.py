# app/schemas.py - UPDATED with price field

from pydantic import BaseModel, Field, field_validator
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Literal, Dict
from models import MeasurementUnit

# Cloth Variety Schemas
class ClothVarietyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    measurement_unit: MeasurementUnit = MeasurementUnit.PIECES
    standard_length: Optional[Decimal] = None
    default_cost_price: Optional[Decimal] = None  # ✨ NEW

class ClothVarietyCreate(ClothVarietyBase):
    pass

class ClothVarietyResponse(ClothVarietyBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ClothVarietyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    measurement_unit: Optional[MeasurementUnit] = None
    standard_length: Optional[Decimal] = None
    default_cost_price: Optional[Decimal] = None  # ✨ NEW

# Supplier Inventory Schemas
class SupplierInventoryBase(BaseModel):
    supplier_name: str = Field(..., min_length=1, max_length=100)
    variety_id: int
    quantity: float = Field(..., gt=0)
    price_per_item: Decimal = Field(..., gt=0, decimal_places=2)
    supply_date: date

class SupplierInventoryCreate(SupplierInventoryBase):
    pass

class SupplierInventoryResponse(SupplierInventoryBase):
    id: int
    total_amount: Decimal
    created_at: datetime
    variety: ClothVarietyResponse
    
    class Config:
        from_attributes = True

# Supplier Return Schemas
class SupplierReturnBase(BaseModel):
    supplier_name: str = Field(..., min_length=1, max_length=100)
    variety_id: int
    quantity: float = Field(..., gt=0)
    price_per_item: Decimal = Field(..., gt=0, decimal_places=2)
    return_date: date
    reason: Optional[str] = None

class SupplierReturnCreate(SupplierReturnBase):
    pass

class SupplierReturnResponse(SupplierReturnBase):
    id: int
    total_amount: Decimal
    created_at: datetime
    variety: ClothVarietyResponse
    
    class Config:
        from_attributes = True

# Sale Schemas
class SaleBase(BaseModel):
    salesperson_name: str = Field(..., min_length=1, max_length=100)
    variety_id: int
    quantity: float = Field(..., gt=0)
    selling_price: Decimal = Field(..., gt=0, decimal_places=2)
    cost_price: Decimal = Field(..., gt=0, decimal_places=2)
    sale_date: date
    
    @field_validator('selling_price')
    @classmethod
    def validate_selling_price(cls, v, info):
        if 'cost_price' in info.data and v < info.data['cost_price']:
            raise ValueError('Selling price should not be less than cost price')
        return v

class SaleCreate(SaleBase):
    pass

class SaleResponse(SaleBase):
    id: int
    profit: Decimal
    sale_timestamp: datetime
    variety: ClothVarietyResponse
    
    class Config:
        from_attributes = True

# Summary Schemas
class DailySupplierSummary(BaseModel):
    date: date
    total_supply: Decimal
    total_returns: Decimal
    net_amount: Decimal
    supply_count: int
    return_count: int

class DailySalesSummary(BaseModel):
    date: date
    total_sales_amount: Decimal
    total_profit: Decimal
    total_quantity_sold: Decimal
    sales_count: int

class DailyReport(BaseModel):
    date: date
    supplier_summary: DailySupplierSummary
    sales_summary: DailySalesSummary
    net_inventory_value: Decimal

class SalespersonSummary(BaseModel):
    salesperson_name: str
    date: date
    total_sales: Decimal
    total_profit: Decimal
    total_items_sold: int
    sales_count: int

# Expense Schemas
class ExpenseBase(BaseModel):
    category: str
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    expense_date: date
    description: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ExpenseSummary(BaseModel):
    total_expenses: Decimal
    category_breakdown: Dict[str, Decimal]
    expense_count: int
    
class FinancialReport(BaseModel):
    date: date
    total_revenue: Decimal
    total_profit: Decimal
    total_expenses: Decimal
    net_income: Decimal
    profit_margin: float
    expense_ratio: float
