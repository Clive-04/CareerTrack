from datetime import datetime

from pydantic import BaseModel, Field


class InterviewCreate(BaseModel):
    application_id: str
    scheduled_at: datetime
    type: str = Field(min_length=1, max_length=50)
    location: str | None = Field(default=None, max_length=200)
    meeting_url: str | None = Field(default=None, max_length=500)
    status: str = "SCHEDULED"
    notes: str | None = None

class InterviewUpdate(BaseModel):
    scheduled_at: datetime | None = None
    type: str | None = Field(default=None, min_length=1, max_length=50)
    location: str | None = Field(default=None, max_length=200)
    meeting_url: str | None = Field(default=None, max_length=500)
    status: str | None = None
    notes: str | None = None

class InterviewResponse(BaseModel):
    id: str
    application_id: str
    scheduled_at: datetime
    type: str
    location: str | None
    meeting_url: str | None
    status: str
    notes: str | None