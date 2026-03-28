from alembic import op
import sqlalchemy as sa


revision = "0001_accident_case"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "accident_cases",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("title", sa.String(length=256), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("attachment_keys", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("version", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.String(length=32), nullable=False),
        sa.Column("updated_at", sa.String(length=32), nullable=False),
        sa.Column("deleted_at", sa.String(length=32), nullable=True),
    )
    op.create_index("idx_accident_cases_created_at", "accident_cases", ["created_at"])
    op.create_index("idx_accident_cases_deleted_at", "accident_cases", ["deleted_at"])

    op.create_table(
        "accident_spec_refs",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("accident_id", sa.String(length=64), nullable=False),
        sa.Column("spec_id", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.String(length=32), nullable=False),
        sa.Column("deleted_at", sa.String(length=32), nullable=True),
        sa.ForeignKeyConstraint(["accident_id"], ["accident_cases.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["spec_id"], ["specs.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_accident_spec_refs_accident_id", "accident_spec_refs", ["accident_id"])
    op.create_index("idx_accident_spec_refs_spec_id", "accident_spec_refs", ["spec_id"])
    op.create_index("idx_accident_spec_refs_deleted_at", "accident_spec_refs", ["deleted_at"])


def downgrade() -> None:
    op.drop_index("idx_accident_spec_refs_deleted_at", table_name="accident_spec_refs")
    op.drop_index("idx_accident_spec_refs_spec_id", table_name="accident_spec_refs")
    op.drop_index("idx_accident_spec_refs_accident_id", table_name="accident_spec_refs")
    op.drop_table("accident_spec_refs")

    op.drop_index("idx_accident_cases_deleted_at", table_name="accident_cases")
    op.drop_index("idx_accident_cases_created_at", table_name="accident_cases")
    op.drop_table("accident_cases")

