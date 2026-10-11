from datetime import date

from pydantic import BaseModel


class RecentApplication(BaseModel):
    id: str
    company: str
    position: str
    status: str
    date_applied: date | None


class DashboardSummary(BaseModel):
    total_jobs: int
    total_applications: int
    applications_by_status: dict[str, int]
    upcoming_interviews: int
    recent_applications: list[RecentApplication]