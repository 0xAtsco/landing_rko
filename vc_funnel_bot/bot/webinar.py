from __future__ import annotations

from dataclasses import replace
from datetime import datetime, timedelta

from .config import Settings
from .models import Lead
from .source_parser import parse_start_payload
from .storage import VcStorage


WEBINAR_PHASES = {
    "personal_plan",
    "disabled",
    "registration",
    "live",
    "replay",
}


def webinar_is_configured(settings: Settings) -> bool:
    return bool(
        settings.webinar_event_id
        and settings.webinar_title
        and settings.webinar_start_at
        and settings.webinar_end_at
        and settings.webinar_timezone
    )


def webinar_phase(
    settings: Settings,
    *,
    now: datetime | None = None,
) -> str:
    if settings.funnel_end_mode == "personal_plan":
        return "personal_plan"
    if settings.funnel_end_mode == "disabled":
        return "disabled"
    if not settings.webinar_enabled or not webinar_is_configured(settings):
        return "disabled"
    if settings.funnel_end_mode == "replay":
        return "replay"

    assert settings.webinar_start_at is not None
    assert settings.webinar_end_at is not None
    assert settings.webinar_timezone is not None
    current = now or datetime.now(settings.webinar_timezone)
    if current.tzinfo is None or current.utcoffset() is None:
        current = current.replace(tzinfo=settings.webinar_timezone)
    else:
        current = current.astimezone(settings.webinar_timezone)
    if current < settings.webinar_start_at:
        return "registration"
    if current < settings.webinar_end_at:
        return "live"
    return "replay"


def selected_route(lead: Lead) -> str | None:
    if lead.pain == "setup":
        return "setup_help"
    if lead.pain in {"find_business", "offer", "build", "deal"}:
        return lead.pain
    return None


def webinar_join_is_available(
    settings: Settings,
    *,
    now: datetime | None = None,
) -> bool:
    if (
        settings.funnel_end_mode != "webinar"
        or not settings.webinar_enabled
        or not settings.webinar_join_url
        or not webinar_is_configured(settings)
    ):
        return False
    assert settings.webinar_start_at is not None
    assert settings.webinar_end_at is not None
    assert settings.webinar_timezone is not None
    current = now or datetime.now(settings.webinar_timezone)
    if current.tzinfo is None or current.utcoffset() is None:
        current = current.replace(tzinfo=settings.webinar_timezone)
    else:
        current = current.astimezone(settings.webinar_timezone)
    return (
        settings.webinar_start_at - timedelta(minutes=15)
        <= current
        < settings.webinar_end_at
    )


def webinar_event_payload(
    settings: Settings,
    lead: Lead,
    *,
    reminder_type: str | None = None,
    phase: str | None = None,
) -> dict[str, str | None]:
    attribution = parse_start_payload(
        lead.latest_start_payload or lead.raw_start_payload
    )
    payload: dict[str, str | None] = {
        "event_id": settings.webinar_event_id,
        "source": attribution.source,
        "start_payload": attribution.raw_start_payload,
        "campaign": attribution.campaign,
        "post": attribution.post_id or attribution.post_slug,
        "route": selected_route(lead),
        "bottleneck": lead.pain,
    }
    if reminder_type is not None:
        payload["reminder_type"] = reminder_type
    if phase is not None:
        payload["phase"] = phase
    return payload


def webinar_registration_text(
    settings: Settings,
    *,
    already_registered: bool = False,
) -> str:
    title = settings.webinar_title or "Главный эфир"
    schedule = (
        settings.webinar_start_at.strftime("%d.%m.%Y в %H:%M МСК")
        if settings.webinar_start_at
        else "дату сообщим в этом боте"
    )
    status = "Вы уже зарегистрированы." if already_registered else "Вы зарегистрированы."
    return (
        f"{status}\n\n"
        f"{title}\n"
        f"Когда: {schedule}.\n\n"
        "Перед началом я пришлю напоминание и ссылку сюда."
    )


async def runtime_webinar_settings(storage: VcStorage, settings: Settings) -> Settings:
    """Use the persisted E02 config after it has been initialized once."""
    event = await storage.get_webinar_event(settings.webinar_event_id or "E02")
    if event is None:
        return settings
    start = datetime.fromisoformat(event.start_at).astimezone(settings.timezone) if event.start_at else None
    mode = {
        "draft": "disabled",
        "closed": "disabled",
        "registration": "webinar",
        "live": "webinar",
        "replay": "replay",
    }.get(event.phase, "disabled")
    return replace(
        settings,
        funnel_end_mode=mode,
        webinar_enabled=event.phase not in {"draft", "closed"},
        webinar_event_id=event.event_id,
        webinar_title=event.title,
        webinar_start_at=start,
        webinar_end_at=(start + timedelta(hours=1)) if start else None,
        webinar_timezone_name=event.timezone,
        webinar_timezone=settings.timezone,
        webinar_join_url=event.join_url,
        webinar_replay_url=event.replay_url,
    )
