from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models import Job, Resume, ResumeAnalysis, User
from app.core.analysis_freshness import stale_reasons
from app.core.analysis_context import source_profile
from app.schemas.job import JobCreate, JobResponse, JobUpdate
from app.core.job_description import validate_job_description


router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"],
)


def latest_analyses(db: Session, user_id, job_ids) -> dict:
    ids = list(job_ids)
    if not ids:
        return {}
    rows = db.scalars(
        select(ResumeAnalysis)
        .where(
            ResumeAnalysis.user_id == user_id,
            ResumeAnalysis.job_id.in_(ids),
        )
        .order_by(ResumeAnalysis.created_at.desc())
    ).all()
    latest = {}
    for row in rows:
        latest.setdefault(row.job_id, row)
    return latest


def resumes_for_analyses(db: Session, analyses: dict) -> dict:
    resume_ids = {row.resume_id for row in analyses.values() if row.resume_id}
    if not resume_ids:
        return {}
    return {resume.id: resume for resume in db.scalars(select(Resume).where(Resume.id.in_(resume_ids))).all()}


def job_response(job: Job, analysis: ResumeAnalysis | None = None, resume: Resume | None = None,
                 db: Session | None = None) -> JobResponse:
    score = analysis.result.get("score") if analysis else None
    current_source = source_profile(resume, job.user_id, db) if resume is not None and db is not None else None
    reasons = stale_reasons(job, analysis, resume, current_source)
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
        created_at=job.created_at,
        latest_analysis_score=int(score) if isinstance(score, (int, float)) else None,
        latest_analysis_resume_id=str(analysis.resume_id) if analysis and analysis.resume_id else None,
        latest_analysis_created_at=analysis.created_at if analysis else None,
        latest_analysis_is_stale=bool(reasons) if analysis else None,
        latest_analysis_stale_reasons=reasons,
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

    return job_response(new_job)

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

    analyses = latest_analyses(db, current_user.id, (job.id for job in jobs))
    resumes = resumes_for_analyses(db, analyses)
    return [job_response(job, analyses.get(job.id), resumes.get(analyses[job.id].resume_id) if job.id in analyses else None, db) for job in jobs]

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

    analysis = latest_analyses(db, current_user.id, [job.id]).get(job.id)
    resumes = resumes_for_analyses(db, {job.id: analysis} if analysis else {})
    return job_response(job, analysis, resumes.get(analysis.resume_id) if analysis else None, db)

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
    try:
        validate_job_description(update_data.get("description", job.description))
    except ValueError as error:
        raise HTTPException(422, str(error)) from None

    for field, value in update_data.items():
        setattr(job, field, value)

    db.commit()
    db.refresh(job)

    analysis = latest_analyses(db, current_user.id, [job.id]).get(job.id)
    resumes = resumes_for_analyses(db, {job.id: analysis} if analysis else {})
    return job_response(job, analysis, resumes.get(analysis.resume_id) if analysis else None, db)

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
