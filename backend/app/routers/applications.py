from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models import Application, Job, Resume, User
from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdate,
)


router = APIRouter(
    prefix="/applications",
    tags=["Applications"],
)


def owned_resume_id(resume_id: UUID | None, current_user: User, db: Session):
    if resume_id is None:
        return None
    resume = db.scalar(
        select(Resume).where(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        )
    )
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )
    return resume.id


@router.post(
    "",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_application(
    application_data: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.scalar(
        select(Job).where(
            Job.id == application_data.job_id,
            Job.user_id == current_user.id,
        )
    )

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    new_application = Application(
        user_id=current_user.id,
        job_id=job.id,
        resume_id=owned_resume_id(application_data.resume_id, current_user, db),
        status=application_data.status,
        date_applied=application_data.date_applied,
        notes=application_data.notes,
    )

    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    return ApplicationResponse(
        id=str(new_application.id),
        job_id=str(new_application.job_id),
        resume_id=(
            str(new_application.resume_id)
            if new_application.resume_id
            else None
        ),
        status=new_application.status,
        date_applied=new_application.date_applied,
        notes=new_application.notes,
    )


@router.get(
    "",
    response_model=list[ApplicationResponse],
)
def get_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (
        select(Application)
        .where(Application.user_id == current_user.id)
        .order_by(Application.created_at.desc())
    )

    applications = db.scalars(query).all()

    return [
        ApplicationResponse(
            id=str(application.id),
            job_id=str(application.job_id),
            resume_id=(
                str(application.resume_id)
                if application.resume_id
                else None
            ),
            status=application.status,
            date_applied=application.date_applied,
            notes=application.notes,
        )
        for application in applications
    ]


@router.get(
    "/{application_id}",
    response_model=ApplicationResponse,
)
def get_application(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = db.scalar(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    return ApplicationResponse(
        id=str(application.id),
        job_id=str(application.job_id),
        resume_id=(
            str(application.resume_id)
            if application.resume_id
            else None
        ),
        status=application.status,
        date_applied=application.date_applied,
        notes=application.notes,
    )

@router.patch(
    "/{application_id}",
    response_model=ApplicationResponse,
)
def update_application(
    application_id: str,
    application_data: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = db.scalar(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    update_data = application_data.model_dump(
        exclude_unset=True
    )

    if "resume_id" in update_data:
        update_data["resume_id"] = owned_resume_id(
            update_data["resume_id"], current_user, db
        )

    for field, value in update_data.items():
        setattr(application, field, value)

    db.commit()
    db.refresh(application)

    return ApplicationResponse(
        id=str(application.id),
        job_id=str(application.job_id),
        resume_id=(
            str(application.resume_id)
            if application.resume_id
            else None
        ),
        status=application.status,
        date_applied=application.date_applied,
        notes=application.notes,
    )


@router.delete(
    "/{application_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_application(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = db.scalar(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    db.delete(application)
    db.commit()

    return None
