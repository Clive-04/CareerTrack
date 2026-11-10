import json

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.resume import Resume
from app.models.skill import Skill


def selected_skill_names(resume: Resume) -> list[str]:
    try:
        values = json.loads(resume.skills_json or "[]")
    except (TypeError, ValueError):
        return []
    return [str(value).strip() for value in values if str(value).strip()]


def selected_skills_context(resume: Resume, user_id, db: Session) -> str:
    names = selected_skill_names(resume)
    if not names:
        return ""

    normalized_names = {name.casefold() for name in names}
    rows = db.query(Skill).filter(
        Skill.user_id == user_id,
        func.lower(Skill.name).in_(normalized_names),
    ).all()
    by_name = {skill.name.casefold(): skill for skill in rows}
    entries: list[str] = []

    for name in names:
        skill = by_name.get(name.casefold())
        if skill is None:
            entries.append(f"- {name}")
            continue

        details = [
            f"category: {skill.category}",
            f"proficiency: {skill.proficiency}",
            f"experience: {skill.years_experience:g} years",
        ]
        if skill.notes.strip():
            details.append(f"notes: {skill.notes.strip()}")
        entries.append(f"- {skill.name} ({'; '.join(details)})")

    return "\n".join(entries)


def source_profile(resume: Resume, user_id, db: Session) -> str:
    return "\n\n".join(
        part for part in [resume.parsed_text or "", selected_skills_context(resume, user_id, db)]
        if part.strip()
    )
