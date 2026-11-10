import json
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from fastapi.responses import FileResponse
from pydantic import ValidationError
from app.core.resume_storage import stored_path, save_upload, remove_file
from app.core.resume_text import extract_text
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


def to_response(resume: Resume) -> ResumeResponse:
    return ResumeResponse(
        extraction_status=("ready" if resume.parsed_text else "pending" if resume.parsed_text is None else "unavailable"),
        id=str(resume.id), name=resume.name, target_role=resume.target_role,
        file_name=resume.file_name,
        skills=json.loads(resume.skills_json or "[]"), notes=resume.notes or "",
        is_default=resume.is_default, created_at=resume.created_at,
        updated_at=resume.updated_at,
        has_file=bool(stored_path(resume.file_path) and stored_path(resume.file_path).is_file()),
    )


def owned_resume(resume_id: UUID, user: User, db: Session) -> Resume:
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == user.id).first()
    if resume is None:
        raise HTTPException(404, "Resume not found")
    return resume


def save_document(metadata: str, file: UploadFile | None, user: User, db: Session,
                  resume: Resume | None = None):
    try:
        details = ResumeCreate.model_validate_json(metadata)
    except ValidationError:
        raise HTTPException(422, "Check the resume name, target role, and skills.")
    if not details.name.strip():
        raise HTTPException(422, "Resume name is required.")
    if resume is None and file is None:
        raise HTTPException(422, "Select a PDF or DOCX file.")
    old_key = resume.file_path if resume else None
    key = None
    try:
        if file is not None:
            key, filename = save_upload(file)
        if resume is None:
            resume = Resume(user_id=user.id, file_path=key, file_name=filename)
            db.add(resume)
        if key:
            resume.file_path = key
            resume.file_name = filename
            resume.parsed_text = extract_text(stored_path(key))
        resume.name = details.name.strip()
        resume.target_role = details.target_role
        resume.skills_json = json.dumps(details.skills)
        resume.notes = details.notes
        if details.is_default:
            for other in db.query(Resume).filter(Resume.user_id == user.id, Resume.is_default.is_(True)).all():
                other.is_default = False
        resume.is_default = details.is_default
        db.commit()
    except Exception:
        db.rollback()
        if key:
            remove_file(key)
        raise
    if key and old_key:
        remove_file(old_key)
    db.refresh(resume)
    return to_response(resume)


@router.post("/upload", response_model=ResumeResponse, status_code=201)
def upload_resume(metadata: str = Form(...), file: UploadFile = File(...),
                  current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return save_document(metadata, file, current_user, db)


@router.put("/{resume_id}/upload", response_model=ResumeResponse)
def replace_resume(resume_id: UUID, metadata: str = Form(...), file: UploadFile | None = File(None),
                   current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return save_document(metadata, file, current_user, db, owned_resume(resume_id, current_user, db))


@router.get("/{resume_id}/download")
def download_resume(resume_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = owned_resume(resume_id, current_user, db)
    path = stored_path(resume.file_path)
    if path is None or not path.is_file():
        raise HTTPException(404, "No file uploaded yet. Edit this resume to upload its file.")
    media = "application/pdf" if path.suffix == ".pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    return FileResponse(path, media_type=media, filename=resume.file_name, headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"})


@router.post("/{resume_id}/extract", response_model=ResumeResponse)
def extract_resume(resume_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = owned_resume(resume_id, current_user, db)
    path = stored_path(resume.file_path)
    if path is None or not path.is_file():
        raise HTTPException(404, "Edit this resume to upload its file first.")
    resume.parsed_text = extract_text(path)
    db.commit()
    db.refresh(resume)
    return to_response(resume)

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
        target_role=resume_data.target_role,
        file_name=resume_data.file_name,
        file_path="",
        skills_json=json.dumps(resume_data.skills),
        notes=resume_data.notes,
        is_default=resume_data.is_default,
    )

    db.add(resume)
    db.commit()
    db.refresh(resume)

    return to_response(resume)

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
        to_response(resume)
        for resume in resumes
    ]

@router.get(
    "/{resume_id}",
    response_model=ResumeResponse,
)
def get_resume(
    resume_id: UUID,
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

    return to_response(resume)

@router.patch(
    "/{resume_id}",
    response_model=ResumeResponse,
)
def update_resume(
    resume_id: UUID,
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
        if field == "file_name":
            continue  # Stored file identity is controlled only by the upload endpoint.
        if field == "skills":
            value = json.dumps(value)
            field = "skills_json"
        setattr(resume, field, value)

    db.commit()
    db.refresh(resume)

    return to_response(resume)

@router.delete(
    "/{resume_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_resume(
    resume_id: UUID,
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

    file_key = resume.file_path
    db.delete(resume)
    db.commit()
    remove_file(file_key)

    return None
