from alembic import op
import sqlalchemy as sa


revision = "0003_accident_crawler"
down_revision = "0002_accident_case_case_no"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "accident_crawl_tasks",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("keyword", sa.String(length=256), nullable=False),
        sa.Column("target_url", sa.String(length=2048), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("max_items", sa.Integer(), nullable=False, server_default="20"),
        sa.Column("max_depth", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("success_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("fail_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_error", sa.String(length=512), nullable=True),
        sa.Column("log_path", sa.String(length=512), nullable=True),
        sa.Column("started_at", sa.String(length=32), nullable=True),
        sa.Column("finished_at", sa.String(length=32), nullable=True),
        sa.Column("created_at", sa.String(length=32), nullable=False),
        sa.Column("updated_at", sa.String(length=32), nullable=False),
        sa.Column("deleted_at", sa.String(length=32), nullable=True),
    )

    op.create_table(
        "accident_crawled_reports",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("task_id", sa.String(length=64), sa.ForeignKey("accident_crawl_tasks.id", ondelete="SET NULL"), nullable=True),
        sa.Column("fingerprint", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=256), nullable=False),
        sa.Column("occurred_at", sa.String(length=32), nullable=False, server_default=""),
        sa.Column("location", sa.String(length=256), nullable=False, server_default=""),
        sa.Column("accident_type", sa.String(length=64), nullable=False, server_default=""),
        sa.Column("casualties", sa.String(length=128), nullable=False, server_default=""),
        sa.Column("cause_overview", sa.Text(), nullable=False, server_default=""),
        sa.Column("responsible_party", sa.String(length=256), nullable=False, server_default=""),
        sa.Column("overview", sa.Text(), nullable=False, server_default=""),
        sa.Column("report_url", sa.String(length=2048), nullable=False, server_default=""),
        sa.Column("source_url", sa.String(length=2048), nullable=False, server_default=""),
        sa.Column("published_at", sa.String(length=32), nullable=False, server_default=""),
        sa.Column("raw_path", sa.String(length=512), nullable=True),
        sa.Column("raw_mime", sa.String(length=128), nullable=True),
        sa.Column("parsed_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.String(length=32), nullable=False),
        sa.Column("updated_at", sa.String(length=32), nullable=False),
        sa.Column("deleted_at", sa.String(length=32), nullable=True),
        sa.UniqueConstraint("fingerprint", name="uq_accident_crawled_reports_fingerprint"),
    )

    op.create_index("idx_accident_crawled_reports_task_id", "accident_crawled_reports", ["task_id"])
    op.create_index("idx_accident_crawled_reports_fingerprint", "accident_crawled_reports", ["fingerprint"])


def downgrade() -> None:
    op.drop_index("idx_accident_crawled_reports_fingerprint", table_name="accident_crawled_reports")
    op.drop_index("idx_accident_crawled_reports_task_id", table_name="accident_crawled_reports")
    op.drop_table("accident_crawled_reports")
    op.drop_table("accident_crawl_tasks")

