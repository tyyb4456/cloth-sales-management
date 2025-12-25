from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import ClothVariety
from schemas import ClothVarietyCreate, ClothVarietyResponse

router = APIRouter(prefix="/varieties", tags=["Cloth Varieties"])

@router.post("/", response_model=ClothVarietyResponse, status_code=status.HTTP_201_CREATED)
def create_variety(variety: ClothVarietyCreate, db: Session = Depends(get_db)):
    """Create a new cloth variety"""
    # Check if variety already exists
    existing = db.query(ClothVariety).filter(ClothVariety.name == variety.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cloth variety '{variety.name}' already exists"
        )
    
    db_variety = ClothVariety(**variety.model_dump())
    db.add(db_variety)
    db.commit()
    db.refresh(db_variety)
    return db_variety

@router.get("/", response_model=List[ClothVarietyResponse])
def get_all_varieties(db: Session = Depends(get_db)):
    """Get all cloth varieties"""
    varieties = db.query(ClothVariety).all()
    return varieties

@router.get("/{variety_id}", response_model=ClothVarietyResponse)
def get_variety(variety_id: int, db: Session = Depends(get_db)):
    """Get a specific cloth variety by ID"""
    variety = db.query(ClothVariety).filter(ClothVariety.id == variety_id).first()
    if not variety:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cloth variety with ID {variety_id} not found"
        )
    return variety

@router.delete("/{variety_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_variety(variety_id: int, db: Session = Depends(get_db)):
    """Delete a cloth variety"""
    variety = db.query(ClothVariety).filter(ClothVariety.id == variety_id).first()
    if not variety:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cloth variety with ID {variety_id} not found"
        )
    
    db.delete(variety)
    db.commit()
    return None
