from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from .responses import fail


class ApiError(Exception):
    def __init__(self, code: int, msg: str):
        self.code = code
        self.msg = msg


async def http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=fail(exc.status_code, str(exc.detail)).model_dump())


async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=422, content=fail(422, "validation error").model_dump())


async def api_error_handler(_: Request, exc: ApiError) -> JSONResponse:
    status = exc.code if 400 <= exc.code <= 599 else 400
    return JSONResponse(status_code=status, content=fail(exc.code, exc.msg).model_dump())


async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=500, content=fail(500, "internal error").model_dump())

