from fastapi import FastAPI
from sqlalchemy import text

from app.db.session import engine
from app.routers.auth import router as auth_router
from app.routers.jobs import router as jobs_router
from app.routers.applications import router as applications_router
from app.routers.interviews import router as interviews_router


app = FastAPI(
    title="CareerTrack API",
    description="API for the CareerTrack job application and resume management platform.",
    version="0.1.0",
)

app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(applications_router)
app.include_router(interviews_router)

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