from alembic import op
import sqlalchemy as sa


revision = "0006_regex_batches_and_task_fields"
down_revision = "0005_favorite_sites"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("accident_crawl_tasks") as b:
        b.add_column(sa.Column("batch_id", sa.String(length=64), nullable=False, server_default=""))
        b.add_column(sa.Column("batch_seq", sa.Integer(), nullable=False, server_default="0"))
        b.add_column(sa.Column("engine", sa.String(length=32), nullable=False, server_default="httpx_bs4"))
        b.add_column(sa.Column("engine_params", sa.Text(), nullable=False, server_default="{}"))
        b.add_column(sa.Column("concurrency", sa.Integer(), nullable=False, server_default="10"))
        b.add_column(sa.Column("strategy_used", sa.Text(), nullable=False, server_default="{}"))
        b.add_column(sa.Column("strategy_fingerprint", sa.String(length=64), nullable=False, server_default=""))
        b.create_index("idx_accident_crawl_tasks_batch_id", ["batch_id"])
        b.create_index("idx_accident_crawl_tasks_strategy_fp", ["strategy_fingerprint"])

    op.create_table(
        "regex_batches",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("seed_url", sa.String(length=2048), nullable=False),
        sa.Column("regex", sa.String(length=512), nullable=False),
        sa.Column("max_urls", sa.Integer(), nullable=False, server_default="1000"),
        sa.Column("created_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="created"),
        sa.Column("created_at", sa.String(length=32), nullable=False),
        sa.Column("updated_at", sa.String(length=32), nullable=False),
        sa.Column("deleted_at", sa.String(length=32), nullable=True),
    )
    op.create_index("idx_regex_batches_user_id", "regex_batches", ["user_id"])


def downgrade() -> None:
    op.drop_index("idx_regex_batches_user_id", table_name="regex_batches")
    op.drop_table("regex_batches")

    with op.batch_alter_table("accident_crawl_tasks") as b:
        b.drop_index("idx_accident_crawl_tasks_strategy_fp")
        b.drop_index("idx_accident_crawl_tasks_batch_id")
        b.drop_column("strategy_fingerprint")
        b.drop_column("strategy_used")
        b.drop_column("concurrency")
        b.drop_column("engine_params")
        b.drop_column("engine")
        b.drop_column("batch_seq")
        b.drop_column("batch_id")

