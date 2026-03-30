from alembic import op
import sqlalchemy as sa


revision = "0008_experience_strategies"
down_revision = "0007_attachments"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "experience_strategies",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("domain", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("description", sa.String(length=512), nullable=False, server_default=""),
        sa.Column("strategy_json", sa.Text(), nullable=False),
        sa.Column("fingerprint", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.String(length=32), nullable=False),
        sa.Column("updated_at", sa.String(length=32), nullable=False),
        sa.Column("deleted_at", sa.String(length=32), nullable=True),
    )
    op.create_index("idx_experience_strategies_user_id", "experience_strategies", ["user_id"])
    op.create_index("idx_experience_strategies_domain", "experience_strategies", ["domain"])
    op.create_index("idx_experience_strategies_fp", "experience_strategies", ["fingerprint"])


def downgrade() -> None:
    op.drop_index("idx_experience_strategies_fp", table_name="experience_strategies")
    op.drop_index("idx_experience_strategies_domain", table_name="experience_strategies")
    op.drop_index("idx_experience_strategies_user_id", table_name="experience_strategies")
    op.drop_table("experience_strategies")

