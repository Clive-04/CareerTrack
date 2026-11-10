from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class InterviewCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    application_id: UUID
    scheduled_at: datetime
    type: str = Field(min_length=1, max_length=50)
    location: str | None = Field(default=None, max_length=200)
    meeting_url: str | None = Field(default=None, max_length=500)
    status: Literal["SCHEDULED", "COMPLETED", "CANCELLED"] = "SCHEDULED"
    notes: str | None = Field(default=None, max_length=10000)

class InterviewUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scheduled_at: datetime | None = None
    type: str | None = Field(default=None, min_length=1, max_length=50)
    location: str | None = Field(default=None, max_length=200)
    meeting_url: str | None = Field(default=None, max_length=500)
    status: Literal["SCHEDULED", "COMPLETED", "CANCELLED"] | None = None
    notes: str | None = Field(default=None, max_length=10000)

class InterviewResponse(BaseModel):
    id: str
    application_id: str
    scheduled_at: datetime
    type: str
    location: str | None
    meeting_url: str | None
    status: str
    notes: str | None
