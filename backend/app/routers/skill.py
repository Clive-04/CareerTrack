from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
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

def to_response(skill: Skill) -> SkillResponse:
    return SkillResponse(id=str(skill.id), name=skill.name, category=skill.category,
                         proficiency=skill.proficiency, years_experience=skill.years_experience,
                         notes=skill.notes)


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
        .filter(Skill.user_id == current_user.id, func.lower(Skill.name) == name.lower())
        .first()
    )

    if existing_skill:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A skill with this name already exists",
        )

    skill = Skill(user_id=current_user.id, name=name, category=skill_data.category, proficiency=skill_data.proficiency,
                  years_experience=skill_data.years_experience, notes=skill_data.notes)
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

    return to_response(skill)

@router.get(
    "",
    response_model=list[SkillResponse],
)
def get_skills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    skills = db.query(Skill).filter(Skill.user_id == current_user.id).order_by(Skill.name.asc()).all()

    return [
        to_response(skill)
        for skill in skills
    ]

@router.get(
    "/{skill_id}",
    response_model=SkillResponse,
)
def get_skill(
    skill_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    skill_uuid = UUID(str(skill_id))
    skill = db.query(Skill).filter(Skill.id == skill_uuid, Skill.user_id == current_user.id).first()

    if skill is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found",
        )

    return to_response(skill)

@router.patch(
    "/{skill_id}",
    response_model=SkillResponse,
)
def update_skill(
    skill_id: UUID,
    skill_data: SkillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    skill_uuid = UUID(str(skill_id))
    skill = db.query(Skill).filter(Skill.id == skill_uuid, Skill.user_id == current_user.id).first()

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
        .filter(Skill.user_id == current_user.id, func.lower(Skill.name) == name.lower(), Skill.id != skill_uuid)
        .first()
    )

    if existing_skill:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A skill with this name already exists",
        )

    skill.name = name
    update_data = skill_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field != "name":
            setattr(skill, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A skill with this name already exists",
        )

    db.refresh(skill)

    return to_response(skill)

@router.delete(
    "/{skill_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_skill(
    skill_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    skill_uuid = UUID(str(skill_id))
    skill = db.query(Skill).filter(Skill.id == skill_uuid, Skill.user_id == current_user.id).first()

    if skill is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found",
        )

    db.delete(skill)
    db.commit()

    return None
