from pydantic import BaseModel, Field


class SkillCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100,
    )

class SkillUpdate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100,
    )

class SkillResponse(BaseModel):
    id: str
    name: str