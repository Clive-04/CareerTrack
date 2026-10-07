from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models import Job, User
from app.schemas.job import JobCreate, JobResponse


router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"],
)


@router.post(
    "",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_job(
    job_data: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_job = Job(
        user_id=current_user.id,
        company=job_data.company,
        position=job_data.position,
        location=job_data.location,
        employment_type=job_data.employment_type,
        job_url=job_data.job_url,
        description=job_data.description,
        salary_min=job_data.salary_min,
        salary_max=job_data.salary_max,
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return JobResponse(
        id=str(new_job.id),
        company=new_job.company,
        position=new_job.position,
        location=new_job.location,
        employment_type=new_job.employment_type,
        job_url=new_job.job_url,
        description=new_job.description,
        salary_min=new_job.salary_min,
        salary_max=new_job.salary_max,
    )