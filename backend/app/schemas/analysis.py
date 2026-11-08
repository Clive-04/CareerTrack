from typing import Annotated
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, StrictBool, StringConstraints, field_validator
from datetime import datetime
from app.core.job_description import validate_job_description

Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]


class PreviewRequest(BaseModel):
    resume_id: UUID


class AnalysisRequest(PreviewRequest):
    _validate_job = field_validator("job_description")(validate_job_description)
    consent: StrictBool
    resume_text: str = Field(min_length=50, max_length=40000)
    skills_context: str = Field(default="", max_length=10000)
    job_description: str = Field(min_length=50, max_length=20000)


class Match(BaseModel):
    model_config = ConfigDict(extra="forbid")
    requirement: Text
    evidence: Text


class AnalysisResult(BaseModel):
    model_config = ConfigDict(extra="forbid")
    score: int = Field(ge=0, le=100, strict=True)
    summary: Text
    matches: list[Match] = Field(max_length=12)
    gaps: list[Text] = Field(max_length=12)
    suggestions: list[Text] = Field(max_length=12)


class SavedAnalysis(AnalysisResult):
    id: UUID
    job_id: UUID
    resume_id: UUID | None
    resume_name: str
    job_title: str
    company: str
    model: str
    created_at: datetime
