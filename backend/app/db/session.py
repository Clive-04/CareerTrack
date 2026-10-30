from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.exc import OperationalError, TimeoutError as PoolTimeoutError
from fastapi import HTTPException

from app.core.config import settings


engine = create_engine(
    settings.DATABASE_URL,
    echo=True,
    hide_parameters=True,
    connect_args={"connect_timeout": 5},
    pool_timeout=5,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)

def get_db():
    db = SessionLocal()

    try:
        yield db
    except (OperationalError, PoolTimeoutError):
        db.rollback()
        raise HTTPException(503, "The database is unavailable. Start PostgreSQL and try again.") from None
    finally:
        db.close()
