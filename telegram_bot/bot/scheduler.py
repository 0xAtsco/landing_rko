from __future__ import annotations

import asyncio
import logging

from aiogram import Bot
from aiogram.exceptions import TelegramAPIError
from sqlalchemy.ext.asyncio import async_sessionmaker

from .config import Settings
from .keyboards import apply_keyboard
from .messages import REMINDER_15M_TEXT, REMINDER_24H_TEXT
from .repository import (
    add_event,
    find_due_15m_reminders,
    find_due_24h_reminders,
    now_local,
)


logger = logging.getLogger(__name__)


async def reminder_loop(
    bot: Bot,
    session_factory: async_sessionmaker,
    settings: Settings,
) -> None:
    while True:
        try:
            await send_due_reminders(bot, session_factory, settings)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Reminder loop failed")

        await asyncio.sleep(settings.reminder_poll_interval_seconds)


async def send_due_reminders(
    bot: Bot,
    session_factory: async_sessionmaker,
    settings: Settings,
) -> None:
    async with session_factory() as session:
        leads_15m = await find_due_15m_reminders(session, settings)
        leads_24h = await find_due_24h_reminders(session, settings)

        for lead in leads_15m:
            await send_reminder(
                bot,
                session,
                settings,
                lead,
                "reminder_15m",
                REMINDER_15M_TEXT,
            )

        for lead in leads_24h:
            await send_reminder(
                bot,
                session,
                settings,
                lead,
                "reminder_24h",
                REMINDER_24H_TEXT,
            )

        await session.commit()


async def send_reminder(bot, session, settings, lead, action: str, text: str) -> None:
    sent_at = now_local(settings)

    try:
        await bot.send_message(
            chat_id=lead.chat_id,
            text=text,
            reply_markup=apply_keyboard(),
        )
        await add_event(session, settings, lead, f"{action}_sent")
    except TelegramAPIError as exc:
        await add_event(
            session,
            settings,
            lead,
            "message_failed",
            {"action": action, "error": str(exc)},
        )

    if action == "reminder_15m":
        lead.reminder_15m_sent_at = sent_at
    elif action == "reminder_24h":
        lead.reminder_24h_sent_at = sent_at

    lead.updated_at = sent_at

