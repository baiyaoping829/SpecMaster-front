import json
from datetime import datetime, timezone
from tempfile import NamedTemporaryFile
from uuid import uuid4

from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.exceptions import ApiError
from ..core.minio_client import delete_object, presign_get_url, upload_bytes
from . import cache
from .models import AccidentCase, AccidentSpecRef
from .schemas import AccidentCaseCreate, AccidentCaseList, AccidentCaseUpdate, AccidentCaseVO, ExternalImportReq
from pdfminer.high_level import extract_text


def _now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _parse_keys(raw: str) -> list[str]:
    try:
        arr = json.loads(raw or "[]")
        if isinstance(arr, list):
            return [str(x) for x in arr if str(x)]
        return []
    except Exception:
        return []


def _dump_keys(keys: list[str]) -> str:
    return json.dumps([str(x) for x in keys if str(x)], ensure_ascii=False)

def _safe_json_dict(raw: str) -> dict:
    try:
        obj = json.loads(raw or "{}")
        return obj if isinstance(obj, dict) else {}
    except Exception:
        return {}


def _derive_unit_year(content_raw: str) -> tuple[str | None, int | None]:
    obj = _safe_json_dict(content_raw)
    unit = obj.get("responsibleUnit") or obj.get("responsible_unit") or obj.get("unit") or obj.get("responsible")
    unit_s = str(unit).strip() if unit is not None else ""
    date_val = obj.get("accidentDate") or obj.get("date") or obj.get("occurred_at") or ""
    date_s = str(date_val).strip()
    year = int(date_s[:4]) if len(date_s) >= 4 and date_s[:4].isdigit() else None
    return (unit_s or None), year


def _extract_pdf_text_from_bytes(data: bytes) -> str:
    import os
    tmp = NamedTemporaryFile(suffix=".pdf", delete=False)
    try:
        tmp.write(data)
        tmp.flush()
        tmp.close()
        return extract_text(tmp.name) or ""
    finally:
        try:
            os.unlink(tmp.name)
        except Exception:
            pass


def _keywords(text: str) -> list[str]:
    import re
    from collections import Counter

    stop = {"事故", "调查", "报告", "有关", "情况", "工作", "进行", "组织", "责任", "处理", "落实", "企业", "单位", "人员"}
    tokens: list[str] = []
    tokens += re.findall(r"[\\u4e00-\\u9fff]{2,}", text)
    tokens += [w.lower() for w in re.findall(r"[A-Za-z]{4,}", text)]
    c = Counter([t for t in tokens if t not in stop])
    return [w for w, _ in c.most_common(20)]


class AccidentService:
    def __init__(self, *, session: AsyncSession, redis, minio_enabled: bool):
        self.session = session
        self.redis = redis
        self.minio_enabled = minio_enabled

    async def create_case(self, req: AccidentCaseCreate) -> AccidentCaseVO:
        now = _now()
        unit_name, occurred_year = _derive_unit_year(req.content)
        row = AccidentCase(
            id=uuid4().hex,
            case_no=req.case_no,
            title=req.title,
            content=req.content,
            attachment_keys=_dump_keys(req.attachment_keys),
            unit_name=unit_name,
            occurred_year=occurred_year,
            version=0,
            created_at=now,
            updated_at=now,
            deleted_at=None,
        )
        async with self.session.begin_nested():
            self.session.add(row)
            try:
                await self.session.flush()
            except IntegrityError:
                raise ApiError(409, "案例编号已存在，请更换")
        await cache.delete_by_prefix(self.redis, "accident:list:")
        return self._to_vo(row)

    async def get_case(self, case_id: str) -> AccidentCaseVO:
        key = cache.case_key(case_id)
        cached = await cache.get_json(self.redis, key)
        if cached:
            return AccidentCaseVO.model_validate(cached)

        stmt = select(AccidentCase).where(AccidentCase.id == case_id).where(AccidentCase.deleted_at.is_(None))
        res = await self.session.execute(stmt)
        row = res.scalar_one_or_none()
        if not row:
            raise ApiError(404, "not found")
        vo = self._to_vo(row)
        await cache.set_json(self.redis, key, vo.model_dump())
        return vo

    async def list_cases(self, *, page: int, size: int) -> AccidentCaseList:
        safe_page = max(1, int(page))
        safe_size = min(200, max(1, int(size)))
        key = cache.list_key(safe_page, safe_size)
        cached = await cache.get_json(self.redis, key)
        if cached:
            return AccidentCaseList.model_validate(cached)

        offset = (safe_page - 1) * safe_size
        stmt = (
            select(AccidentCase)
            .where(AccidentCase.deleted_at.is_(None))
            .order_by(AccidentCase.created_at.desc())
            .offset(offset)
            .limit(safe_size)
        )
        count_stmt = select(func.count(AccidentCase.id)).where(AccidentCase.deleted_at.is_(None))
        rows = (await self.session.execute(stmt)).scalars().all()
        total = int((await self.session.execute(count_stmt)).scalar_one())
        data = AccidentCaseList(
            items=[self._to_vo(r) for r in rows],
            total=total,
            page=safe_page,
            size=safe_size,
        )
        await cache.set_json(self.redis, key, data.model_dump())
        return data

    async def update_case(self, case_id: str, req: AccidentCaseUpdate) -> AccidentCaseVO:
        now = _now()
        patch = {}
        if req.case_no is not None:
            current = await self.get_case(case_id)
            if current.case_no and req.case_no != current.case_no:
                raise ApiError(400, "案例编号不可修改")
            if not current.case_no:
                patch["case_no"] = req.case_no
        if req.title is not None:
            patch["title"] = req.title
        if req.content is not None:
            patch["content"] = req.content
        if req.attachment_keys is not None:
            patch["attachment_keys"] = _dump_keys(req.attachment_keys)
        if not patch:
            return await self.get_case(case_id)

        content_for_derive = req.content if req.content is not None else (await self.get_case(case_id)).content
        unit_name, occurred_year = _derive_unit_year(content_for_derive)
        patch["unit_name"] = unit_name
        patch["occurred_year"] = occurred_year

        patch["updated_at"] = now
        patch["version"] = int(req.version) + 1

        async with self.session.begin_nested():
            stmt = (
                update(AccidentCase)
                .where(AccidentCase.id == case_id)
                .where(AccidentCase.deleted_at.is_(None))
                .where(AccidentCase.version == int(req.version))
                .values(**patch)
            )
            try:
                res = await self.session.execute(stmt)
            except IntegrityError:
                raise ApiError(409, "案例编号已存在，请更换")
            if res.rowcount != 1:
                raise ApiError(409, "version conflict")

        await cache.delete_key(self.redis, cache.case_key(case_id))
        await cache.delete_by_prefix(self.redis, "accident:list:")
        return await self.get_case(case_id)

    async def import_external(self, req: ExternalImportReq) -> dict:
        inserted: list[str] = []
        skipped_existing: list[str] = []
        errors: list[dict] = []
        for item in req.items:
            content_obj = {
                "summary": item.overview,
                "directCause": item.direct_cause,
                "indirectCause": item.indirect_cause,
                "lessons": item.rectification,
                "punishment": item.accountability,
                "responsibleUnit": req.unit_name,
                "accidentDate": (item.occurred_at or "")[:10],
                "external_source_url": item.source_url,
                "external_published_at": item.published_at,
                "external_location": item.location,
                "external_industry": item.industry,
                "external_level": item.level,
                "external_deaths": item.deaths,
                "external_injuries": item.injuries,
                "external_direct_economic_loss_cny": item.direct_economic_loss_cny,
            }
            try:
                vo = await self.create_case(
                    AccidentCaseCreate(
                        case_no=item.case_no,
                        title=item.title,
                        content=json.dumps(content_obj, ensure_ascii=False),
                        attachment_keys=[],
                    )
                )
                inserted.append(vo.case_no or vo.id)
            except ApiError as e:
                if int(e.code) == 409:
                    skipped_existing.append(item.case_no)
                else:
                    errors.append({"case_no": item.case_no, "error": str(e.msg or e.code)})
            except Exception as e:
                errors.append({"case_no": item.case_no, "error": str(e)})

        return {"inserted": inserted, "skipped_existing": skipped_existing, "errors": errors}

    async def delete_case(self, case_id: str) -> None:
        now = _now()
        row = None
        async with self.session.begin_nested():
            stmt = select(AccidentCase).where(AccidentCase.id == case_id).where(AccidentCase.deleted_at.is_(None))
            res = await self.session.execute(stmt)
            row = res.scalar_one_or_none()
            if not row:
                raise ApiError(404, "not found")
            await self.session.execute(update(AccidentCase).where(AccidentCase.id == case_id).values(deleted_at=now, updated_at=now, version=row.version + 1))
            await self.session.execute(update(AccidentSpecRef).where(AccidentSpecRef.accident_id == case_id).values(deleted_at=now))

        if row:
            keys = _parse_keys(row.attachment_keys)
            if self.minio_enabled and keys:
                for k in keys:
                    await delete_object(key=k)

        await cache.delete_key(self.redis, cache.case_key(case_id))
        await cache.delete_by_prefix(self.redis, "accident:list:")

    async def upload_attachments(self, *, case_id: str, files: list[tuple[str, bytes, str]]) -> list[str]:
        row = await self._get_row(case_id)
        if not self.minio_enabled:
            raise ApiError(400, "minio disabled")

        uploaded: list[str] = []
        now = _now()
        extracted_texts: list[str] = []
        for filename, data, mime_type in files:
            safe_name = (filename or "file").replace("\\", "_").replace("/", "_")
            key = f"accident/{case_id}/{uuid4().hex}_{safe_name}"
            await upload_bytes(key=key, data=data, mime_type=mime_type or "application/octet-stream")
            uploaded.append(key)
            if (mime_type or "").lower() == "application/pdf":
                try:
                    txt = _extract_pdf_text_from_bytes(data)
                    if txt:
                        extracted_texts.append(txt[:200000])
                except Exception:
                    pass

        merged = list(dict.fromkeys(_parse_keys(row.attachment_keys) + uploaded))
        content_obj = _safe_json_dict(row.content)
        if extracted_texts:
            joined = "\n".join(extracted_texts)
            content_obj["report_text"] = joined[:200000]
            content_obj["report_keywords"] = _keywords(joined)
        async with self.session.begin_nested():
            await self.session.execute(
                update(AccidentCase)
                .where(AccidentCase.id == case_id)
                .where(AccidentCase.deleted_at.is_(None))
                .values(
                    attachment_keys=_dump_keys(merged),
                    content=json.dumps(content_obj, ensure_ascii=False),
                    updated_at=now,
                    version=row.version + 1,
                )
            )

        await cache.delete_key(self.redis, cache.case_key(case_id))
        await cache.delete_by_prefix(self.redis, "accident:list:")
        return uploaded

    async def delete_attachment(self, *, case_id: str, key: str) -> None:
        row = await self._get_row(case_id)
        keys = [k for k in _parse_keys(row.attachment_keys) if k != key]
        now = _now()
        async with self.session.begin_nested():
            await self.session.execute(
                update(AccidentCase)
                .where(AccidentCase.id == case_id)
                .where(AccidentCase.deleted_at.is_(None))
                .values(attachment_keys=_dump_keys(keys), updated_at=now, version=row.version + 1)
            )

        if self.minio_enabled:
            await delete_object(key=key)

        await cache.delete_key(self.redis, cache.case_key(case_id))
        await cache.delete_by_prefix(self.redis, "accident:list:")

    async def presign_attachment(self, *, case_id: str, key: str) -> str:
        row = await self._get_row(case_id)
        if key not in _parse_keys(row.attachment_keys):
            raise ApiError(404, "not found")
        return await presign_get_url(key=key)

    async def _get_row(self, case_id: str) -> AccidentCase:
        stmt = select(AccidentCase).where(AccidentCase.id == case_id).where(AccidentCase.deleted_at.is_(None))
        res = await self.session.execute(stmt)
        row = res.scalar_one_or_none()
        if not row:
            raise ApiError(404, "not found")
        return row

    async def link_spec(self, *, case_id: str, spec_id: str) -> None:
        now = _now()
        async with self.session.begin_nested():
            exists_stmt = select(AccidentCase.id).where(AccidentCase.id == case_id).where(AccidentCase.deleted_at.is_(None))
            if (await self.session.execute(exists_stmt)).scalar_one_or_none() is None:
                raise ApiError(404, "not found")

            ref = AccidentSpecRef(id=uuid4().hex, accident_id=case_id, spec_id=spec_id, created_at=now, deleted_at=None)
            self.session.add(ref)
            try:
                await self.session.flush()
            except IntegrityError:
                raise ApiError(400, "invalid spec_id")

    async def unlink_spec(self, *, case_id: str, spec_id: str) -> None:
        now = _now()
        async with self.session.begin_nested():
            stmt = (
                update(AccidentSpecRef)
                .where(AccidentSpecRef.accident_id == case_id)
                .where(AccidentSpecRef.spec_id == spec_id)
                .where(AccidentSpecRef.deleted_at.is_(None))
                .values(deleted_at=now)
            )
            await self.session.execute(stmt)

    def _to_vo(self, row: AccidentCase) -> AccidentCaseVO:
        return AccidentCaseVO(
            id=row.id,
            case_no=row.case_no,
            title=row.title,
            content=row.content,
            attachment_keys=_parse_keys(row.attachment_keys),
            unit_name=row.unit_name,
            occurred_year=row.occurred_year,
            version=int(row.version),
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

