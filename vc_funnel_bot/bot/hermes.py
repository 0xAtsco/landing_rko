from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from .catalog.hermes import (
    HERMES_BUNDLES,
    HERMES_RESULT_TEXTS,
    HERMES_SETUP_FALLBACK_TEXT,
    HERMES_SETUP_READY_TEXT,
)
from .config import Settings
from .materials import material_body, resolve_material_key
from .messages import material_text
from .models import Lead
from .storage import VcStorage


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class BundleDelivery:
    track: str
    requested: int
    delivered: int
    statuses: dict[str, str]


async def hermes_result_text(
    storage: VcStorage,
    settings: Settings,
    track: str,
) -> str:
    if not track.startswith("setup_"):
        return HERMES_RESULT_TEXTS[track]
    material_keys = HERMES_BUNDLES.get(track, ())
    if not material_keys:
        return HERMES_SETUP_FALLBACK_TEXT
    material = await resolve_material_key(storage, settings, material_keys[0])
    return (
        HERMES_SETUP_READY_TEXT
        if material.status == "loaded" and material.has_content
        else HERMES_SETUP_FALLBACK_TEXT
    )


async def send_material_bundle(
    renderer: Any,
    storage: VcStorage,
    settings: Settings,
    lead: Lead,
    track: str,
) -> BundleDelivery:
    material_keys = HERMES_BUNDLES.get(track, ())
    await storage.add_event(
        lead.telegram_id,
        "hermes_bundle_started",
        {
            "track": track,
            "material_keys": list(material_keys),
        },
    )

    statuses: dict[str, str] = {}
    delivered = 0
    for material_key in material_keys:
        material = await resolve_material_key(storage, settings, material_key)
        if material.status in {"missing", "inactive"} or not material.has_content:
            status = (
                "inactive"
                if material.status == "inactive"
                else "missing"
            )
            statuses[material_key] = status
            await storage.add_event(
                lead.telegram_id,
                "hermes_material_delivered",
                {
                    "track": track,
                    "material_key": material_key,
                    "delivery_status": status,
                },
            )
            continue

        try:
            text = material_text(material.title, material_body(material))
            if hasattr(renderer, "render_material"):
                await renderer.render_material(
                    lead=lead,
                    material=material,
                    text=text,
                    persistent=True,
                )
            else:
                await renderer.render_screen(
                    lead=lead,
                    text=text,
                    mode="send_new",
                    persistent=True,
                )
        except Exception as exc:
            logger.warning(
                "Hermes material delivery failed for %s: %s",
                material_key,
                exc.__class__.__name__,
            )
            statuses[material_key] = "failed"
            await storage.add_event(
                lead.telegram_id,
                "hermes_material_delivered",
                {
                    "track": track,
                    "material_key": material_key,
                    "delivery_status": "failed",
                    "error_type": exc.__class__.__name__,
                },
            )
            continue

        delivered += 1
        statuses[material_key] = "delivered"
        await storage.add_event(
            lead.telegram_id,
            "hermes_material_delivered",
            {
                "track": track,
                "material_key": material_key,
                "delivery_status": "delivered",
            },
        )

    if delivered and not (lead.call_requested or lead.sales_notified):
        await storage.mark_materials_sent(lead.telegram_id)

    return BundleDelivery(
        track=track,
        requested=len(material_keys),
        delivered=delivered,
        statuses=statuses,
    )
