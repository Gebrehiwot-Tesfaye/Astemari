"""add system to notificationtype enum

Revision ID: e5f6a7b8c9d0
Revises: d3e4f5a6b7c8
Create Date: 2026-03-22 12:00:00.000000

"""
from alembic import op

revision = 'e5f6a7b8c9d0'
down_revision = 'd3e4f5a6b7c8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'system'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values
    pass
