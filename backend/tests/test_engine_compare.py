import httpx
import pytest

from app.accident_crawler.engine_router import compare
from app.accident_crawler.engine_schemas import EngineCompareRequest
from app.accident_crawler.engines import HttpxBs4Engine


@pytest.mark.asyncio
async def test_engine_compare_returns_items(monkeypatch):
    url = "https://site.test/"
    html = "<html><head><title>Hello</title></head><body>ok</body></html>"

    def handler(request: httpx.Request) -> httpx.Response:
        if str(request.url) == url:
            return httpx.Response(200, text=html, headers={"content-type": "text/html"})
        return httpx.Response(404)

    def fake_get_engine(name: str):
        return HttpxBs4Engine(transport=httpx.MockTransport(handler))

    monkeypatch.setattr("app.accident_crawler.engine_router.get_engine", fake_get_engine)

    res = await compare(EngineCompareRequest(url=url, engines=["httpx_bs4", "requests_bs4"]), format="")
    data = res.data or {}
    assert data["url"] == url
    assert any((it.get("title") == "Hello") for it in data.get("items", []))
