import uuid

from sqlalchemy import ForeignKey, Index, Integer, String, Text, func
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
        nullable=False,
        index=True,
    )

    # Null ownership is reserved for legacy shared records, hidden by the API.
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True, index=True,
    )
    __table_args__ = (Index("uq_skills_user_name", user_id, func.lower(name), unique=True),)

    category: Mapped[str] = mapped_column(String(50), nullable=False, default="Other")
    proficiency: Mapped[str] = mapped_column(String(30), nullable=False, default="Beginner")
    years_experience: Mapped[float] = mapped_column(Integer, nullable=False, default=0)
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")

    resumes: Mapped[list["Resume"]] = relationship(
        secondary="resume_skills",
        back_populates="skills",
    )

    jobs: Mapped[list["Job"]] = relationship(
        secondary="job_skills",
        back_populates="skills",
    )
