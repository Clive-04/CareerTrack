from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from app.core.job_description import validate_job_description


class JobCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    company: str = Field(min_length=1, max_length=150)
    position: str = Field(min_length=1, max_length=200)
    location: str | None = Field(default=None, max_length=200)
    employment_type: str | None = Field(default=None, max_length=50)
    job_url: str | None = Field(default=None, max_length=500)
    description: str
    _validate_description = field_validator("description")(validate_job_description)
    salary_min: int | None = Field(default=None, ge=0, le=1_000_000_000)
    salary_max: int | None = Field(default=None, ge=0, le=1_000_000_000)

    @model_validator(mode="after")
    def validate_salary_range(self):
        if self.salary_min is not None and self.salary_max is not None and self.salary_min > self.salary_max:
            raise ValueError("Maximum salary must be greater than or equal to minimum salary")
        return self


class JobUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    _validate_description = field_validator("description")(validate_job_description)
    company: str = Field(default=None, min_length=1, max_length=150)
    position: str = Field(default=None, min_length=1, max_length=200)
    location: str | None = Field(default=None, max_length=200)
    employment_type: str | None = Field(default=None, max_length=50)
    job_url: str | None = Field(default=None, max_length=500)
    description: str | None = None
    salary_min: int | None = Field(default=None, ge=0, le=1_000_000_000)
    salary_max: int | None = Field(default=None, ge=0, le=1_000_000_000)

    @model_validator(mode="after")
    def validate_salary_range(self):
        if self.salary_min is not None and self.salary_max is not None and self.salary_min > self.salary_max:
            raise ValueError("Maximum salary must be greater than or equal to minimum salary")
        return self


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
