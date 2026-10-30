from datetime import datetime
from pydantic import BaseModel, Field


class ResumeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    target_role: str = Field(default="", max_length=150)
    file_name: str = Field(default="", max_length=255)
    file_path: str = Field(default="", max_length=500)
    skills: list[str] = Field(default_factory=list)
    notes: str = ""
    is_default: bool = False

class ResumeResponse(BaseModel):
    extraction_status: str
    has_file: bool = False
    id: str
    name: str
    file_name: str
    file_path: str
    parsed_text: str | None
    target_role: str
    skills: list[str]
    notes: str
    is_default: bool
    created_at: datetime
    updated_at: datetime

class ResumeUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )
    target_role: str | None = Field(default=None, max_length=150)
    file_name: str | None = Field(default=None, min_length=1, max_length=255)
    file_path: str | None = Field(default=None, min_length=1, max_length=500)
    skills: list[str] | None = None
    notes: str | None = None

    is_default: bool | None = None
