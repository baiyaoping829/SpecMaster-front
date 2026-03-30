from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .accident_case.router import router as accident_router
from .accident_case.legacy_router import router as accident_legacy_router
from .accident_crawler.router import router as crawler_router
from .accident_crawler.favorite_router import router as favorite_router
from .accident_crawler.regex_router import router as regex_router
from .accident_crawler.engine_router import router as engine_router
from .accident_crawler.strategy_router import router as strategy_router
from .accident_crawler.progress_router import router as progress_router
from .core.config import settings
from .core.exceptions import ApiError, api_error_handler, http_exception_handler, unhandled_exception_handler, validation_exception_handler
from .core.minio_client import ensure_bucket
from .core.redis_client import close_redis
from .core.responses import ok


def create_app() -> FastAPI:
    app = FastAPI(title="specmaster accident api", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_exception_handler(ApiError, api_error_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    from starlette.exceptions import HTTPException as StarletteHTTPException
    from fastapi.exceptions import RequestValidationError

    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)

    @app.on_event("startup")
    async def _startup():
        await ensure_bucket()

    @app.on_event("shutdown")
    async def _shutdown():
        await close_redis()

    @app.get(f"{settings.api_prefix}/health")
    async def health():
        return JSONResponse(ok({"ok": True}).model_dump())

    app.include_router(accident_router)
    app.include_router(accident_legacy_router)
    app.include_router(crawler_router)
    app.include_router(favorite_router)
    app.include_router(regex_router)
    app.include_router(engine_router)
    app.include_router(strategy_router)
    app.include_router(progress_router)
    return app


app = create_app()

