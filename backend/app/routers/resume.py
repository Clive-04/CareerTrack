from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.resume import Resume
from app.models.user import User
from app.schemas.resume import ResumeCreate, ResumeResponse, ResumeUpdate

router = APIRouter(
    prefix="/resumes",
    tags=["Resumes"],
)

@router.post(
    "",
    response_model=ResumeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_resume(
    resume_data: ResumeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if resume_data.is_default:
        existing_default=(
            db.query(Resume)
            .filter(
                Resume.user_id == current_user.id,
                Resume.is_default.is_(True),
            )
            .first()
        )

        if existing_default:
            existing_default.is_default = False

    resume = Resume(
        user_id=current_user.id,
        name=resume_data.name,
        file_name=resume_data.file_name,
        file_path=resume_data.file_path,
        is_default=resume_data.is_default,
    )

    db.add(resume)
    db.commit()
    db.refresh(resume)

    return ResumeResponse(
        id=str(resume.id),
        name=resume.name,
        file_name=resume.file_name,
        file_path=resume.file_path,
        parsed_text=resume.parsed_text,
        is_default=resume.is_default,
    )

@router.get(
    "",
    response_model=list[ResumeResponse],
)
def get_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .all()
    )

    return [
        ResumeResponse(
            id=str(resume.id),
            name=resume.name,
            file_name=resume.file_name,
            file_path=resume.file_path,
            parsed_text=resume.parsed_text,
            is_default=resume.is_default,
        )
        for resume in resumes
    ]

@router.get(
    "/{resume_id}",
    response_model=ResumeResponse,
)
def get_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        )
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )

    return ResumeResponse(
        id=str(resume.id),
        name=resume.name,
        file_name=resume.file_name,
        file_path=resume.file_path,
        parsed_text=resume.parsed_text,
        is_default=resume.is_default,
    )

@router.patch(
    "/{resume_id}",
    response_model=ResumeResponse,
)
def update_resume(
    resume_id: str,
    resume_data: ResumeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        )
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )

    update_data = resume_data.model_dump(exclude_unset=True)

    if update_data.get("is_default") is True:
        existing_default = (
            db.query(Resume)
            .filter(
                Resume.user_id == current_user.id,
                Resume.is_default.is_(True),
                Resume.id != resume.id,
            )
            .first()
        )

        if existing_default:
            existing_default.is_default = False

    for field, value in update_data.items():
        setattr(resume, field, value)

    db.commit()
    db.refresh(resume)

    return ResumeResponse(
        id=str(resume.id),
        name=resume.name,
        file_name=resume.file_name,
        file_path=resume.file_path,
        parsed_text=resume.parsed_text,
        is_default=resume.is_default,
    )

@router.delete(
    "/{resume_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        )
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )

    db.delete(resume)
    db.commit()

    return None