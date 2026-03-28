import asyncio
import json
import random
import string
from dataclasses import dataclass
from typing import Any

import httpx


BASE_URL = "http://127.0.0.1:8001"


def _rand_text(n: int) -> str:
    alphabet = string.ascii_letters + string.digits + " 中文符号-_=+[]{}()<>!@#$%^&*'\"\\n\\t"
    return "".join(random.choice(alphabet) for _ in range(n))


def _case_content(i: int) -> dict[str, Any]:
    return {
        "summary": _rand_text(40),
        "directCause": _rand_text(60),
        "indirectCause": _rand_text(60),
        "responsibleUnit": f"责任单位-{i}",
        "province": random.choice(["北京市", "上海市", "广东省", "浙江省", "四川省", "湖北省", "河北省"]),
        "date": random.choice(["2025-01-02", "2024-12-31", "2025-02-29", "not-a-date"]),
        "loss": random.choice([0, 1, 999999999, -1]),
        "notes": _rand_text(random.choice([0, 10, 256, 2048])),
    }


async def main() -> None:
    async with httpx.AsyncClient(timeout=10.0) as client:
        created = 0
        for i in range(220):
            title = f"E2E-SEED-{i}-{_rand_text(10)}"
            if i % 20 == 0:
                title = "边界-超长-" + _rand_text(240)
            if i % 33 == 0:
                title = "特殊符号-\"'<>&-" + _rand_text(30)
            if len(title) > 256:
                title = title[:256]

            payload = {
                "title": title,
                "content": json.dumps(_case_content(i), ensure_ascii=False),
                "attachment_keys": [],
            }
            r = await client.post(f"{BASE_URL}/api/v1/accidents/", json=payload)
            if r.status_code not in (200, 201):
                raise RuntimeError(f"create failed: {r.status_code} {r.text}")
            created += 1

        print(f"seeded={created}")


if __name__ == "__main__":
    asyncio.run(main())

