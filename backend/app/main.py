from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.db.session import get_db
from sqlalchemy.orm import Session
from app.routers.auth import router as auth_router
from app.routers.jobs import router as jobs_router
from app.routers.applications import router as applications_router
from app.routers.interviews import router as interviews_router
from app.routers.resume import router as resumes_router
from app.routers.skill import router as skills_router
from app.routers.dashboard import router as dashboard_router
from app.routers.analysis import router as analysis_router


app = FastAPI(
    title="CareerTrack API",
    description="API for the CareerTrack job application and resume management platform.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in settings.FRONTEND_ORIGINS.split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(applications_router)
app.include_router(interviews_router)
app.include_router(resumes_router)
app.include_router(skills_router)
app.include_router(dashboard_router)
app.include_router(analysis_router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "message": "CareerTrack API is running"
    }


@app.get("/health/database")
def database_health_check(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1"))

    return {
        "status": "healthy",
        "database": "connected",
        "result": result.scalar()
    }
