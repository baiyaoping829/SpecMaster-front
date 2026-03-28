from collections.abc import AsyncGenerator

from redis.asyncio import Redis

from .config import settings


_redis: Redis | None = None


def get_redis() -> Redis | None:
    global _redis
    if not settings.redis_enabled:
        return None
    if _redis is None:
        _redis = Redis.from_url(settings.redis_url, decode_responses=True)
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None


async def redis_dep() -> AsyncGenerator[Redis | None, None]:
    yield get_redis()

