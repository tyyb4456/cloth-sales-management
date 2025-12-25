from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import init_db
from routes import varieties, supplier, sales, reports

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler"""
    # Startup
    print("Starting database initialization...")
    init_db()
    print("Database initialization complete!")
    yield
    # Shutdown (if needed)
    print("Application shutting down...")

app = FastAPI(
    title="Cloth Shop Management System",
    description="API for managing cloth shop inventory, supplier transactions, and sales",
    version="1.0.0",
    lifespan=lifespan  # Add this parameter
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(varieties.router)
app.include_router(supplier.router)
app.include_router(sales.router)
app.include_router(reports.router)

# Remove the old @app.on_event("startup") decorator completely

@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Cloth Shop Management System API",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}