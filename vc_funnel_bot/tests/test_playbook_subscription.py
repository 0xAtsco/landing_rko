from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from zoneinfo import ZoneInfo

from aiogram.exceptions import TelegramBadRequest
from aiogram.methods import GetChatMember

from bot.config import Settings
from bot.handlers import route_callback
from bot.source_parser import parse_start_payload
from bot.storage import VcStorage
from bot.subscriptions import check_channel_subscription


CHANNEL_ID = -1002294871395


class FakeBot:
    def __init__(self, *statuses: str) -> None:
        self.statuses = list(statuses)
        self.calls: list[tuple[int, int]] = []

    async def get_chat_member(self, *, chat_id: int, user_id: int):
        self.calls.append((chat_id, user_id))
        status = self.statuses.pop(0)
        if status == "telegram_error":
            raise TelegramBadRequest(
                method=GetChatMember(chat_id=chat_id, user_id=user_id),
                message="chat not found",
            )
        return SimpleNamespace(status=status, is_member=status == "restricted_member")


class FakeRenderer:
    def __init__(self, bot: FakeBot) -> None:
        self.bot = bot
        self.screens: list[dict[str, object]] = []
        self.materials: list[dict[str, object]] = []

    async def render_screen(self, **kwargs):
        self.screens.append(kwargs)
        return object()

    async def render_material(self, **kwargs):
        self.materials.append(kwargs)
        return object()


def settings(*, chat_id: int | None = CHANNEL_ID) -> Settings:
    timezone = ZoneInfo("Europe/Moscow")
    return Settings(
        bot_token="test",
        sqlite_path="./data/test.db",
        database_url=None,
        sales_chat_id=None,
        private_channel_invite_url="https://t.me/+invite",
        materials_title="Материалы",
        materials_url=None,
        youtube_materials_url=None,
        telegram_materials_url=None,
        timezone_name="Europe/Moscow",
        timezone=timezone,
        enable_text_triggers=True,
        enable_followups=False,
        debug=False,
        private_channel_chat_id=chat_id,
        playbook_subscription_required=True,
        ux_typing_delay_test_mode=True,
    )


class PlaybookSubscriptionTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.storage = VcStorage(
            Path(self.tmp.name) / "bot.sqlite3", ZoneInfo("Europe/Moscow")
        )
        await self.storage.connect()
        self.lead = await self.storage.upsert_lead(
            telegram_id=101,
            username="reader",
            first_name="Reader",
            source=parse_start_payload("youtube_hermes"),
        )
        self.lead = await self.storage.save_route_field(
            self.lead.telegram_id, "pain", "offer"
        )
        self.lead = await self.storage.save_route_field(
            self.lead.telegram_id, "segment", "warm"
        )
        await self.storage.upsert_material(
            material_key="hermes_full_playbook",
            title="Полная инструкция",
            body="Инструкция",
        )

    async def asyncTearDown(self) -> None:
        await self.storage.close()
        self.tmp.cleanup()

    async def test_member_and_administrator_are_allowed(self) -> None:
        for status in ("member", "administrator", "creator"):
            with self.subTest(status=status):
                result = await check_channel_subscription(
                    FakeBot(status), chat_id=CHANNEL_ID, user_id=101
                )
                self.assertTrue(result.allowed)

    async def test_left_and_kicked_are_denied(self) -> None:
        for status in ("left", "kicked"):
            with self.subTest(status=status):
                result = await check_channel_subscription(
                    FakeBot(status), chat_id=CHANNEL_ID, user_id=101
                )
                self.assertFalse(result.allowed)

    async def test_telegram_error_and_missing_chat_fail_closed(self) -> None:
        error = await check_channel_subscription(
            FakeBot("telegram_error"), chat_id=CHANNEL_ID, user_id=101
        )
        missing = await check_channel_subscription(
            FakeBot("member"), chat_id=None, user_id=101
        )
        self.assertEqual(error.reason, "telegram_error")
        self.assertEqual(missing.reason, "misconfigured")
        self.assertFalse(error.allowed)
        self.assertFalse(missing.allowed)

    async def test_gate_blocks_delivery_and_full_playbook_event(self) -> None:
        renderer = FakeRenderer(FakeBot("left"))
        await route_callback(
            renderer, self.storage, settings(), self.lead, "hb:playbook", None
        )

        self.assertEqual(renderer.materials, [])
        self.assertIn("доступна подписчикам", str(renderer.screens[-1]["text"]))
        buttons = renderer.screens[-1]["reply_markup"].inline_keyboard
        self.assertEqual(buttons[0][0].url, "https://t.me/+invite")
        self.assertEqual(buttons[1][0].callback_data, "hb:playbook:check")
        self.assertEqual(
            await self.storage.count_events(101, "full_playbook_requested"), 0
        )
        self.assertEqual(
            await self.storage.count_events(101, "playbook_subscription_gate_shown"), 1
        )

    async def test_retry_after_subscription_delivers_playbook(self) -> None:
        renderer = FakeRenderer(FakeBot("left", "member"))
        await route_callback(
            renderer, self.storage, settings(), self.lead, "hb:playbook", None
        )
        await route_callback(
            renderer,
            self.storage,
            settings(),
            self.lead,
            "hb:playbook:check",
            None,
        )

        self.assertEqual(len(renderer.materials), 1)
        self.assertEqual(
            await self.storage.count_events(101, "full_playbook_requested"), 1
        )
        self.assertEqual(
            await self.storage.count_events(101, "playbook_subscription_verified"), 1
        )

    async def test_missing_chat_id_renders_safe_error(self) -> None:
        renderer = FakeRenderer(FakeBot("member"))
        await route_callback(
            renderer,
            self.storage,
            settings(chat_id=None),
            self.lead,
            "hb:playbook",
            None,
        )
        self.assertEqual(renderer.materials, [])
        self.assertIn("не получилось проверить", str(renderer.screens[-1]["text"]))
        self.assertEqual(
            await self.storage.count_events(101, "playbook_subscription_error"), 1
        )
