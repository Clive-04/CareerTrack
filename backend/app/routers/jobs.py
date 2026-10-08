from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models import Job, User
from app.schemas.job import JobCreate, JobResponse, JobUpdate


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

@router.get(
    "",
    response_model=list[JobResponse],
)
def get_jobs(
    search: str | None = Query(default=None),
    location: str | None = Query(default=None),
    employment_type: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = select(Job).where(
        Job.user_id == current_user.id,
    )

    if search:
        search_pattern = f"%{search}%"

        query = query.where(
            Job.company.ilike(search_pattern)
            | Job.position.ilike(search_pattern)
            | Job.description.ilike(search_pattern)
        )

    if location:
        query = query.where(
            Job.location.ilike(f"%{location}%")
        )

    if employment_type:
        query = query.where(
            Job.employment_type.ilike(f"%{employment_type}%")
        )

    query = query.order_by(Job.created_at.desc())

    jobs = db.scalars(query).all()

    return [
        JobResponse(
            id=str(job.id),
            company=job.company,
            position=job.position,
            location=job.location,
            employment_type=job.employment_type,
            job_url=job.job_url,
            description=job.description,
            salary_min=job.salary_min,
            salary_max=job.salary_max,
        )
        for job in jobs
    ]

@router.get(
    "/{job_id}",
    response_model=JobResponse,
)
def get_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.scalar(
        select(Job).where(
            Job.id == job_id,
            Job.user_id == current_user.id,
        )
    )

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    return JobResponse(
        id=str(job.id),
        company=job.company,
        position=job.position,
        location=job.location,
        employment_type=job.employment_type,
        job_url=job.job_url,
        description=job.description,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
    )

@router.patch(
    "/{job_id}",
    response_model=JobResponse,
)
def update_job(
    job_id: str,
    job_data: JobUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.scalar(
        select(Job).where(
            Job.id == job_id,
            Job.user_id == current_user.id,
        )
    )

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    update_data = job_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(job, field, value)

    db.commit()
    db.refresh(job)

    return JobResponse(
        id=str(job.id),
        company=job.company,
        position=job.position,
        location=job.location,
        employment_type=job.employment_type,
        job_url=job.job_url,
        description=job.description,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
    )

@router.delete(
    "/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.scalar(
        select(Job).where(
            Job.id == job_id,
            Job.user_id == current_user.id,
        )
    )

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    db.delete(job)
    db.commit()