from __future__ import annotations

import tempfile
import unittest
from unittest.mock import AsyncMock, patch
from datetime import datetime, timedelta
from pathlib import Path
from types import SimpleNamespace
from zoneinfo import ZoneInfo

from aiogram.exceptions import TelegramForbiddenError, TelegramRetryAfter
from aiogram.methods import SendMessage

from bot.broadcasts import (
    BROADCAST_CAMPAIGN_ID,
    BROADCAST_REGISTER_CALLBACK,
    BROADCAST_SOURCE_PAYLOAD,
    BROADCAST_TEXT,
    send_broadcast,
)
from bot.config import Settings
from bot.handlers import route_callback, webinar_admin_text
from bot.source_parser import parse_start_payload
from bot.storage import VcStorage


MOSCOW = ZoneInfo("Europe/Moscow")


class FakeBot:
    def __init__(self, blocked_chat_id: int | None = None) -> None:
        self.blocked_chat_id = blocked_chat_id
        self.sent_messages: list[dict[str, object]] = []

    async def send_message(self, **kwargs):
        if kwargs["chat_id"] == self.blocked_chat_id:
            raise TelegramForbiddenError(
                method=SendMessage(chat_id=kwargs["chat_id"], text=kwargs["text"]),
                message="Forbidden: bot was blocked by the user",
            )
        self.sent_messages.append(kwargs)
        return SimpleNamespace(message_id=len(self.sent_messages))


class FakeRenderer:
    def __init__(self) -> None:
        self.screens: list[dict[str, object]] = []

    async def render_screen(self, **kwargs):
        self.screens.append(kwargs)
        return object()


class RateLimitedBot(FakeBot):
    def __init__(self) -> None:
        super().__init__()
        self.attempts: dict[int, int] = {}

    async def send_message(self, **kwargs):
        chat_id = int(kwargs["chat_id"])
        self.attempts[chat_id] = self.attempts.get(chat_id, 0) + 1
        if self.attempts[chat_id] == 1:
            raise TelegramRetryAfter(
                method=SendMessage(chat_id=chat_id, text=kwargs["text"]),
                message="Too Many Requests",
                retry_after=1,
            )
        return await super().send_message(**kwargs)


def make_settings() -> Settings:
    start = datetime.now(MOSCOW) + timedelta(days=2)
    return Settings(
        bot_token="test-token",
        sqlite_path="./data/vc_funnel.db",
        database_url=None,
        sales_chat_id=None,
        private_channel_invite_url="https://t.me/+invite",
        materials_title="Материалы",
        materials_url=None,
        youtube_materials_url=None,
        telegram_materials_url=None,
        timezone_name="Europe/Moscow",
        timezone=MOSCOW,
        enable_text_triggers=True,
        enable_followups=False,
        debug=False,
        ux_typing_delay_test_mode=True,
        funnel_end_mode="webinar",
        webinar_enabled=True,
        webinar_event_id="E02",
        webinar_title="Главный эфир",
        webinar_start_at=start,
        webinar_end_at=start + timedelta(hours=1),
        webinar_timezone_name="Europe/Moscow",
        webinar_timezone=MOSCOW,
    )


class BroadcastTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.storage = VcStorage(Path(self.tmp.name) / "bot.sqlite3", MOSCOW)
        await self.storage.connect()
        self.settings = make_settings()
        await self.storage.ensure_webinar_event(
            event_id="E02",
            title="Главный эфир",
            start_at=self.settings.webinar_start_at.isoformat(),
        )
        await self.storage.update_webinar_event("E02", phase="registration")
        for telegram_id in (101, 102):
            await self.storage.upsert_lead(
                telegram_id=telegram_id,
                username=f"user{telegram_id}",
                first_name="Тест",
                source=parse_start_payload("youtube_hermes"),
            )

    async def asyncTearDown(self) -> None:
        await self.storage.close()
        self.tmp.cleanup()

    async def test_snapshot_is_immutable_and_delivery_is_idempotent(self) -> None:
        self.assertEqual(
            await self.storage.prepare_broadcast(BROADCAST_CAMPAIGN_ID, "E02"),
            2,
        )
        await self.storage.upsert_lead(
            telegram_id=103,
            username="late",
            first_name="Поздний",
            source=parse_start_payload(None),
        )
        self.assertEqual(
            await self.storage.prepare_broadcast(BROADCAST_CAMPAIGN_ID, "E02"),
            2,
        )

        bot = FakeBot()
        stats = await send_broadcast(
            bot,  # type: ignore[arg-type]
            self.storage,
            interval_seconds=0,
        )
        self.assertEqual(stats["sent"], 2)
        self.assertEqual(len(bot.sent_messages), 2)
        self.assertEqual(bot.sent_messages[0]["text"], BROADCAST_TEXT)
        markup = bot.sent_messages[0]["reply_markup"]
        self.assertEqual(markup.inline_keyboard[0][0].text, "Зарегистрироваться")

        await send_broadcast(bot, self.storage, interval_seconds=0)  # type: ignore[arg-type]
        self.assertEqual(len(bot.sent_messages), 2)

    async def test_blocked_user_is_not_retried(self) -> None:
        await self.storage.prepare_broadcast(BROADCAST_CAMPAIGN_ID, "E02")
        bot = FakeBot(blocked_chat_id=102)
        stats = await send_broadcast(
            bot,  # type: ignore[arg-type]
            self.storage,
            interval_seconds=0,
        )
        self.assertEqual(stats["sent"], 1)
        self.assertEqual(stats["blocked"], 1)

        await send_broadcast(bot, self.storage, interval_seconds=0)  # type: ignore[arg-type]
        self.assertEqual(len(bot.sent_messages), 1)

    async def test_rate_limit_is_retried_without_duplicate_delivery(self) -> None:
        await self.storage.prepare_broadcast(BROADCAST_CAMPAIGN_ID, "E02")
        bot = RateLimitedBot()
        with patch("bot.broadcasts.asyncio.sleep", new=AsyncMock()):
            stats = await send_broadcast(
                bot,  # type: ignore[arg-type]
                self.storage,
                interval_seconds=0,
            )
        self.assertEqual(stats["sent"], 2)
        self.assertEqual(len(bot.sent_messages), 2)
        self.assertEqual(bot.attempts, {101: 2, 102: 2})

    async def test_broadcast_registration_preserves_first_touch(self) -> None:
        lead = await self.storage.get_lead(101)
        first_touch = (lead.source, lead.raw_start_payload, lead.campaign)
        renderer = FakeRenderer()

        await route_callback(
            renderer,  # type: ignore[arg-type]
            self.storage,
            self.settings,
            lead,
            BROADCAST_REGISTER_CALLBACK,
            None,
        )
        registration = await self.storage.get_webinar_registration("E02", 101)
        fresh = await self.storage.get_lead(101)
        self.assertEqual((fresh.source, fresh.raw_start_payload, fresh.campaign), first_touch)
        self.assertEqual(registration.source, "bot_broadcast")
        self.assertEqual(registration.start_payload, BROADCAST_SOURCE_PAYLOAD)
        self.assertEqual(registration.campaign, BROADCAST_CAMPAIGN_ID)
        self.assertEqual(
            await self.storage.count_events(101, "webinar_broadcast_registered"),
            1,
        )

        await route_callback(
            FakeRenderer(),  # type: ignore[arg-type]
            self.storage,
            self.settings,
            lead,
            BROADCAST_REGISTER_CALLBACK,
            None,
        )
        self.assertEqual(
            await self.storage.count_events(101, "webinar_broadcast_already_registered"),
            1,
        )
        rows = await (
            await self.storage.db.execute(
                "SELECT COUNT(*) AS total FROM vc_funnel_webinar_deliveries WHERE telegram_user_id = 101"
            )
        ).fetchone()
        self.assertEqual(int(rows["total"]), 4)

    async def test_admin_status_is_in_russian(self) -> None:
        await self.storage.prepare_broadcast(BROADCAST_CAMPAIGN_ID, "E02")
        text = await webinar_admin_text(self.storage, self.settings)
        self.assertIn("Рассылка приглашения 15 августа", text)
        self.assertIn("Получатели: 2", text)
        self.assertNotIn(BROADCAST_CAMPAIGN_ID, text)
