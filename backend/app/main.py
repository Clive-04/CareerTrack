from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.middleware import CookieCSRFMiddleware, LimitRequestBodyMiddleware
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
    docs_url=None if settings.ENVIRONMENT == "production" else "/docs",
    redoc_url=None if settings.ENVIRONMENT == "production" else "/redoc",
    openapi_url=None if settings.ENVIRONMENT == "production" else "/openapi.json",
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.allowed_hosts,
)
if settings.FORCE_HTTPS:
    app.add_middleware(HTTPSRedirectMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token"],
)
app.add_middleware(LimitRequestBodyMiddleware, max_bytes=settings.MAX_REQUEST_BYTES)
app.add_middleware(CookieCSRFMiddleware)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    if (
        request.url.path.startswith("/auth")
        or "authorization" in request.headers
        or settings.AUTH_COOKIE_NAME in request.cookies
    ):
        response.headers["Cache-Control"] = "no-store"
    return response

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
    db.execute(text("SELECT 1"))

    return {
        "status": "healthy",
        "database": "connected",
    }
