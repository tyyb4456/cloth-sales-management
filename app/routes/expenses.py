# app/routes/expenses.py - CREATE THIS NEW FILE

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import date
from decimal import Decimal
from database import get_db
from models import Expense, Sale
from schemas import (
    ExpenseCreate, ExpenseResponse, ExpenseSummary, FinancialReport
)

router = APIRouter(prefix="/expenses", tags=["Expense Management"])

@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    """Record a new expense"""
    db_expense = Expense(**expense.model_dump())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.get("/", response_model=List[ExpenseResponse])
def get_all_expenses(db: Session = Depends(get_db)):
    """Get all expenses"""
    expenses = db.query(Expense).order_by(Expense.expense_date.desc()).all()
    return expenses

@router.get("/date/{expense_date}", response_model=List[ExpenseResponse])
def get_expenses_by_date(expense_date: date, db: Session = Depends(get_db)):
    """Get expenses for a specific date"""
    expenses = db.query(Expense).filter(
        Expense.expense_date == expense_date
    ).all()
    return expenses

@router.get("/month/{year}/{month}", response_model=List[ExpenseResponse])
def get_expenses_by_month(year: int, month: int, db: Session = Depends(get_db)):
    """Get expenses for a specific month"""
    from calendar import monthrange
    
    start_date = date(year, month, 1)
    _, last_day = monthrange(year, month)
    end_date = date(year, month, last_day)
    
    expenses = db.query(Expense).filter(
        Expense.expense_date >= start_date,
        Expense.expense_date <= end_date
    ).order_by(Expense.expense_date.desc()).all()
    return expenses

@router.get("/summary/{expense_date}", response_model=ExpenseSummary)
def get_expense_summary(expense_date: date, db: Session = Depends(get_db)):
    """Get expense summary for a specific date"""
    
    # Get category breakdown
    category_breakdown = db.query(
        Expense.category,
        func.sum(Expense.amount).label('total')
    ).filter(
        Expense.expense_date == expense_date
    ).group_by(Expense.category).all()
    
    # Calculate totals
    total = sum(item.total for item in category_breakdown)
    breakdown_dict = {item.category: float(item.total) for item in category_breakdown}
    count = db.query(func.count(Expense.id)).filter(
        Expense.expense_date == expense_date
    ).scalar()
    
    return ExpenseSummary(
        total_expenses=total,
        category_breakdown=breakdown_dict,
        expense_count=count or 0
    )

@router.get("/financial-report/{year}/{month}", response_model=FinancialReport)
def get_financial_report(year: int, month: int, db: Session = Depends(get_db)):
    """Get complete financial report for a month"""
    from calendar import monthrange
    
    # Get start and end dates for the month
    start_date = date(year, month, 1)
    _, last_day = monthrange(year, month)
    end_date = date(year, month, last_day)
    
    # Get sales data for the entire month
    sales_result = db.query(
        func.sum(Sale.selling_price * Sale.quantity).label('revenue'),
        func.sum(Sale.profit).label('profit')
    ).filter(
        Sale.sale_date >= start_date,
        Sale.sale_date <= end_date
    ).first()
    
    revenue = sales_result.revenue if sales_result.revenue else Decimal('0.00')
    profit = sales_result.profit if sales_result.profit else Decimal('0.00')
    
    # Get expenses for the entire month
    expenses_result = db.query(
        func.sum(Expense.amount).label('expenses')
    ).filter(
        Expense.expense_date >= start_date,
        Expense.expense_date <= end_date
    ).first()
    
    expenses = expenses_result.expenses if expenses_result.expenses else Decimal('0.00')
    
    # Calculate metrics
    net_income = profit - expenses
    profit_margin = (float(profit) / float(revenue) * 100) if revenue > 0 else 0
    expense_ratio = (float(expenses) / float(revenue) * 100) if revenue > 0 else 0
    
    return FinancialReport(
        date=start_date,  # Return first day of month for reference
        total_revenue=revenue,
        total_profit=profit,
        total_expenses=expenses,
        net_income=net_income,
        profit_margin=round(profit_margin, 2),
        expense_ratio=round(expense_ratio, 2)
    )


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    """Delete an expense"""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense with ID {expense_id} not found"
        )
    
    db.delete(expense)
    db.commit()
    return None