import csv
import io

from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

from ..core.responses import ok
from .engine_schemas import EngineCompareRequest
from .engines import get_engine


router = APIRouter(prefix="/api/engine", tags=["engine"])


@router.post("/compare", response_model=None)
async def compare(payload: EngineCompareRequest, format: str = ""):
    items = []
    for name in payload.engines:
        try:
            engine = get_engine(name)
            title, res = await engine.fetch_title(payload.url)
            items.append(
                {
                    "engine": name,
                    "ok": True,
                    "status_code": res.status_code,
                    "elapsed_ms": res.elapsed_ms,
                    "title": title,
                    "error": None,
                }
            )
        except Exception as e:
            items.append({"engine": name, "ok": False, "status_code": 0, "elapsed_ms": 0.0, "title": "", "error": str(e)})

    if (format or "").lower() == "csv":
        buf = io.StringIO()
        w = csv.DictWriter(buf, fieldnames=["engine", "ok", "status_code", "elapsed_ms", "title", "error"])
        w.writeheader()
        for it in items:
            w.writerow(it)
        return PlainTextResponse(content=buf.getvalue(), media_type="text/csv; charset=utf-8")

    return ok({"url": payload.url, "items": items})

