"""add completed status and staff roles

Revision ID: a1b2c3d4e5f6
Revises: c25021280265
Create Date: 2026-03-19 20:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'c25021280265'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add 'completed' to userstatus enum and 'staff' to userrole enum
    op.execute("ALTER TYPE userstatus ADD VALUE IF NOT EXISTS 'completed'")
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'staff'")

    # Create staffrole enum (skip if already exists)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE staffrole AS ENUM (
                'cleaner', 'secretary', 'manager', 'accountant',
                'it_support', 'receptionist', 'other'
            );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)

    # Create staff_profiles table (skip if already exists)
    op.execute("""
        CREATE TABLE IF NOT EXISTS staff_profiles (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            phone VARCHAR(20),
            staff_role staffrole NOT NULL DEFAULT 'other',
            department VARCHAR(100),
            notes VARCHAR(500),
            can_manage_jobs BOOLEAN DEFAULT FALSE,
            can_manage_schools BOOLEAN DEFAULT FALSE,
            can_manage_teachers BOOLEAN DEFAULT FALSE,
            can_view_reports BOOLEAN DEFAULT FALSE,
            can_manage_users BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_staff_profiles_user_id ON staff_profiles (user_id)")


def downgrade() -> None:
    op.drop_index(op.f('ix_staff_profiles_user_id'), table_name='staff_profiles')
    op.drop_table('staff_profiles')
