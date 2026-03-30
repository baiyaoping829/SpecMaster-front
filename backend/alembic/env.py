import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.core.config import Settings
from app.core.models import Base
from app.accident_case import models as accident_models
from app.accident_crawler import models as crawler_models
from app.accident_crawler import favorite_models as favorite_models
from app.accident_crawler import regex_models as regex_models
from app.accident_crawler import attachment_models as attachment_models
from app.accident_crawler import strategy_models as strategy_models


config = context.config
target_metadata = Base.metadata
_ = accident_models
_ = crawler_models
_ = favorite_models
_ = regex_models
_ = attachment_models
_ = strategy_models


def _sqlalchemy_url() -> str:
    s = Settings()
    url = s.sqlalchemy_url
    if url.startswith("sqlite+aiosqlite:///"):
        return url.replace("sqlite+aiosqlite:///", "sqlite:///")
    if url.startswith("mysql+aiomysql://"):
        return url.replace("mysql+aiomysql://", "mysql+pymysql://")
    return url


def run_migrations_offline() -> None:
    url = _sqlalchemy_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=url.startswith("sqlite:///"),
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = _sqlalchemy_url()
    connectable = engine_from_config(configuration, prefix="sqlalchemy.", poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=configuration["sqlalchemy.url"].startswith("sqlite:///"),
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

