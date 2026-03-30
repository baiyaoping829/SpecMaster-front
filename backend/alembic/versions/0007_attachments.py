from alembic import op
import sqlalchemy as sa


revision = "0007_attachments"
down_revision = "0006_regex_batches_and_task_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "attachments",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("batch_id", sa.String(length=64), nullable=False),
        sa.Column("original_url", sa.String(length=2048), nullable=False),
        sa.Column("local_path", sa.String(length=512), nullable=False),
        sa.Column("sha256", sa.String(length=64), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("corrupted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.String(length=32), nullable=False),
        sa.UniqueConstraint("sha256", name="uq_attachments_sha256"),
    )
    op.create_index("idx_attachments_batch_id", "attachments", ["batch_id"])
    op.create_index("idx_attachments_sha256", "attachments", ["sha256"])

    op.create_table(
        "report_attachments",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("report_id", sa.String(length=64), sa.ForeignKey("accident_crawled_reports.id", ondelete="CASCADE"), nullable=False),
        sa.Column("attachment_id", sa.String(length=64), sa.ForeignKey("attachments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.String(length=32), nullable=False),
        sa.UniqueConstraint("report_id", "attachment_id", name="uq_report_attachment"),
    )
    op.create_index("idx_report_attachments_report_id", "report_attachments", ["report_id"])
    op.create_index("idx_report_attachments_attachment_id", "report_attachments", ["attachment_id"])


def downgrade() -> None:
    op.drop_index("idx_report_attachments_attachment_id", table_name="report_attachments")
    op.drop_index("idx_report_attachments_report_id", table_name="report_attachments")
    op.drop_table("report_attachments")

    op.drop_index("idx_attachments_sha256", table_name="attachments")
    op.drop_index("idx_attachments_batch_id", table_name="attachments")
    op.drop_table("attachments")

