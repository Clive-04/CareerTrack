from pydantic import BaseModel, Field


class ResumeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    file_name: str = Field(min_length=1, max_length=255)
    file_path: str = Field(min_length=1, max_length=500)
    is_default: bool = False

class ResumeResponse(BaseModel):
    id: str
    name: str
    file_name: str
    file_path: str
    parsed_text: str | None
    is_default: bool

class ResumeUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )

    is_default: bool | None = None