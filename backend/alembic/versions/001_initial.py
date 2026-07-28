"""Initial migration — create all tables

Revision ID: 001_initial
"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ── innovation_box_submissions ──
    op.create_table(
        'innovation_box_submissions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('mobile', sa.String(20), nullable=True),
        sa.Column('department', sa.String(100), nullable=False),
        sa.Column('year', sa.String(20), nullable=False),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('idea_title', sa.String(500), nullable=False),
        sa.Column('idea_description', sa.Text(), nullable=False),
        sa.Column('expected_outcome', sa.Text(), nullable=True),
        sa.Column('attachment_name', sa.String(500), nullable=True),
        sa.Column('attachment_type', sa.String(100), nullable=True),
        sa.Column('attachment_url', sa.Text(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_innovation_email', 'innovation_box_submissions', ['email'])
    op.create_index('ix_innovation_department', 'innovation_box_submissions', ['department'])
    op.create_index('ix_innovation_category', 'innovation_box_submissions', ['category'])
    op.create_index('ix_innovation_dept_cat', 'innovation_box_submissions', ['department', 'category'])

    # ── upcoming_events ──
    op.create_table(
        'upcoming_events',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('event_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('event_time', sa.String(50), nullable=True),
        sa.Column('venue', sa.String(500), nullable=True),
        sa.Column('image_url', sa.Text(), nullable=True),
        sa.Column('registration_link', sa.Text(), nullable=True),
        sa.Column('status', sa.String(50), server_default='upcoming'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_events_event_date', 'upcoming_events', ['event_date'])
    op.create_index('ix_events_status', 'upcoming_events', ['status'])
    op.create_index('ix_events_date_status', 'upcoming_events', ['event_date', 'status'])

    # ── event_registrations ──
    op.create_table(
        'event_registrations',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('event_id', sa.Integer(), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('mobile', sa.String(20), nullable=True),
        sa.Column('department', sa.String(100), nullable=True),
        sa.Column('year', sa.String(20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['event_id'], ['upcoming_events.id'], ondelete='CASCADE')
    )
    op.create_index('ix_reg_event_id', 'event_registrations', ['event_id'])
    op.create_index('ix_reg_email', 'event_registrations', ['email'])
    op.create_index('ix_reg_department', 'event_registrations', ['department'])
    op.create_index('ix_reg_event_email', 'event_registrations', ['event_id', 'email'], unique=True)

    # ── contact_messages ──
    op.create_table(
        'contact_messages',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('subject', sa.String(500), nullable=True),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_contact_email', 'contact_messages', ['email'])

    # ── email_queue ──
    op.create_table(
        'email_queue',
        sa.Column('id', sa.String(64), nullable=False),
        sa.Column('subject', sa.Text(), nullable=False),
        sa.Column('html_body', sa.Text(), nullable=False),
        sa.Column('attachments', sa.Text(), server_default='[]'),
        sa.Column('status', sa.String(20), server_default='pending'),
        sa.Column('retry_count', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('last_attempt', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_email_queue_status', 'email_queue', ['status'])


def downgrade():
    op.drop_table('email_queue')
    op.drop_table('contact_messages')
    op.drop_table('event_registrations')
    op.drop_table('upcoming_events')
    op.drop_table('innovation_box_submissions')
