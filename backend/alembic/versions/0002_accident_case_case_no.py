from alembic import op
import sqlalchemy as sa


revision = "0002_accident_case_case_no"
down_revision = "0001_accident_case"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("accident_cases") as b:
        b.add_column(sa.Column("case_no", sa.String(length=50), nullable=True))
        b.add_column(sa.Column("unit_name", sa.String(length=256), nullable=True))
        b.add_column(sa.Column("occurred_year", sa.Integer(), nullable=True))
        b.create_index("idx_accident_cases_case_no", ["case_no"])
        b.create_index("idx_accident_cases_unit_name", ["unit_name"])
        b.create_index("idx_accident_cases_occurred_year", ["occurred_year"])
        b.create_unique_constraint("uq_accident_case_no_unit_year", ["unit_name", "occurred_year", "case_no"])


def downgrade() -> None:
    with op.batch_alter_table("accident_cases") as b:
        b.drop_constraint("uq_accident_case_no_unit_year", type_="unique")
        b.drop_index("idx_accident_cases_occurred_year")
        b.drop_index("idx_accident_cases_unit_name")
        b.drop_index("idx_accident_cases_case_no")
        b.drop_column("occurred_year")
        b.drop_column("unit_name")
        b.drop_column("case_no")

