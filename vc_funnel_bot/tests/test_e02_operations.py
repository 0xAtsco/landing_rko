from __future__ import annotations

import tempfile
import unittest
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from bot.source_parser import parse_start_payload
from bot.storage import VcStorage


MOSCOW = ZoneInfo("Europe/Moscow")


class E02OperationsTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.storage = VcStorage(Path(self.tmp.name) / "bot.sqlite3", MOSCOW)
        await self.storage.connect()
        self.event = await self.storage.ensure_webinar_event(
            event_id="E02",
            title="Главный эфир",
            start_at=(datetime.now(MOSCOW) + timedelta(days=2)).isoformat(),
            join_url=None,
            replay_url=None,
        )
        self.event = await self.storage.update_webinar_event("E02", phase="registration")
        self.lead = await self.storage.upsert_lead(
            telegram_id=111,
            username="tester",
            first_name="Тест",
            source=parse_start_payload("youtube_hermes"),
        )

    async def asyncTearDown(self) -> None:
        await self.storage.close()
        self.tmp.cleanup()

    async def test_registration_creates_future_deduplicated_deliveries(self) -> None:
        registration, created = await self.storage.upsert_webinar_registration(
            event_id="E02", telegram_user_id=self.lead.telegram_id,
            telegram_chat_id=self.lead.telegram_id, username=self.lead.username,
            first_name=self.lead.first_name, source=self.lead.source,
            start_payload=self.lead.raw_start_payload, campaign=self.lead.campaign,
            post=self.lead.post_id, selected_route="offer", bottleneck="offer",
        )
        self.assertTrue(created)
        await self.storage.schedule_webinar_deliveries(
            event=self.event, telegram_user_id=registration.telegram_user_id,
            telegram_chat_id=registration.telegram_chat_id,
        )
        await self.storage.schedule_webinar_deliveries(
            event=self.event, telegram_user_id=registration.telegram_user_id,
            telegram_chat_id=registration.telegram_chat_id,
        )
        cursor = await self.storage.db.execute(
            "SELECT delivery_type FROM vc_funnel_webinar_deliveries ORDER BY delivery_type"
        )
        self.assertEqual([row["delivery_type"] for row in await cursor.fetchall()], ["15m", "24h", "3h", "start"])

    async def test_reschedule_versions_event_and_queues_notice(self) -> None:
        await self.storage.upsert_webinar_registration(
            event_id="E02", telegram_user_id=self.lead.telegram_id,
            telegram_chat_id=self.lead.telegram_id, username=self.lead.username,
            first_name=self.lead.first_name, source=self.lead.source,
            start_payload=self.lead.raw_start_payload, campaign=self.lead.campaign,
            post=self.lead.post_id, selected_route="offer", bottleneck="offer",
        )
        moved = await self.storage.reschedule_webinar_event(
            "E02", start_at=datetime.now(MOSCOW) + timedelta(days=4)
        )
        self.assertEqual(moved.event_version, 2)
        self.assertEqual(await self.storage.queue_reschedule_notices(moved), 1)
        self.assertEqual(await self.storage.queue_reschedule_notices(moved), 0)

    async def test_ticket_can_be_claimed_answered_and_closed(self) -> None:
        ticket = await self.storage.create_support_ticket(
            user_id=self.lead.telegram_id, telegram_chat_id=self.lead.telegram_id,
            username=self.lead.username, source=self.lead.source,
            topic="Как использовать материалы", message="С чего начать?",
            event_version=1, route_key="offer",
        )
        claimed = await self.storage.assign_support_ticket(ticket.id, 999)
        self.assertEqual(claimed.assigned_admin_id, 999)
        answered = await self.storage.answer_support_ticket(ticket.id, 999, "Начните с аудита.")
        self.assertEqual(answered.status, "answered")
        closed = await self.storage.close_support_ticket(ticket.id)
        self.assertEqual(closed.status, "closed")
