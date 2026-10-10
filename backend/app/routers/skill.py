import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.skill import Skill
from app.models.user import User
from app.schemas.skill import SkillCreate, SkillResponse, SkillUpdate


router = APIRouter(
    prefix="/skills",
    tags=["Skills"],
)


@router.post(
    "",
    response_model=SkillResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_skill(
    skill_data: SkillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    name = skill_data.name.strip()

    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Skill name cannot be empty",
        )

    existing_skill = (
        db.query(Skill)
        .filter(Skill.name.ilike(name))
        .first()
    )

    if existing_skill:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A skill with this name already exists",
        )

    skill = Skill(name=name)
    db.add(skill)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A skill with this name already exists",
        )

    db.refresh(skill)

    return SkillResponse(
        id=str(skill.id),
        name=skill.name,
    )

@router.get(
    "",
    response_model=list[SkillResponse],
)
def get_skills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    skills = db.query(Skill).order_by(Skill.name.asc()).all()

    return [
        SkillResponse(
            id=str(skill.id),
            name=skill.name,
        )
        for skill in skills
    ]

@router.get(
    "/{skill.py}",
    response_model=SkillResponse,
)
def get_skill(
    skill_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    import uuid

    try:
        skill_uuid = uuid.UUID(skill_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Invalid skill ID",
        )

    skill = db.query(Skill).filter(Skill.id == skill_uuid).first()

    if skill is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found",
        )

    return SkillResponse(
        id=str(skill.id),
        name=skill.name,
    )

@router.patch(
    "/{skill_id}",
    response_model=SkillResponse,
)
def update_skill(
    skill_id: str,
    skill_data: SkillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        skill_uuid = uuid.UUID(skill_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Invalid skill ID",
        )

    skill = db.query(Skill).filter(Skill.id == skill_uuid).first()

    if skill is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found",
        )

    name = skill_data.name.strip()

    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Skill name cannot be empty",
        )

    existing_skill = (
        db.query(Skill)
        .filter(Skill.name.ilike(name), Skill.id != skill_uuid)
        .first()
    )

    if existing_skill:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A skill with this name already exists",
        )

    skill.name = name

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A skill with this name already exists",
        )

    db.refresh(skill)

    return SkillResponse(
        id=str(skill.id),
        name=skill.name,
    )

@router.delete(
    "/{skill_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_skill(
    skill_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        skill_uuid = uuid.UUID(skill_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Invalid skill ID",
        )

    skill = db.query(Skill).filter(Skill.id == skill_uuid).first()

    if skill is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found",
        )

    db.delete(skill)
    db.commit()

    return None