from __future__ import annotations

from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

from .config import Settings
from .models import Lead


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
    payload: dict[str, str | None] = {
        "event_id": settings.webinar_event_id,
        "source": lead.source,
        "start_payload": lead.raw_start_payload,
        "campaign": lead.campaign,
        "post": lead.post_id or lead.post_slug,
        "route": selected_route(lead),
        "bottleneck": lead.pain,
    }
    if reminder_type is not None:
        payload["reminder_type"] = reminder_type
    if phase is not None:
        payload["phase"] = phase
    return payload


def google_calendar_url(settings: Settings) -> str:
    if not webinar_is_configured(settings):
        raise RuntimeError("Webinar calendar configuration is incomplete")
    assert settings.webinar_start_at is not None
    assert settings.webinar_end_at is not None
    start_utc = settings.webinar_start_at.astimezone(timezone.utc)
    end_utc = settings.webinar_end_at.astimezone(timezone.utc)
    dates = (
        f"{start_utc.strftime('%Y%m%dT%H%M%SZ')}/"
        f"{end_utc.strftime('%Y%m%dT%H%M%SZ')}"
    )
    query = urlencode(
        {
            "action": "TEMPLATE",
            "text": settings.webinar_title or "Вебинар",
            "dates": dates,
            "ctz": settings.webinar_timezone_name,
            "details": (
                "Живой разбор с Андреем. "
                "Ссылка на эфир придёт в Telegram перед началом."
            ),
        }
    )
    return f"https://calendar.google.com/calendar/render?{query}"
