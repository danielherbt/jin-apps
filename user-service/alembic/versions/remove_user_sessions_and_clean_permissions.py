"""Remove unused user_sessions table and clean admin permissions

Revision ID: remove_sessions
Revises: 224cbf7f605c
Create Date: 2025-10-26 03:42:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'remove_sessions'
down_revision: Union[str, Sequence[str], None] = '224cbf7f605c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: Remove user_sessions table and clean redundant admin permissions."""

    # Remove user_sessions table and its indexes
    op.drop_index('ix_user_sessions_session_token', table_name='user_sessions')
    op.drop_index('ix_user_sessions_refresh_token', table_name='user_sessions')
    op.drop_index('ix_user_sessions_id', table_name='user_sessions')
    op.drop_table('user_sessions')

    # Remove redundant user_permissions for admin user (user_id = 1)
    # Admin role already has all permissions, so specific grants are redundant
    op.execute("""
        DELETE FROM user_permissions
        WHERE user_id = 1
    """)


def downgrade() -> None:
    """Downgrade schema: Recreate user_sessions table and restore admin permissions."""

    # Recreate user_sessions table
    op.create_table('user_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('session_token', sa.String(length=255), nullable=False),
        sa.Column('refresh_token', sa.String(length=255), nullable=False),
        sa.Column('device_id', sa.String(length=255), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_activity', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('is_revoked', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Recreate indexes for user_sessions
    op.create_index('ix_user_sessions_id', 'user_sessions', ['id'], unique=False)
    op.create_index('ix_user_sessions_refresh_token', 'user_sessions', ['refresh_token'], unique=True)
    op.create_index('ix_user_sessions_session_token', 'user_sessions', ['session_token'], unique=True)

    # Note: Admin permissions cannot be automatically restored as we don't know
    # which specific permissions were granted. They would need to be manually
    # recreated if needed.