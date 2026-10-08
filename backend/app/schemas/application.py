from datetime import date

from pydantic import BaseModel

from app.models.application import ApplicationStatus


class ApplicationCreate(BaseModel):
    job_id: str
    resume_id: str | None = None
    status: ApplicationStatus = ApplicationStatus.SAVED
    date_applied: date | None = None
    notes: str | None = None


class ApplicationUpdate(BaseModel):
    resume_id: str | None = None
    status: ApplicationStatus | None = None
    date_applied: date | None = None
    notes: str | None = None


class ApplicationResponse(BaseModel):
    id: str
    job_id: str
    resume_id: str | None
    status: ApplicationStatus
    date_applied: date | None
    notes: str | None