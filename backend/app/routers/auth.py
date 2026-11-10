from secrets import token_urlsafe

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import User
from app.schemas.auth import SessionResponse, UserLogin, UserRegister, UserResponse
from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.core.rate_limit import auth_limiter, private_identifier


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

INVALID_PASSWORD_HASH = hash_password("invalid-password-used-only-for-timing")


def set_session_cookie(response: Response, access_token: str) -> str:
    csrf_token = token_urlsafe(32)
    cookie_options = {
        "max_age": settings.JWT_ACCESS_TOKEN_MINUTES * 60,
        "path": "/",
        "domain": settings.AUTH_COOKIE_DOMAIN or None,
        "secure": settings.AUTH_COOKIE_SECURE,
        "httponly": True,
        "samesite": settings.AUTH_COOKIE_SAMESITE,
    }
    response.set_cookie(settings.AUTH_COOKIE_NAME, access_token, **cookie_options)
    response.set_cookie(settings.CSRF_COOKIE_NAME, csrf_token, **cookie_options)
    response.headers["Cache-Control"] = "no-store"
    return csrf_token


def session_response(user: User, csrf_token: str) -> SessionResponse:
    return SessionResponse(
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
        ),
        csrf_token=csrf_token,
    )


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)

def register_user(
    user_data: UserRegister,
    request: Request,
    db: Session = Depends(get_db),
):
    client = request.client.host if request.client else "unknown"
    auth_limiter.check(f"register:{client}", limit=5, window_seconds=3600)
    existing_user = db.scalar(
        select(User).where(func.lower(User.email) == str(user_data.email).lower())
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    new_user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
    )

    db.add(new_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        ) from None
    db.refresh(new_user)

    return UserResponse(
        id=str(new_user.id),
        email=new_user.email,
        first_name=new_user.first_name,
        last_name=new_user.last_name,
    )

@router.post("/login", response_model=SessionResponse)
def login_user(
    user_data: UserLogin,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    client = request.client.host if request.client else "unknown"
    key = f"login:{client}:{private_identifier(str(user_data.email))}"
    auth_limiter.check(key, limit=10, window_seconds=300)
    user = db.scalar(
        select(User).where(func.lower(User.email) == str(user_data.email).lower())
    )
    password_matches = verify_password(
        user_data.password,
        user.password_hash if user else INVALID_PASSWORD_HASH,
    )

    if user is None or not password_matches:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    csrf_token = set_session_cookie(response, create_access_token(str(user.id)))
    auth_limiter.reset(key)

    return session_response(user, csrf_token)

@router.get("/me", response_model=SessionResponse)
def get_my_profile(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
):
    csrf_token = request.cookies.get(settings.CSRF_COOKIE_NAME)
    if not csrf_token:
        access_token = request.cookies.get(settings.AUTH_COOKIE_NAME)
        csrf_token = set_session_cookie(response, access_token) if access_token else token_urlsafe(32)
    response.headers["Cache-Control"] = "no-store"
    return session_response(current_user, csrf_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout_user(response: Response):
    cookie_options = {"path": "/", "domain": settings.AUTH_COOKIE_DOMAIN or None}
    response.delete_cookie(settings.AUTH_COOKIE_NAME, **cookie_options)
    response.delete_cookie(settings.CSRF_COOKIE_NAME, **cookie_options)
    response.headers["Cache-Control"] = "no-store"
    return None
