from __future__ import annotations

import json
from datetime import datetime, timedelta
from typing import Any

from aiogram.types import User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import Settings
from .db import Event, Lead


STATUS_STARTED = "started_not_applied"
STATUS_CLICKED_APPLY = "clicked_apply"
STATUS_INTERESTED_WATCH = "interested_watch"
STATUS_ANSWERED_Q1 = "answered_q1"
STATUS_CONTACT_SHARED = "contact_shared"
STATUS_CONTACT_TEXT_PROVIDED = "contact_text_provided"


def now_local(settings: Settings) -> datetime:
    return datetime.now(settings.timezone).replace(tzinfo=None)


def payload_to_source(payload: str | None) -> str:
    return payload or "direct"


async def add_event(
    session: AsyncSession,
    settings: Settings,
    lead: Lead | None,
    action: str,
    details: dict[str, Any] | None = None,
    admin_chat_id: int | None = None,
) -> Event:
    if lead is not None and lead.id is None:
        await session.flush()

    event = Event(
        lead_id=lead.id if lead else None,
        admin_chat_id=admin_chat_id,
        action=action,
        details_json=json.dumps(details, ensure_ascii=False) if details else None,
        created_at=now_local(settings),
    )
    session.add(event)
    return event


async def get_lead_by_telegram_id(session: AsyncSession, telegram_id: int) -> Lead | None:
    result = await session.execute(select(Lead).where(Lead.telegram_id == telegram_id))
    return result.scalar_one_or_none()


async def upsert_lead_from_user(
    session: AsyncSession,
    settings: Settings,
    user: User,
    chat_id: int,
    start_payload: str | None = None,
) -> Lead:
    now = now_local(settings)
    lead = await get_lead_by_telegram_id(session, user.id)
    source = payload_to_source(start_payload)

    if lead is None:
        lead = Lead(
            telegram_id=user.id,
            chat_id=chat_id,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            language_code=user.language_code,
            source=source,
            start_payload=start_payload,
            status=STATUS_STARTED,
            started_at=now,
            last_seen_at=now,
            created_at=now,
            updated_at=now,
        )
        session.add(lead)
        await add_event(
            session,
            settings,
            lead,
            "lead_started",
            {"start_payload": start_payload, "source": source},
        )
        return lead

    lead.chat_id = chat_id
    lead.username = user.username
    lead.first_name = user.first_name
    lead.last_name = user.last_name
    lead.language_code = user.language_code
    lead.last_seen_at = now
    lead.updated_at = now

    if start_payload:
        lead.source = source
        lead.start_payload = start_payload

    await add_event(
        session,
        settings,
        lead,
        "lead_restarted",
        {"start_payload": start_payload, "source": source},
    )
    return lead


async def touch_lead_from_user(
    session: AsyncSession,
    settings: Settings,
    user: User,
    chat_id: int,
) -> Lead:
    lead = await get_lead_by_telegram_id(session, user.id)
    if lead is None:
        return await upsert_lead_from_user(session, settings, user, chat_id)

    now = now_local(settings)
    lead.chat_id = chat_id
    lead.username = user.username
    lead.first_name = user.first_name
    lead.last_name = user.last_name
    lead.language_code = user.language_code
    lead.last_seen_at = now
    lead.updated_at = now
    return lead


async def update_status(
    session: AsyncSession,
    settings: Settings,
    lead: Lead,
    status: str,
    event_action: str,
    details: dict[str, Any] | None = None,
    admin_chat_id: int | None = None,
) -> None:
    now = now_local(settings)
    lead.status = status
    lead.last_seen_at = now
    lead.updated_at = now
    await add_event(session, settings, lead, event_action, details, admin_chat_id)


async def find_due_15m_reminders(
    session: AsyncSession,
    settings: Settings,
) -> list[Lead]:
    due_before = now_local(settings) - timedelta(minutes=15)
    result = await session.execute(
        select(Lead).where(
            Lead.status == STATUS_STARTED,
            Lead.started_at <= due_before,
            Lead.reminder_15m_sent_at.is_(None),
        )
    )
    return list(result.scalars().all())


async def find_due_24h_reminders(
    session: AsyncSession,
    settings: Settings,
) -> list[Lead]:
    due_before = now_local(settings) - timedelta(hours=24)
    result = await session.execute(
        select(Lead).where(
            Lead.status.in_([STATUS_STARTED, STATUS_INTERESTED_WATCH]),
            Lead.started_at <= due_before,
            Lead.reminder_24h_sent_at.is_(None),
        )
    )
    return list(result.scalars().all())
