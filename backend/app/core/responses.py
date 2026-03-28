from pydantic import BaseModel


class ApiResponse(BaseModel):
    code: int
    msg: str
    data: object | None = None


def ok(data: object | None = None) -> ApiResponse:
    return ApiResponse(code=200, msg="ok", data=data)


def created(data: object | None = None) -> ApiResponse:
    return ApiResponse(code=201, msg="ok", data=data)


def fail(code: int, msg: str) -> ApiResponse:
    return ApiResponse(code=code, msg=msg, data=None)

