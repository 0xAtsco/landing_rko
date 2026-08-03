from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta

from aiogram import Bot
from aiogram.exceptions import TelegramAPIError

from .config import Settings
from .keyboards import hermes_webinar_join_keyboard
from .messages import (
    HERMES_WEBINAR_REMINDER_15M,
    HERMES_WEBINAR_REMINDER_15M_NO_URL,
    HERMES_WEBINAR_REMINDER_24H,
    HERMES_WEBINAR_REMINDER_24H_TODAY,
    HERMES_WEBINAR_REMINDER_3H,
)
from .models import WebinarRegistration
from .storage import VcStorage
from .webinar import runtime_webinar_settings, webinar_is_configured


logger = logging.getLogger(__name__)
REMINDER_POLL_SECONDS = 30.0


def current_reminder_type(
    settings: Settings,
    *,
    now: datetime | None = None,
) -> str | None:
    if (
        settings.funnel_end_mode != "webinar"
        or not settings.webinar_enabled
        or not webinar_is_configured(settings)
    ):
        return None
    assert settings.webinar_start_at is not None
    assert settings.webinar_timezone is not None
    current = now or datetime.now(settings.webinar_timezone)
    if current.tzinfo is None or current.utcoffset() is None:
        current = current.replace(tzinfo=settings.webinar_timezone)
    else:
        current = current.astimezone(settings.webinar_timezone)
    remaining = settings.webinar_start_at - current
    if remaining <= timedelta(0) or remaining > timedelta(hours=24):
        return None
    if remaining <= timedelta(minutes=15):
        return "15m"
    if remaining <= timedelta(hours=3):
        return "3h"
    return "24h"


def reminder_text(
    settings: Settings,
    reminder_type: str,
    *,
    now: datetime | None = None,
) -> str:
    assert settings.webinar_timezone is not None
    assert settings.webinar_start_at is not None
    current = now or datetime.now(settings.webinar_timezone)
    if current.tzinfo is None or current.utcoffset() is None:
        current = current.replace(tzinfo=settings.webinar_timezone)
    else:
        current = current.astimezone(settings.webinar_timezone)
    if reminder_type == "24h":
        return (
            HERMES_WEBINAR_REMINDER_24H_TODAY
            if current.date() == settings.webinar_start_at.date()
            else HERMES_WEBINAR_REMINDER_24H
        )
    if reminder_type == "3h":
        return HERMES_WEBINAR_REMINDER_3H
    if reminder_type == "15m":
        return (
            HERMES_WEBINAR_REMINDER_15M
            if settings.webinar_join_url
            else HERMES_WEBINAR_REMINDER_15M_NO_URL
        )
    raise ValueError(f"Unknown reminder type: {reminder_type}")


def _registration_event_payload(
    settings: Settings,
    registration: WebinarRegistration,
    reminder_type: str,
) -> dict[str, str | None]:
    return {
        "event_id": settings.webinar_event_id,
        "source": registration.source,
        "start_payload": registration.start_payload,
        "campaign": registration.campaign,
        "post": registration.post,
        "route": registration.selected_route,
        "bottleneck": registration.bottleneck,
        "reminder_type": reminder_type,
    }


async def send_due_webinar_reminders(
    bot: Bot,
    storage: VcStorage,
    settings: Settings,
    *,
    now: datetime | None = None,
) -> int:
    reminder_type = current_reminder_type(settings, now=now)
    if reminder_type is None or settings.webinar_event_id is None:
        return 0
    registrations = await storage.list_due_webinar_registrations(
        settings.webinar_event_id,
        reminder_type,
    )
    sent = 0
    for registration in registrations:
        try:
            await bot.send_message(
                chat_id=registration.telegram_chat_id,
                text=reminder_text(
                    settings,
                    reminder_type,
                    now=now,
                ),
                reply_markup=(
                    hermes_webinar_join_keyboard()
                    if reminder_type == "15m"
                    and settings.webinar_join_url
                    else None
                ),
            )
        except TelegramAPIError as exc:
            logger.warning(
                "Webinar reminder delivery failed for event %s: %s",
                settings.webinar_event_id,
                exc.__class__.__name__,
            )
            continue
        marked = await storage.mark_webinar_reminder_sent(
            settings.webinar_event_id,
            registration.telegram_user_id,
            reminder_type,
        )
        if not marked:
            continue
        payload = _registration_event_payload(
            settings,
            registration,
            reminder_type,
        )
        await storage.add_event(
            registration.telegram_user_id,
            "webinar_reminder_sent",
            payload,
        )
        sent += 1
    return sent


def persisted_reminder_text(settings: Settings, delivery_type: str) -> str:
    assert settings.webinar_start_at is not None
    date = settings.webinar_start_at.strftime("%d.%m в %H:%M МСК")
    if delivery_type == "24h":
        return f"Завтра, {date}, — главный эфир.\n\nНапомним ещё за 3 часа и за 15 минут."
    if delivery_type == "3h":
        return f"До главного эфира осталось 3 часа.\n\nНачало: {date}."
    if delivery_type == "15m":
        return "Эфир начнётся через 15 минут. Нажмите кнопку ниже."
    if delivery_type == "start":
        return "Эфир начался. Подключайтесь сейчас."
    if delivery_type == "reschedule_notice":
        return f"Главный эфир перенесён.\n\nНовая дата: {date}.\n\nВаша регистрация сохранена, повторно нажимать ничего не нужно. Напоминания придут автоматически."
    raise ValueError(f"Unknown persisted delivery type: {delivery_type}")


async def send_due_persisted_webinar_deliveries(
    bot: Bot,
    storage: VcStorage,
    settings: Settings,
    *,
    now: datetime | None = None,
) -> int:
    runtime = await runtime_webinar_settings(storage, settings)
    event = await storage.get_webinar_event(runtime.webinar_event_id or "E02")
    if event is None or runtime.funnel_end_mode == "disabled" or not webinar_is_configured(runtime):
        return 0
    current = now or datetime.now(runtime.webinar_timezone or settings.timezone)
    if current.tzinfo is None or current.utcoffset() is None:
        current = current.replace(tzinfo=runtime.webinar_timezone or settings.timezone)
    if event.phase == "registration" and runtime.webinar_start_at and current >= runtime.webinar_start_at:
        await storage.update_webinar_event(event.event_id, phase="live")
        runtime = await runtime_webinar_settings(storage, settings)
        event = await storage.get_webinar_event(event.event_id) or event
    sent = 0
    for delivery in await storage.list_due_webinar_deliveries(event, now=current):
        if not await storage.mark_webinar_delivery(delivery.id, status="sending"):
            continue
        try:
            reveal_join = delivery.delivery_type in {"15m", "start"} and bool(runtime.webinar_join_url)
            await bot.send_message(
                chat_id=delivery.telegram_chat_id,
                text=persisted_reminder_text(runtime, delivery.delivery_type),
                reply_markup=hermes_webinar_join_keyboard() if reveal_join else None,
            )
        except TelegramAPIError as exc:
            await storage.mark_webinar_delivery(delivery.id, status="failed", error_type=exc.__class__.__name__)
            continue
        await storage.mark_webinar_delivery(delivery.id, status="sent")
        await storage.add_event(
            delivery.telegram_user_id,
            "webinar_reminder_sent" if delivery.delivery_type in {"24h", "3h", "15m"} else f"webinar_{delivery.delivery_type}_sent",
            {"event_id": delivery.event_id, "event_version": str(delivery.event_version), "reminder_type": delivery.delivery_type},
        )
        sent += 1
    return sent


async def run_webinar_reminder_worker(
    bot: Bot,
    storage: VcStorage,
    settings: Settings,
    stop_event: asyncio.Event,
) -> None:
    while not stop_event.is_set():
        try:
            await send_due_persisted_webinar_deliveries(bot, storage, settings)
        except Exception as exc:
            logger.warning(
                "Webinar reminder worker iteration failed: %s",
                exc.__class__.__name__,
            )
        try:
            await asyncio.wait_for(
                stop_event.wait(),
                timeout=REMINDER_POLL_SECONDS,
            )
        except asyncio.TimeoutError:
            continue
