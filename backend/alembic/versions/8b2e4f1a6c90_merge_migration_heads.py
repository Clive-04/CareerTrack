"""merge migration heads

Revision ID: 8b2e4f1a6c90
Revises: 6c255c93e7fc, 7a1d3f0c2b11
"""
from typing import Sequence, Union


revision: str = "8b2e4f1a6c90"
down_revision: Union[str, Sequence[str], None] = (
    "6c255c93e7fc",
    "7a1d3f0c2b11",
)
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
