from alembic import op
import sqlalchemy as sa


revision = "0005_favorite_sites"
down_revision = "0004_accident_crawler_report_no"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "favorite_sites",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("site_url", sa.String(length=2048), nullable=False),
        sa.Column("site_name", sa.String(length=256), nullable=False, server_default=""),
        sa.Column("tags", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("created_at", sa.String(length=32), nullable=False),
        sa.Column("updated_at", sa.String(length=32), nullable=False),
        sa.Column("deleted_at", sa.String(length=32), nullable=True),
        sa.UniqueConstraint("user_id", "site_url", name="uq_favorite_sites_user_url"),
    )
    op.create_index("idx_favorite_sites_user_id", "favorite_sites", ["user_id"])


def downgrade() -> None:
    op.drop_index("idx_favorite_sites_user_id", table_name="favorite_sites")
    op.drop_table("favorite_sites")

