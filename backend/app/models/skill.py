import uuid

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    resumes: Mapped[list["Resume"]] = relationship(
        secondary="resume_skills",
        back_populates="skills",
    )

    jobs: Mapped[list["Job"]] = relationship(
        secondary="job_skills",
        back_populates="skills",
    )