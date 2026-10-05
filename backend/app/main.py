from fastapi import FastAPI
from sqlalchemy import text

from app.db.session import engine


app = FastAPI(
    title="CareerTrack API",
    description="API for the CareerTrack job application and resume management platform.",
    version="0.1.0",
)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "message": "CareerTrack API is running"
    }


@app.get("/health/database")
def database_health_check():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))

    return {
        "status": "healthy",
        "database": "connected",
        "result": result.scalar()
    }