from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, Date, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum 

class MeasurementUnit(str, enum.Enum):
    PIECES = "pieces"
    METERS = "meters"
    YARDS = "yards"

class ClothVariety(Base):
    __tablename__ = "cloth_varieties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    measurement_unit = Column(
        SQLEnum(
            MeasurementUnit,
            values_callable=lambda enum: [e.value for e in enum],
            native_enum=False
        ),
        nullable=False,
        default=MeasurementUnit.PIECES
    )

    # For meter-based items, store standard length per piece
    standard_length = Column(DECIMAL(10, 2), nullable=True) 
    description = Column(Text)
    
    created_at = Column(DateTime, server_default=func.now())

    supplier_inventories = relationship(
        "SupplierInventory",
        back_populates="variety",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    supplier_returns = relationship(
        "SupplierReturn",
        back_populates="variety",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    sales = relationship(
        "Sale",
        back_populates="variety",
        cascade="all, delete-orphan",
        passive_deletes=True
    )


class SupplierInventory(Base):
    __tablename__ = "supplier_inventory"
    
    id = Column(Integer, primary_key=True, index=True)
    supplier_name = Column(String(100), nullable=False, index=True)
    variety_id = Column(
        Integer,
        ForeignKey("cloth_varieties.id", ondelete="CASCADE"),
        nullable=False
    )

    quantity = Column(DECIMAL(10, 2), nullable=False) 
    price_per_item = Column(DECIMAL(10, 2), nullable=False)
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    supply_date = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    variety = relationship("ClothVariety", back_populates="supplier_inventories")

class SupplierReturn(Base):
    __tablename__ = "supplier_returns"
    
    id = Column(Integer, primary_key=True, index=True)
    supplier_name = Column(String(100), nullable=False, index=True)
    variety_id = Column(
        Integer,
        ForeignKey("cloth_varieties.id", ondelete="CASCADE"),
        nullable=False
    )

    quantity = Column(DECIMAL(10, 2), nullable=False) 
    price_per_item = Column(DECIMAL(10, 2), nullable=False)
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    return_date = Column(Date, nullable=False, index=True)
    reason = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    variety = relationship("ClothVariety", back_populates="supplier_returns")

class Sale(Base):
    __tablename__ = "sales"
    
    id = Column(Integer, primary_key=True, index=True)
    salesperson_name = Column(String(100), nullable=False, index=True)
    variety_id = Column(
        Integer,
        ForeignKey("cloth_varieties.id", ondelete="CASCADE"),
        nullable=False
    )

    quantity = Column(DECIMAL(10, 2), nullable=False)
    selling_price = Column(DECIMAL(10, 2), nullable=False)
    cost_price = Column(DECIMAL(10, 2), nullable=False)
    profit = Column(DECIMAL(10, 2), nullable=False)
    sale_date = Column(Date, nullable=False, index=True)
    sale_timestamp = Column(DateTime, server_default=func.now())
    
    # Relationships
    variety = relationship("ClothVariety", back_populates="sales")