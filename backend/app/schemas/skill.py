from pydantic import BaseModel, ConfigDict, Field


class SkillCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(
        min_length=1,
        max_length=100,
    )
    category: str = Field(default="Other", max_length=50)
    proficiency: str = Field(default="Beginner", max_length=30)
    years_experience: float = Field(default=0, ge=0, le=60)
    notes: str = Field(default="", max_length=10000)

class SkillUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(
        min_length=1,
        max_length=100,
    )
    category: str | None = Field(default=None, max_length=50)
    proficiency: str | None = Field(default=None, max_length=30)
    years_experience: float | None = Field(default=None, ge=0, le=60)
    notes: str | None = Field(default=None, max_length=10000)

class SkillResponse(BaseModel):
    id: str
    name: str
    category: str
    proficiency: str
    years_experience: float
    notes: str
