from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    mysql_url: str | None = None
    sqlite_path: str = "server/dev.sqlite"
    redis_url: str | None = None

    minio_endpoint: str | None = None
    minio_access_key: str | None = None
    minio_secret_key: str | None = None
    minio_region: str = "us-east-1"
    minio_secure: bool = False
    minio_bucket: str = "accident-attachment"
    minio_presign_expires_seconds: int = 300

    api_prefix: str = "/api/v1"
    attachments_dir: str = "/data/attachments"
    attachment_low_disk_pct: int = 10

    @property
    def sqlalchemy_url(self) -> str:
        if self.mysql_url:
            return self.mysql_url
        return f"sqlite+aiosqlite:///{self.sqlite_path}"

    @property
    def redis_enabled(self) -> bool:
        return bool(self.redis_url)

    @property
    def minio_enabled(self) -> bool:
        return bool(self.minio_endpoint and self.minio_access_key and self.minio_secret_key)


settings = Settings()

