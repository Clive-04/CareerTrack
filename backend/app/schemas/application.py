from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.application import ApplicationStatus


class ApplicationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    job_id: UUID
    resume_id: UUID | None = None
    status: ApplicationStatus = ApplicationStatus.SAVED
    date_applied: date | None = None
    notes: str | None = Field(default=None, max_length=10000)


class ApplicationUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    resume_id: UUID | None = None
    status: ApplicationStatus | None = None
    date_applied: date | None = None
    notes: str | None = Field(default=None, max_length=10000)


class ApplicationResponse(BaseModel):
    id: str
    job_id: str
    resume_id: str | None
    status: ApplicationStatus
    date_applied: date | None
    notes: str | None
