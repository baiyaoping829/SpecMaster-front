from alembic import op
import sqlalchemy as sa


revision = "0004_accident_crawler_report_no"
down_revision = "0003_accident_crawler"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("accident_crawled_reports") as b:
        b.add_column(sa.Column("report_no", sa.String(length=128), nullable=False, server_default=""))
        b.create_index("idx_accident_crawled_reports_report_no", ["report_no"])


def downgrade() -> None:
    with op.batch_alter_table("accident_crawled_reports") as b:
        b.drop_index("idx_accident_crawled_reports_report_no")
        b.drop_column("report_no")

