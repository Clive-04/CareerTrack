from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models import Application, Interview, User
from app.schemas.interview import (
    InterviewCreate,
    InterviewResponse,
    InterviewUpdate,
)


router = APIRouter(
    prefix="/interviews",
    tags=["Interviews"],
)


@router.post(
    "",
    response_model=InterviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_interview(
    interview_data: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = db.scalar(
        select(Application).where(
            Application.id == interview_data.application_id,
            Application.user_id == current_user.id,
        )
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    new_interview = Interview(
        application_id=application.id,
        scheduled_at=interview_data.scheduled_at,
        type=interview_data.type,
        location=interview_data.location,
        meeting_url=interview_data.meeting_url,
        status=interview_data.status,
        notes=interview_data.notes,
    )

    db.add(new_interview)
    db.commit()
    db.refresh(new_interview)

    return InterviewResponse(
        id=str(new_interview.id),
        application_id=str(new_interview.application_id),
        scheduled_at=new_interview.scheduled_at,
        type=new_interview.type,
        location=new_interview.location,
        meeting_url=new_interview.meeting_url,
        status=new_interview.status,
        notes=new_interview.notes,
    )

@router.get(
    "",
    response_model=list[InterviewResponse]
)
def get_interviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (
        select(Interview)
        .join(Application, Interview.application_id == Application.id)
        .where(Application.user_id == current_user.id)
        .order_by(Interview.scheduled_at.asc())
    )

    interviews = db.scalars(query).all()

    return [
        InterviewResponse(
            id=str(interview.id),
            application_id=str(interview.application_id),
            scheduled_at=interview.scheduled_at,
            type=interview.type,
            location=interview.location,
            meeting_url=interview.meeting_url,
            status=interview.status,
            notes=interview.notes,
        )
        for interview in interviews
    ]

@router.get(
    "/{interview_id}",
    response_model=InterviewResponse
)
def get_interview(
    interview_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    interview = db.scalar(
        select(Interview)
        .join(Application, Interview.application_id == Application.id)
        .where(
            Interview.id == interview_id,
            Application.user_id == current_user.id,
        )
    )

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found",
        )

    return InterviewResponse(
        id=str(interview.id),
        application_id=str(interview.application_id),
        scheduled_at=interview.scheduled_at,
        type=interview.type,
        location=interview.location,
        meeting_url=interview.meeting_url,
        status=interview.status,
        notes=interview.notes,
    )

@router.patch(
    "/{interview_id}",
    response_model=InterviewResponse
)
def update_interview(
    interview_id: str,
    interview_data: InterviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    interview = db.scalar(
        select(Interview)
        .join(Application, Interview.application_id == Application.id)
        .where(
            Interview.id == interview_id,
            Application.user_id == current_user.id,
        )
    )

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found",
        )

    update_data = interview_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(interview, field, value)

    db.commit()
    db.refresh(interview)

    return InterviewResponse(
        id=str(interview.id),
        application_id=str(interview.application_id),
        scheduled_at=interview.scheduled_at,
        type=interview.type,
        location=interview.location,
        meeting_url=interview.meeting_url,
        status=interview.status,
        notes=interview.notes,
    )

@router.delete(
    "/{interview_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_interview(
    interview_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    interview = db.scalar(
        select(Interview)
        .join(Application, Interview.application_id == Application.id)
        .where(
            Interview.id == interview_id,
            Application.user_id == current_user.id,
        )
    )

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found",
        )

    db.delete(interview)
    db.commit()

    return None