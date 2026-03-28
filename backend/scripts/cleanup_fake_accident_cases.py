import argparse
import asyncio
import sys
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import or_, select, update

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.db import SessionLocal
from app.accident_case.models import AccidentCase


def _now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


async def _run(*, apply: bool) -> None:
    patterns = ["E2E-%", "边界-%", "特殊符号-%"]
    async with SessionLocal() as session:
        stmt = (
            select(AccidentCase.id, AccidentCase.title, AccidentCase.case_no)
            .where(AccidentCase.deleted_at.is_(None))
            .where(or_(*[AccidentCase.title.like(p) for p in patterns]))
            .order_by(AccidentCase.created_at.desc())
        )
        rows = (await session.execute(stmt)).all()
        print(f"matched={len(rows)} apply={apply}")
        for r in rows[:20]:
            print({"id": r.id, "case_no": r.case_no, "title": r.title})

        if not apply or not rows:
            return

        now = _now()
        ids = [r.id for r in rows]
        async with session.begin_nested():
            await session.execute(
                update(AccidentCase)
                .where(AccidentCase.id.in_(ids))
                .values(deleted_at=now, updated_at=now, version=AccidentCase.version + 1)
            )
        await session.commit()
        print(f"deleted={len(ids)}")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--apply", action="store_true")
    args = p.parse_args()
    asyncio.run(_run(apply=bool(args.apply)))


if __name__ == "__main__":
    main()
