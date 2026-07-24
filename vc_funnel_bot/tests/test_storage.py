from __future__ import annotations

import asyncio
import tempfile
import unittest
from pathlib import Path
from zoneinfo import ZoneInfo

from aiogram.exceptions import TelegramBadRequest
from aiogram.methods import SendMessage

from bot.analytics import INTENT_OPTIONS, PAIN_OPTIONS, SEGMENT_OPTIONS, should_notify_sales
from bot.config import Settings
from bot.notifier import notify_sales
from bot.source_parser import parse_start_payload
from bot.storage import VcStorage


class FakeBot:
    def __init__(self) -> None:
        self.sent_messages: list[dict[str, object]] = []

    async def send_message(self, **kwargs):
        self.sent_messages.append(kwargs)
        return object()


class FailingBot:
    async def send_message(self, **kwargs):
        raise TelegramBadRequest(
            method=SendMessage(chat_id=kwargs["chat_id"], text=kwargs["text"]),
            message="Bad Request: chat not found",
        )


def make_settings(sales_chat_id: int | None = 1001) -> Settings:
    timezone = ZoneInfo("Europe/Moscow")
    return Settings(
        bot_token="test-token",
        sqlite_path="./data/vc_funnel.db",
        database_url=None,
        sales_chat_id=sales_chat_id,
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
    )


class StorageRulesTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.storage = VcStorage(Path(self.tmp.name) / "vc_funnel.db", ZoneInfo("Europe/Moscow"))
        await self.storage.connect()

    async def asyncTearDown(self) -> None:
        await self.storage.close()
        self.tmp.cleanup()

    async def create_lead(self, payload: str = "yt_video_0704_description", username: str | None = "demo"):
        return await self.storage.upsert_lead(
            telegram_id=42,
            username=username,
            first_name="Андрей",
            source=parse_start_payload(payload),
        )

    async def test_materials_only_does_not_notify_sales(self) -> None:
        lead = await self.create_lead()
        lead = await self.storage.mark_materials_sent(lead.telegram_id)
        self.assertFalse(should_notify_sales(lead))
        self.assertEqual(lead.lead_temperature, "warm")

    async def test_qual_completed_only_does_not_notify_sales(self) -> None:
        lead = await self.create_lead("tg_tgk_post_0705_diagnostic")
        await self.storage.save_answer(lead.telegram_id, "segment", SEGMENT_OPTIONS["audience"])
        await self.storage.save_answer(lead.telegram_id, "pain", PAIN_OPTIONS["automate_people"])
        lead = await self.storage.mark_qual_completed(lead.telegram_id)
        lead = await self.storage.mark_private_channel_sent(lead.telegram_id)
        self.assertEqual(lead.lead_temperature, "warm")
        self.assertFalse(should_notify_sales(lead))

    async def test_call_requested_notifies_sales(self) -> None:
        lead = await self.create_lead()
        await self.storage.save_answer(lead.telegram_id, "segment", SEGMENT_OPTIONS["rko"])
        await self.storage.save_answer(lead.telegram_id, "pain", PAIN_OPTIONS["more_leads"])
        await self.storage.save_answer(lead.telegram_id, "intent", INTENT_OPTIONS["call"])
        lead = await self.storage.mark_call_requested(lead.telegram_id)
        self.assertTrue(should_notify_sales(lead))

        bot = FakeBot()
        sent = await notify_sales(
            bot=bot,  # type: ignore[arg-type]
            storage=self.storage,
            sales_chat_id=1001,
            lead=lead,
        )
        self.assertTrue(sent)
        self.assertEqual(len(bot.sent_messages), 1)
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "sales_notified"), 1)

    async def test_call_requested_notifies_all_sales_chats(self) -> None:
        lead = await self.create_lead()
        lead = await self.storage.mark_call_requested(lead.telegram_id)
        bot = FakeBot()

        sent = await notify_sales(
            bot=bot,  # type: ignore[arg-type]
            storage=self.storage,
            sales_chat_ids=(1001, 1002, 1003),
            lead=lead,
        )

        self.assertTrue(sent)
        self.assertEqual([message["chat_id"] for message in bot.sent_messages], [1001, 1002, 1003])
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "sales_notified"), 1)

    async def test_duplicate_call_requested_does_not_duplicate_sales_notification(self) -> None:
        lead = await self.create_lead()
        lead = await self.storage.mark_call_requested(lead.telegram_id)
        bot = FakeBot()

        first = await notify_sales(
            bot=bot,  # type: ignore[arg-type]
            storage=self.storage,
            sales_chat_id=1001,
            lead=lead,
        )
        fresh = await self.storage.get_lead(lead.telegram_id)
        self.assertIsNotNone(fresh)
        second = await notify_sales(
            bot=bot,  # type: ignore[arg-type]
            storage=self.storage,
            sales_chat_id=1001,
            lead=fresh,  # type: ignore[arg-type]
        )

        self.assertTrue(first)
        self.assertFalse(second)
        self.assertEqual(len(bot.sent_messages), 1)
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "sales_notification_duplicate_skipped"), 1)

    async def test_missing_sales_chat_saves_skipped_event(self) -> None:
        lead = await self.create_lead(username=None)
        lead = await self.storage.mark_call_requested(lead.telegram_id)
        bot = FakeBot()

        sent = await notify_sales(
            bot=bot,  # type: ignore[arg-type]
            storage=self.storage,
            sales_chat_id=None,
            lead=lead,
        )

        self.assertFalse(sent)
        self.assertEqual(bot.sent_messages, [])
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "sales_notification_skipped_no_sales_chat"), 1)

    async def test_sales_notification_failure_saves_safe_reason(self) -> None:
        lead = await self.create_lead()
        lead = await self.storage.mark_call_requested(lead.telegram_id)

        sent = await notify_sales(
            bot=FailingBot(),  # type: ignore[arg-type]
            storage=self.storage,
            sales_chat_id=1001,
            lead=lead,
        )

        self.assertFalse(sent)
        events = await self.storage.list_events(lead.telegram_id)
        failure_events = [event for event in events if event.event_type == "sales_notification_failed"]
        self.assertEqual(len(failure_events), 1)
        self.assertEqual(failure_events[0].event_payload["error_type"], "TelegramBadRequest")
        self.assertIn("chat not found", failure_events[0].event_payload["error_message"])

    async def test_reset_lead_allows_new_flow(self) -> None:
        lead = await self.create_lead()
        await self.storage.mark_call_requested(lead.telegram_id)

        reset_done = await self.storage.reset_lead_for_test(lead.telegram_id)
        self.assertTrue(reset_done)
        self.assertIsNone(await self.storage.get_lead(lead.telegram_id))

        new_lead = await self.create_lead("tg_tgk_post_0705_diagnostic")
        self.assertEqual(new_lead.cjm, "telegram_diagnostic")
        self.assertEqual(new_lead.lead_status, "started")

    async def test_concurrent_start_and_reset_do_not_raise(self) -> None:
        lead = await self.create_lead()
        await self.storage.mark_call_requested(lead.telegram_id)

        results = await asyncio.gather(
            self.storage.upsert_lead(
                telegram_id=lead.telegram_id,
                username="demo",
                first_name="Андрей",
                source=parse_start_payload(None),
            ),
            self.storage.reset_lead_for_test(lead.telegram_id),
            return_exceptions=True,
        )

        self.assertFalse(any(isinstance(result, Exception) for result in results))

    async def test_terminal_lead_keeps_original_andrey_attribution(self) -> None:
        lead = await self.create_lead("am_p01_video")
        await self.storage.mark_call_requested(lead.telegram_id)

        restarted = await self.storage.upsert_lead(
            telegram_id=lead.telegram_id,
            username="demo",
            first_name="Андрей",
            source=parse_start_payload("am_p02_map"),
        )

        self.assertEqual(restarted.raw_start_payload, "am_p01_video")
        self.assertEqual(restarted.latest_start_payload, "am_p02_map")
        self.assertEqual(restarted.source, "andrey_main")
        self.assertEqual(restarted.post_id, "p01")
        self.assertEqual(restarted.campaign, "andrey_main_p01")


if __name__ == "__main__":
    unittest.main()
