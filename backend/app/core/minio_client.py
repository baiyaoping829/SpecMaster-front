import asyncio
from dataclasses import dataclass
from datetime import timedelta
from typing import Any

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from .config import settings


@dataclass(frozen=True)
class UploadedObject:
    bucket: str
    key: str
    size_bytes: int
    mime_type: str


def _client():
    endpoint = settings.minio_endpoint
    if not endpoint:
        return None
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=settings.minio_access_key,
        aws_secret_access_key=settings.minio_secret_key,
        region_name=settings.minio_region,
        use_ssl=settings.minio_secure,
        config=Config(signature_version="s3v4"),
    )


async def ensure_bucket() -> None:
    if not settings.minio_enabled:
        return
    s3 = _client()
    if not s3:
        return

    def _ensure() -> None:
        try:
            s3.head_bucket(Bucket=settings.minio_bucket)
        except ClientError:
            s3.create_bucket(Bucket=settings.minio_bucket)

    await asyncio.to_thread(_ensure)


async def upload_bytes(*, key: str, data: bytes, mime_type: str) -> UploadedObject:
    if not settings.minio_enabled:
        raise RuntimeError("minio disabled")
    s3 = _client()
    if not s3:
        raise RuntimeError("minio disabled")

    def _put() -> None:
        s3.put_object(Bucket=settings.minio_bucket, Key=key, Body=data, ContentType=mime_type)

    await asyncio.to_thread(_put)
    return UploadedObject(bucket=settings.minio_bucket, key=key, size_bytes=len(data), mime_type=mime_type)


async def upload_fileobj(*, key: str, fileobj, mime_type: str, size_bytes: int | None = None) -> UploadedObject:
    if not settings.minio_enabled:
        raise RuntimeError("minio disabled")
    s3 = _client()
    if not s3:
        raise RuntimeError("minio disabled")

    def _upload() -> None:
        extra = {"ContentType": mime_type} if mime_type else None
        if extra:
            s3.upload_fileobj(fileobj, settings.minio_bucket, key, ExtraArgs=extra)
        else:
            s3.upload_fileobj(fileobj, settings.minio_bucket, key)

    await asyncio.to_thread(_upload)
    return UploadedObject(bucket=settings.minio_bucket, key=key, size_bytes=int(size_bytes or 0), mime_type=mime_type)


async def delete_object(*, key: str) -> None:
    if not settings.minio_enabled:
        return
    s3 = _client()
    if not s3:
        return

    def _del() -> None:
        s3.delete_object(Bucket=settings.minio_bucket, Key=key)

    await asyncio.to_thread(_del)


async def presign_get_url(*, key: str) -> str:
    if not settings.minio_enabled:
        raise RuntimeError("minio disabled")
    s3 = _client()
    if not s3:
        raise RuntimeError("minio disabled")

    def _sign() -> str:
        return s3.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": settings.minio_bucket, "Key": key},
            ExpiresIn=settings.minio_presign_expires_seconds,
        )

    return await asyncio.to_thread(_sign)

