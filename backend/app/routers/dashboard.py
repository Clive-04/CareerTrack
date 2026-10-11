from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models import Application, Interview, Job, User
from app.schemas.dashboard import DashboardSummary, RecentApplication


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "/summary",
    response_model=DashboardSummary,
)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total_jobs = db.scalar(
        select(func.count(Job.id)).where(
            Job.user_id == current_user.id
        )
    ) or 0

    total_applications = db.scalar(
        select(func.count(Application.id)).where(
            Application.user_id == current_user.id
        )
    ) or 0

    upcoming_interviews = db.scalar(
        select(func.count(Interview.id))
        .join(
            Application,
            Interview.application_id == Application.id,
        )
        .where(
            Application.user_id == current_user.id,
            Interview.scheduled_at > func.now(),
            Interview.status == "SCHEDULED",
        )
    ) or 0

    status_counts = db.execute(
        select(
            Application.status,
            func.count(Application.id),
        )
        .where(Application.user_id == current_user.id)
        .group_by(Application.status)
    ).all()

    applications_by_status = {
        status.value if hasattr(status, "value") else status: count
        for status, count in status_counts
    }

    recent_rows = db.execute(
        select(Application, Job)
        .join(Job, Application.job_id == Job.id)
        .where(Application.user_id == current_user.id)
        .order_by(Application.created_at.desc())
        .limit(5)
    ).all()

    recent_applications = [
        RecentApplication(
            id=str(application.id),
            company=job.company,
            position=job.position,
            status=application.status.value
            if hasattr(application.status, "value")
            else application.status,
            date_applied=application.date_applied,
        )
        for application, job in recent_rows
    ]

    return DashboardSummary(
        total_jobs=total_jobs,
        total_applications=total_applications,
        applications_by_status=applications_by_status,
        upcoming_interviews=upcoming_interviews,
        recent_applications=recent_applications,
    )