from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints


ResumeSkill = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


class ResumeCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=150)
    target_role: str = Field(default="", max_length=150)
    file_name: str = Field(default="", max_length=255)
    skills: list[ResumeSkill] = Field(default_factory=list, max_length=100)
    notes: str = Field(default="", max_length=20000)
    is_default: bool = False

class ResumeResponse(BaseModel):
    extraction_status: str
    has_file: bool = False
    id: str
    name: str
    file_name: str
    target_role: str
    skills: list[str]
    notes: str
    is_default: bool
    created_at: datetime
    updated_at: datetime

class ResumeUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )
    target_role: str | None = Field(default=None, max_length=150)
    file_name: str | None = Field(default=None, min_length=1, max_length=255)
    skills: list[ResumeSkill] | None = Field(default=None, max_length=100)
    notes: str | None = Field(default=None, max_length=20000)

    is_default: bool | None = None
