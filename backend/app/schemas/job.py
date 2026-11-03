from datetime import datetime

from pydantic import BaseModel, Field, field_validator
from app.core.job_description import validate_job_description


class JobCreate(BaseModel):
    company: str = Field(min_length=1, max_length=150)
    position: str = Field(min_length=1, max_length=200)
    location: str | None = Field(default=None, max_length=200)
    employment_type: str | None = Field(default=None, max_length=50)
    job_url: str | None = Field(default=None, max_length=500)
    description: str
    _validate_description = field_validator("description")(validate_job_description)
    salary_min: int | None = None
    salary_max: int | None = None


class JobUpdate(BaseModel):
    _validate_description = field_validator("description")(validate_job_description)
    company: str = Field(default=None, min_length=1, max_length=150)
    position: str = Field(default=None, min_length=1, max_length=200)
    location: str | None = Field(default=None, max_length=200)
    employment_type: str | None = Field(default=None, max_length=50)
    job_url: str | None = Field(default=None, max_length=500)
    description: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None


class JobResponse(BaseModel):
    id: str
    company: str
    position: str
    location: str | None
    employment_type: str | None
    job_url: str | None
    description: str | None
    salary_min: int | None
    salary_max: int | None
    created_at: datetime
    latest_analysis_score: int | None = None
    latest_analysis_resume_id: str | None = None
    latest_analysis_created_at: datetime | None = None
    latest_analysis_is_stale: bool | None = None
    latest_analysis_stale_reasons: list[str] = Field(default_factory=list)
