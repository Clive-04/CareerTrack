from app.schemas.auth import UserLogin, UserRegister, UserResponse
from app.schemas.job import JobCreate, JobResponse, JobUpdate
from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdate,
)
from app.schemas.interview import (
    InterviewCreate,
    InterviewResponse,
    InterviewUpdate,
)
from app.schemas.resume import (
    ResumeCreate,
    ResumeResponse,
    ResumeUpdate,
)
from app.schemas.skill import (
    SkillCreate,
    SkillResponse,
    SkillUpdate,
)
from app.schemas.dashboard import DashboardSummary


__all__ = [
    "UserLogin",
    "UserRegister",
    "UserResponse",
    "JobCreate",
    "JobUpdate",
    "JobResponse",
    "ApplicationCreate",
    "ApplicationUpdate",
    "ApplicationResponse",
    "InterviewCreate",
    "InterviewResponse",
    "InterviewUpdate",
    "ResumeCreate",
    "ResumeResponse",
    "ResumeUpdate",
    "SkillCreate",
    "SkillUpdate",
    "SkillResponse",
    "DashboardSummary",
]