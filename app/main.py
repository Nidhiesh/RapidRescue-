import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.database.database import engine
from app.api.emergency import router as emergency_router

os.makedirs("uploads/emergencies", exist_ok=True)

app = FastAPI(
    title="RapidRescue API",
    description="Emergency ambulance backend - Patient Module",
    version="1.0.0"
)

# Serve uploaded files statically
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register API routers
app.include_router(emergency_router)


@app.get("/")
async def root():
    return {
        "success": True,
        "message": "RapidRescue Backend is running 🚑"
    }


@app.get("/health/db")
async def database_health():
    async with engine.connect() as connection:
        await connection.execute(text("SELECT 1"))

    return {
        "success": True,
        "database": "PostgreSQL",
        "message": "Database connected successfully 🗄️"
    }