"""upgrade task model fields

Revision ID: a1b2c3d4e5f6
Revises: 87d42cd26d68
Create Date: 2026-09-03 19:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '87d42cd26d68'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add new columns with safe server defaults
    op.add_column('user_tasks', sa.Column('status', sa.String(length=50), nullable=False, server_default='TODO'))
    op.add_column('user_tasks', sa.Column('priority', sa.String(length=50), nullable=False, server_default='MEDIUM'))
    op.add_column('user_tasks', sa.Column('due_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('user_tasks', sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False))
    op.add_column('user_tasks', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False))

    # Safely migrate existing data: sync status with is_completed
    op.execute("UPDATE user_tasks SET status = 'COMPLETED' WHERE is_completed = true")
    op.execute("UPDATE user_tasks SET status = 'TODO' WHERE is_completed = false OR is_completed IS NULL")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('user_tasks', 'updated_at')
    op.drop_column('user_tasks', 'created_at')
    op.drop_column('user_tasks', 'due_date')
    op.drop_column('user_tasks', 'priority')
    op.drop_column('user_tasks', 'status')
