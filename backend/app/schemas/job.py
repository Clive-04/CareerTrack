from pydantic import BaseModel, Field


class JobCreate(BaseModel):
    company: str = Field(min_length=1, max_length=150)
    position: str = Field(min_length=1, max_length=200)
    location: str | None = Field(default=None, max_length=200)
    employment_type: str | None = Field(default=None, max_length=50)
    job_url: str | None = Field(default=None, max_length=500)
    description: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None


class JobUpdate(BaseModel):
    company: str = Field(default=None, min_length=1, max_length=150)
    position: str = Field(default=None, min_length=1, max_length=200)
    location: str | None = Field(default=None, max_length=200)
    employment_type: str | None = Field(default=None, max_length=50)
    job_url: str | None = Field(default=None, max_length=500)
    description: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None


class JobResponse(BaseModel):
    id: str
    company: str
    position: str
    location: str | None
    employment_type: str | None
    job_url: str | None
    description: str | None
    salary_min: int | None
    salary_max: int | None