from pydantic import BaseModel, Field


class SkillCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100,
    )
    category: str = Field(default="Other", max_length=50)
    proficiency: str = Field(default="Beginner", max_length=30)
    years_experience: float = Field(default=0, ge=0, le=60)
    notes: str = ""

class SkillUpdate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100,
    )
    category: str | None = Field(default=None, max_length=50)
    proficiency: str | None = Field(default=None, max_length=30)
    years_experience: float | None = Field(default=None, ge=0, le=60)
    notes: str | None = None

class SkillResponse(BaseModel):
    id: str
    name: str
    category: str
    proficiency: str
    years_experience: float
    notes: str
