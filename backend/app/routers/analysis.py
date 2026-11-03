import re
from threading import Lock
from time import monotonic
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.gemini import analyze
from app.core.config import settings
from app.core.job_description import validate_job_description
from app.core.analysis_freshness import source_fingerprints
from app.models.analysis import ResumeAnalysis
from app.db.session import get_db
from app.models.job import Job
from app.models.user import User
from app.routers.resume import owned_resume
from app.schemas.analysis import AnalysisRequest, AnalysisResult, PreviewRequest, SavedAnalysis

router = APIRouter(prefix="/jobs", tags=["Resume analysis"])
_lock = Lock()
_last_requests: dict[str, float] = {}


def documents(job_id: UUID, resume_id: UUID, user: User, db: Session):
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == user.id).first()
    if job is None:
        raise HTTPException(404, "Saved job not found.")
    resume = owned_resume(resume_id, user, db)
    if not resume.parsed_text or len(resume.parsed_text.strip()) < 50:
        raise HTTPException(422, "Extract readable resume text first. At least 50 characters are needed.")
    description = (job.description or "").strip()
    try:
        validate_job_description(description)
    except ValueError as error:
        raise HTTPException(422, str(error)) from None
    return job, resume


def redact_contacts(text: str, user: User) -> str:
    # Convenience only: users must review addresses, names, and identifying details.
    for value in [f"{user.first_name} {user.last_name}", user.email]:
        if value.strip():
            text = re.sub(re.escape(value), "[removed]", text, flags=re.I)
    text = re.sub(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}", "[email removed]", text)
    text = re.sub(r"https?://\S+|www\.\S+", "[link removed]", text)
    text = re.sub(r"(?<!\w)\+?\d[\d ().-]{7,}\d(?!\w)", "[number removed]", text)
    return text


@router.post("/{job_id}/analysis-preview")
def preview(job_id: UUID, data: PreviewRequest, response: Response,
            user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job, resume = documents(job_id, data.resume_id, user, db)
    response.headers["Cache-Control"] = "no-store"
    return {"resume_text": redact_contacts(resume.parsed_text, user),
            "job_description": redact_contacts(job.description, user)}


@router.post("/{job_id}/analyze", response_model=SavedAnalysis)
def analyze_resume(job_id: UUID, data: AnalysisRequest, response: Response,
                   user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.consent is not True:
        raise HTTPException(422, "Review the text and consent before sending it to Gemini.")
    job, resume = documents(job_id, data.resume_id, user, db)
    if len(data.resume_text.strip()) < 50:
        raise HTTPException(422, "Provide at least 50 characters of meaningful resume text.")
    try:
        validate_job_description(data.job_description)
    except ValueError as error:
        raise HTTPException(422, str(error)) from None
    # Per-process throttle for the local app. No prompt content is retained here.
    with _lock:
        now = monotonic()
        for key in list(_last_requests):
            if now - _last_requests[key] >= 60:
                del _last_requests[key]
        key = str(user.id)
        if key in _last_requests:
            raise HTTPException(429, "Please wait one minute between analysis requests.")
        _last_requests[key] = now
    response.headers["Cache-Control"] = "no-store"
    # Capture labels before generation; history stays a snapshot after future edits.
    row = ResumeAnalysis(user_id=user.id, job_id=job.id, resume_id=resume.id,
                         resume_name=resume.name, job_title=job.position, company=job.company,
                         model=settings.GEMINI_MODEL)
    result = AnalysisResult.model_validate(analyze(data.resume_text.strip(), data.job_description.strip()))
    row.result = {
        **result.model_dump(),
        **source_fingerprints(job.description, resume.parsed_text),
    }
    db.add(row)
    try:
        db.commit()
        db.refresh(row)
    except Exception:
        db.rollback()
        raise HTTPException(503, "Analysis completed but its history could not be saved. Please try again later.") from None
    return saved_response(row)


def saved_response(row: ResumeAnalysis) -> SavedAnalysis:
    public_result = {field: row.result[field] for field in AnalysisResult.model_fields}
    return SavedAnalysis(**public_result, id=row.id, job_id=row.job_id, resume_id=row.resume_id,
                         resume_name=row.resume_name, job_title=row.job_title, company=row.company,
                         model=row.model, created_at=row.created_at)


@router.get("/{job_id}/analyses", response_model=list[SavedAnalysis])
def list_analyses(job_id: UUID, response: Response, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = "no-store"
    if not db.query(Job).filter(Job.id == job_id, Job.user_id == user.id).first():
        raise HTTPException(404, "Saved job not found.")
    rows = db.query(ResumeAnalysis).filter(ResumeAnalysis.job_id == job_id, ResumeAnalysis.user_id == user.id).order_by(ResumeAnalysis.created_at.desc(), ResumeAnalysis.id.desc()).all()
    return [saved_response(row) for row in rows]


@router.delete("/{job_id}/analyses/{analysis_id}", status_code=204)
def delete_analysis(job_id: UUID, analysis_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(ResumeAnalysis).filter(ResumeAnalysis.id == analysis_id,
        ResumeAnalysis.job_id == job_id, ResumeAnalysis.user_id == user.id).first()
    if row is None:
        raise HTTPException(404, "Analysis not found.")
    db.delete(row)
    db.commit()
