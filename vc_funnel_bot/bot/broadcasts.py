from __future__ import annotations

import argparse
import asyncio
import json
import logging

from aiogram import Bot
from aiogram.exceptions import (
    TelegramAPIError,
    TelegramBadRequest,
    TelegramForbiddenError,
    TelegramNetworkError,
    TelegramRetryAfter,
)

from .config import load_settings, resolve_sqlite_path
from .keyboards import webinar_broadcast_registration_keyboard
from .storage import VcStorage


logger = logging.getLogger(__name__)

BROADCAST_CAMPAIGN_ID = "e02_1608_bot_broadcast_1508"
BROADCAST_EVENT_ID = "E02"
BROADCAST_SOURCE_PAYLOAD = "am_e02_broadcast_1508"
BROADCAST_REGISTER_CALLBACK = "hb:webinar:broadcast_register"
BROADCAST_SEND_INTERVAL_SECONDS = 0.08
BROADCAST_MAX_ATTEMPTS = 3
BROADCAST_TEXT = """16 августа проведу главный эфир по поиску клиентов на РКО с помощью вайбкодинга.

Обсудим наболевший вопрос: где стабильно брать потенциальных клиентов на вайбкодинг и как оформлять их на РКО.

На эфире пройду полный путь:

— навайбкожу программу для селлеров на Wildberries / Ozon;
— пойду искать для неё клиентов;
— покажу варианты монетизации этой и других связок.

В конце эфира тем, кто останется, выдам эксклюзивные материалы по вайбкодингу.

Ссылка придёт сюда перед началом 🤝"""


def _safe_error(exc: Exception) -> str:
    return f"{exc.__class__.__name__}: {str(exc)[:300]}"


async def send_broadcast(
    bot: Bot,
    storage: VcStorage,
    *,
    campaign_id: str = BROADCAST_CAMPAIGN_ID,
    interval_seconds: float = BROADCAST_SEND_INTERVAL_SECONDS,
    max_attempts: int = BROADCAST_MAX_ATTEMPTS,
) -> dict[str, int | float]:
    while True:
        deliveries = await storage.list_broadcast_deliveries(
            campaign_id,
            max_attempts=max_attempts,
        )
        if not deliveries:
            break
        for delivery in deliveries:
            if not await storage.claim_broadcast_delivery(delivery.id):
                continue
            try:
                message = await bot.send_message(
                    chat_id=delivery.telegram_chat_id,
                    text=BROADCAST_TEXT,
                    reply_markup=webinar_broadcast_registration_keyboard(),
                )
            except TelegramRetryAfter as exc:
                await storage.mark_broadcast_delivery(
                    delivery.id,
                    status="temporary_error",
                    error=_safe_error(exc),
                )
                await asyncio.sleep(float(exc.retry_after) + 0.5)
                continue
            except TelegramNetworkError as exc:
                await storage.mark_broadcast_delivery(
                    delivery.id,
                    status="temporary_error",
                    error=_safe_error(exc),
                )
                await asyncio.sleep(0.5)
                continue
            except (TelegramForbiddenError, TelegramBadRequest) as exc:
                await storage.mark_broadcast_delivery(
                    delivery.id,
                    status="blocked",
                    error=_safe_error(exc),
                )
                continue
            except TelegramAPIError as exc:
                await storage.mark_broadcast_delivery(
                    delivery.id,
                    status="unknown_result",
                    error=_safe_error(exc),
                )
                continue
            except Exception as exc:
                await storage.mark_broadcast_delivery(
                    delivery.id,
                    status="unknown_result",
                    error=_safe_error(exc),
                )
                logger.exception("Unexpected broadcast error")
                continue

            await storage.mark_broadcast_delivery(
                delivery.id,
                status="sent",
                message_id=getattr(message, "message_id", None),
            )
            await storage.add_event(
                delivery.telegram_user_id,
                "webinar_broadcast_sent",
                {
                    "campaign": campaign_id,
                    "event_id": delivery.event_id,
                },
            )
            if interval_seconds > 0:
                await asyncio.sleep(interval_seconds)
    return await storage.broadcast_stats(campaign_id)


async def _run(action: str) -> None:
    settings = load_settings()
    storage = VcStorage(resolve_sqlite_path(settings), settings.timezone)
    await storage.connect()
    bot: Bot | None = None
    try:
        if action == "prepare":
            await storage.prepare_broadcast(BROADCAST_CAMPAIGN_ID, BROADCAST_EVENT_ID)
        elif action == "send":
            await storage.prepare_broadcast(BROADCAST_CAMPAIGN_ID, BROADCAST_EVENT_ID)
            bot = Bot(token=settings.bot_token)
            await send_broadcast(bot, storage)
        print(json.dumps(await storage.broadcast_stats(BROADCAST_CAMPAIGN_ID), ensure_ascii=False))
    finally:
        if bot is not None:
            await bot.session.close()
        await storage.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Рассылка приглашения на эфир E02")
    parser.add_argument("action", choices=("prepare", "send", "status"))
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO)
    asyncio.run(_run(args.action))


if __name__ == "__main__":
    main()
