"""add_approved_count_and_reg_dates

Revision ID: 001_add_approved_count_reg_dates
Revises: 
Create Date: 2026-08-07

"""
from alembic import op
import sqlalchemy as sa

revision = '001_add_approved_count_reg_dates'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add approved_count column
    op.add_column('events', sa.Column('approved_count', sa.Integer(), nullable=False, server_default='0'))
    # Add registration_start_date column
    op.add_column('events', sa.Column('registration_start_date', sa.String(length=100), nullable=True))
    # Add registration_end_date column
    op.add_column('events', sa.Column('registration_end_date', sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column('events', 'registration_end_date')
    op.drop_column('events', 'registration_start_date')
    op.drop_column('events', 'approved_count')
