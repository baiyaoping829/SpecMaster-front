import json
from typing import Any

from redis.asyncio import Redis


DEFAULT_TTL_SECONDS = 300


def case_key(case_id: str) -> str:
    return f"accident:case:{case_id}"


def list_key(page: int, size: int) -> str:
    return f"accident:list:{page}:{size}"


async def get_json(redis: Redis | None, key: str) -> Any | None:
    if not redis:
        return None
    raw = await redis.get(key)
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception:
        return None


async def set_json(redis: Redis | None, key: str, value: Any, ttl_seconds: int = DEFAULT_TTL_SECONDS) -> None:
    if not redis:
        return
    await redis.set(key, json.dumps(value, ensure_ascii=False), ex=ttl_seconds)


async def delete_key(redis: Redis | None, key: str) -> None:
    if not redis:
        return
    await redis.delete(key)


async def delete_by_prefix(redis: Redis | None, prefix: str) -> None:
    if not redis:
        return
    cursor = 0
    pattern = f"{prefix}*"
    while True:
        cursor, keys = await redis.scan(cursor=cursor, match=pattern, count=200)
        if keys:
            await redis.delete(*keys)
        if cursor == 0:
            break

