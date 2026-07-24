from __future__ import annotations

from dataclasses import dataclass

from .catalog.materials import MATERIAL_CATALOG, MaterialDefinition
from .catalog.payloads import PAYLOAD_CATALOG, normalize_payload
from .config import Settings
from .models import Lead, Material
from .storage import VcStorage


@dataclass(frozen=True)
class ResolvedMaterial:
    material_key: str | None
    title: str
    body: str | None
    url: str | None
    telegram_file_id: str | None = None
    telegram_file_type: str | None = None
    telegram_file_name: str | None = None
    telegram_caption: str | None = None
    status: str = "missing"
    source: str = "missing"

    @property
    def has_content(self) -> bool:
        return bool(self.body or self.url or self.telegram_file_id)


def _env_url(settings: Settings, name: str | None) -> str | None:
    return {
        "VC_MATERIALS_URL": settings.materials_url,
        "VC_YOUTUBE_MATERIALS_URL": settings.youtube_materials_url,
        "VC_TELEGRAM_MATERIALS_URL": settings.telegram_materials_url,
    }.get(name or "")


def _env_title(settings: Settings, name: str | None, fallback: str) -> str:
    return settings.materials_title if name == "VC_MATERIALS_TITLE" and settings.materials_title else fallback


def _from_definition(definition: MaterialDefinition, settings: Settings) -> ResolvedMaterial:
    title = _env_title(settings, definition.env_title_name, definition.title)
    url = definition.url or _env_url(settings, definition.env_url_name)
    return ResolvedMaterial(
        material_key=definition.material_key,
        title=title,
        body=definition.body,
        url=url,
        status="env fallback" if url else "configured" if definition.body else "missing",
        source="catalog",
    )


def _from_row(material: Material, title_override: str | None = None) -> ResolvedMaterial:
    return ResolvedMaterial(
        material_key=material.material_key,
        title=title_override or material.title,
        body=material.body,
        url=material.url,
        telegram_file_id=material.telegram_file_id,
        telegram_file_type=material.telegram_file_type,
        telegram_file_name=material.telegram_file_name,
        telegram_caption=material.telegram_caption,
        status="configured",
        source="sqlite",
    )


async def resolve_material(storage: VcStorage, settings: Settings, lead: Lead | None = None, payload: str | None = None) -> ResolvedMaterial:
    raw_payload = normalize_payload(payload or (lead.raw_start_payload if lead else None))
    definition = PAYLOAD_CATALOG.get(raw_payload or "")
    material_key = definition.material_key if definition else None
    title_override = None

    if raw_payload:
        binding = await storage.get_material_binding(raw_payload)
        if binding is not None:
            material_key, title_override = binding

    if material_key:
        material = await storage.get_material(material_key)
        if material is not None:
            return _from_row(material, title_override)
        fallback = MATERIAL_CATALOG.get(material_key)
        if fallback is not None:
            resolved = _from_definition(fallback, settings)
            if resolved.has_content:
                return resolved

    if lead is not None:
        url = settings.youtube_materials_url if lead.source_type == "youtube" else settings.telegram_materials_url if lead.source in {"telegram", "channel"} else settings.materials_url
        if url:
            return ResolvedMaterial(None, settings.materials_title, None, url, status="env fallback", source="env")

    return ResolvedMaterial(material_key, definition.title if definition else settings.materials_title, None, None)


async def resolve_material_key(
    storage: VcStorage,
    settings: Settings,
    material_key: str,
) -> ResolvedMaterial:
    material = await storage.get_material_any(material_key)
    if material is not None:
        resolved = _from_row(material)
        status = (
            "inactive"
            if not material.is_active
            else "loaded"
            if resolved.has_content
            else "missing"
        )
        return ResolvedMaterial(
            **{
                **resolved.__dict__,
                "status": status,
            }
        )

    fallback = MATERIAL_CATALOG.get(material_key)
    if fallback is not None:
        resolved = _from_definition(fallback, settings)
        if resolved.has_content:
            return ResolvedMaterial(
                **{
                    **resolved.__dict__,
                    "status": "loaded",
                }
            )
        return ResolvedMaterial(
            material_key=material_key,
            title=fallback.title,
            body=None,
            url=None,
            status="missing",
            source="catalog",
        )

    return ResolvedMaterial(
        material_key=material_key,
        title=material_key,
        body=None,
        url=None,
        status="missing",
        source="missing",
    )


async def material_readiness(
    storage: VcStorage,
    settings: Settings,
    material_keys: tuple[str, ...],
) -> dict[str, str]:
    return {
        material_key: (
            await resolve_material_key(storage, settings, material_key)
        ).status
        for material_key in material_keys
    }


def material_body(material: ResolvedMaterial) -> str | None:
    parts = [part for part in (material.body, material.url) if part]
    return "\n\n".join(parts) if parts else None
