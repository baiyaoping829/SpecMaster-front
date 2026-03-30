from alembic import op
import sqlalchemy as sa


revision = "0009_task_progress_and_trace"
down_revision = "0008_experience_strategies"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("accident_crawl_tasks") as b:
        b.add_column(sa.Column("stage", sa.String(length=64), nullable=False, server_default=""))
        b.add_column(sa.Column("progress_current", sa.Integer(), nullable=False, server_default="0"))
        b.add_column(sa.Column("progress_total", sa.Integer(), nullable=False, server_default="0"))
        b.add_column(sa.Column("trace_id", sa.String(length=64), nullable=False, server_default=""))
        b.create_index("idx_accident_crawl_tasks_trace_id", ["trace_id"])


def downgrade() -> None:
    with op.batch_alter_table("accident_crawl_tasks") as b:
        b.drop_index("idx_accident_crawl_tasks_trace_id")
        b.drop_column("trace_id")
        b.drop_column("progress_total")
        b.drop_column("progress_current")
        b.drop_column("stage")

