from __future__ import annotations

import asyncio
import os
import sqlite3
import tempfile
import unittest
from dataclasses import replace
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import patch
from zoneinfo import ZoneInfo

from bot.catalog.hermes import (
    HERMES_PERSONAL_PLAN_STEPS,
    hermes_personal_plan_text,
)
from bot.config import Settings, load_settings
from bot.handlers import route_callback, route_entry, webinar_admin_text
from bot.reminders import (
    current_reminder_type,
    send_due_webinar_reminders,
)
from bot.source_parser import parse_start_payload
from bot.storage import VcStorage
from bot.webinar import webinar_phase


MOSCOW = ZoneInfo("Europe/Moscow")
EVENT_START = datetime(2026, 8, 3, 19, 0, tzinfo=MOSCOW)
EVENT_END = datetime(2026, 8, 3, 20, 0, tzinfo=MOSCOW)


class FakeRenderer:
    def __init__(self) -> None:
        self.screens: list[dict[str, object]] = []
        self.materials: list[dict[str, object]] = []

    async def render_screen(self, **kwargs):
        self.screens.append(kwargs)
        return object()

    async def render_material(self, **kwargs):
        self.materials.append(kwargs)
        return object()


class FakeBot:
    def __init__(self) -> None:
        self.sent_messages: list[dict[str, object]] = []

    async def send_message(self, **kwargs):
        self.sent_messages.append(kwargs)
        return object()


def make_settings(
    *,
    mode: str = "webinar",
    enabled: bool = True,
    start: datetime = EVENT_START,
    end: datetime = EVENT_END,
    join_url: str | None = None,
    replay_url: str | None = None,
) -> Settings:
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
        funnel_end_mode=mode,
        webinar_enabled=enabled,
        webinar_event_id="E02",
        webinar_title="Где находить новых клиентов на РКО",
        webinar_start_at=start,
        webinar_end_at=end,
        webinar_timezone_name="Europe/Moscow",
        webinar_timezone=MOSCOW,
        webinar_join_url=join_url,
        webinar_replay_url=replay_url,
    )


def callback_data(screen: dict[str, object]) -> list[str | None]:
    markup = screen.get("reply_markup")
    if markup is None:
        return []
    return [
        button.callback_data
        for row in markup.inline_keyboard
        for button in row
    ]


class WebinarPureRulesTest(unittest.TestCase):
    def test_direct_registration_payload_has_expected_attribution(self) -> None:
        source = parse_start_payload("am_e02_register_1608")
        self.assertEqual(source.source, "andrey_main")
        self.assertEqual(source.campaign, "e02_1608_announcement")
        self.assertEqual(source.post_id, "e02_announcement_1608")
        self.assertEqual(source.entry_mode, "webinar_registration")

    def test_env_parser_requires_aware_webinar_datetimes(self) -> None:
        env = {
            "VC_BOT_TOKEN": "test-token",
            "VC_FUNNEL_END_MODE": "webinar",
            "VC_WEBINAR_ENABLED": "true",
            "VC_WEBINAR_EVENT_ID": "E02",
            "VC_WEBINAR_TITLE": "Тест",
            "VC_WEBINAR_START_AT": "2026-08-03T19:00:00",
            "VC_WEBINAR_END_AT": "2026-08-03T20:00:00+03:00",
            "VC_WEBINAR_TIMEZONE": "Europe/Moscow",
        }
        with patch.dict(os.environ, env):
            with self.assertRaisesRegex(
                RuntimeError,
                "VC_WEBINAR_START_AT must include a UTC offset",
            ):
                load_settings()

    def test_env_parser_normalizes_to_moscow(self) -> None:
        env = {
            "VC_BOT_TOKEN": "test-token",
            "VC_FUNNEL_END_MODE": "webinar",
            "VC_WEBINAR_ENABLED": "true",
            "VC_WEBINAR_EVENT_ID": "E02",
            "VC_WEBINAR_TITLE": "Тест",
            "VC_WEBINAR_START_AT": "2026-08-03T16:00:00+00:00",
            "VC_WEBINAR_END_AT": "2026-08-03T17:00:00+00:00",
            "VC_WEBINAR_TIMEZONE": "Europe/Moscow",
        }
        with patch.dict(os.environ, env):
            settings = load_settings()
        self.assertEqual(settings.webinar_start_at, EVENT_START)
        self.assertEqual(settings.webinar_end_at, EVENT_END)

    def test_env_parser_rejects_non_moscow_webinar_timezone(self) -> None:
        env = {
            "VC_BOT_TOKEN": "test-token",
            "VC_WEBINAR_TIMEZONE": "UTC",
        }
        with patch.dict(os.environ, env):
            with self.assertRaisesRegex(
                RuntimeError,
                "VC_WEBINAR_TIMEZONE must be Europe/Moscow",
            ):
                load_settings()

    def test_env_parser_rejects_unsafe_event_id(self) -> None:
        env = {
            "VC_BOT_TOKEN": "test-token",
            "VC_WEBINAR_EVENT_ID": "E02 with spaces",
        }
        with patch.dict(os.environ, env):
            with self.assertRaisesRegex(
                RuntimeError,
                "VC_WEBINAR_EVENT_ID",
            ):
                load_settings()

    def test_phase_state_machine(self) -> None:
        settings = make_settings()
        self.assertEqual(
            webinar_phase(
                settings,
                now=EVENT_START - timedelta(minutes=1),
            ),
            "registration",
        )
        self.assertEqual(
            webinar_phase(
                settings,
                now=EVENT_START + timedelta(minutes=1),
            ),
            "live",
        )
        self.assertEqual(
            webinar_phase(
                settings,
                now=EVENT_END + timedelta(minutes=1),
            ),
            "replay",
        )
        self.assertEqual(
            webinar_phase(
                replace(settings, webinar_replay_url="https://example.com/replay"),
                now=EVENT_END + timedelta(minutes=1),
            ),
            "replay",
        )
        self.assertEqual(
            webinar_phase(replace(settings, webinar_enabled=False)),
            "disabled",
        )
        self.assertEqual(
            webinar_phase(replace(settings, funnel_end_mode="personal_plan")),
            "personal_plan",
        )

    def test_each_route_has_exactly_three_actions(self) -> None:
        self.assertEqual(
            set(HERMES_PERSONAL_PLAN_STEPS),
            {"find_business", "offer", "build", "deal", "setup_help"},
        )
        for pain in ("find_business", "offer", "build", "deal", "setup"):
            with self.subTest(pain=pain):
                text = hermes_personal_plan_text(pain, "no_asset")
                numbered = [
                    line
                    for line in text.splitlines()
                    if line.startswith(("1. ", "2. ", "3. "))
                ]
                self.assertEqual(len(numbered), 3)

    def test_only_current_reminder_window_is_selected(self) -> None:
        settings = make_settings()
        self.assertIsNone(
            current_reminder_type(
                settings,
                now=EVENT_START - timedelta(hours=25),
            )
        )
        self.assertEqual(
            current_reminder_type(
                settings,
                now=EVENT_START - timedelta(hours=20),
            ),
            "24h",
        )
        self.assertEqual(
            current_reminder_type(
                settings,
                now=EVENT_START - timedelta(hours=2),
            ),
            "3h",
        )
        self.assertEqual(
            current_reminder_type(
                settings,
                now=EVENT_START - timedelta(minutes=10),
            ),
            "15m",
        )
        self.assertIsNone(
            current_reminder_type(
                settings,
                now=EVENT_START + timedelta(seconds=1),
            )
        )


class WebinarStorageAndFlowTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.db_path = Path(self.tmp.name) / "vc_funnel.db"
        self.storage = VcStorage(self.db_path, MOSCOW)
        await self.storage.connect()
        self.next_user_id = 8000

    async def asyncTearDown(self) -> None:
        await self.storage.close()
        self.tmp.cleanup()

    async def create_lead(self, payload: str = "youtube_hermes"):
        self.next_user_id += 1
        return await self.storage.upsert_lead(
            telegram_id=self.next_user_id,
            username=f"user_{self.next_user_id}",
            first_name="Тест",
            source=parse_start_payload(payload),
        )

    async def complete_business_route(
        self,
        lead,
        settings: Settings,
        renderer: FakeRenderer,
    ):
        await route_callback(
            renderer,
            self.storage,
            settings,
            lead,
            "hb:stage:offer",
            None,
        )
        lead = await self.storage.get_lead(lead.telegram_id)
        await route_callback(
            renderer,
            self.storage,
            settings,
            lead,
            "hb:asset:rko",
            None,
        )
        return await self.storage.get_lead(lead.telegram_id)

    async def test_additive_migration_preserves_existing_events(self) -> None:
        other_tmp = tempfile.TemporaryDirectory()
        path = Path(other_tmp.name) / "legacy.db"
        connection = sqlite3.connect(path)
        connection.executescript(
            """
            CREATE TABLE vc_funnel_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                telegram_id INTEGER,
                event_type TEXT NOT NULL,
                event_payload_json TEXT,
                created_at TEXT NOT NULL
            );
            INSERT INTO vc_funnel_events (
                telegram_id, event_type, event_payload_json, created_at
            ) VALUES (1, 'legacy_event', '{}', '2026-07-27T10:00:00');
            """
        )
        connection.commit()
        connection.close()

        storage = VcStorage(path, MOSCOW)
        await storage.connect()
        events = await storage.list_recent_events()
        registration = await storage.get_webinar_registration("E02", 1)
        await storage.close()
        other_tmp.cleanup()

        self.assertEqual(events[0].event_type, "legacy_event")
        self.assertIsNone(registration)

    async def test_registration_upsert_preserves_first_registration(self) -> None:
        lead = await self.create_lead()
        registration, created = await self.storage.upsert_webinar_registration(
            event_id="E02",
            telegram_user_id=lead.telegram_id,
            telegram_chat_id=lead.telegram_id,
            username=lead.username,
            first_name=lead.first_name,
            source=lead.source,
            start_payload=lead.raw_start_payload,
            campaign=lead.campaign,
            post=lead.post_id,
            selected_route="offer",
            bottleneck="offer",
        )
        self.assertTrue(created)
        first_registered_at = registration.registered_at
        await self.storage.mark_webinar_reminder_sent(
            "E02",
            lead.telegram_id,
            "24h",
        )

        registration, created = await self.storage.upsert_webinar_registration(
            event_id="E02",
            telegram_user_id=lead.telegram_id,
            telegram_chat_id=9999,
            username="updated",
            first_name=lead.first_name,
            source=lead.source,
            start_payload=lead.raw_start_payload,
            campaign=lead.campaign,
            post=lead.post_id,
            selected_route="deal",
            bottleneck="deal",
        )
        self.assertFalse(created)
        self.assertEqual(registration.registered_at, first_registered_at)
        self.assertEqual(registration.telegram_chat_id, 9999)
        self.assertEqual(registration.selected_route, "offer")
        self.assertIsNotNone(registration.reminder_24h_sent_at)

    async def test_webinar_flow_registers_once_with_attribution(self) -> None:
        settings = make_settings(
            start=datetime.now(MOSCOW) + timedelta(hours=2),
            end=datetime.now(MOSCOW) + timedelta(hours=3),
        )
        lead = await self.create_lead("youtube_hermes")
        renderer = FakeRenderer()
        lead = await self.complete_business_route(lead, settings, renderer)

        self.assertEqual(callback_data(renderer.screens[-1]), ["hb:playbook"])

        await route_callback(
            renderer,
            self.storage,
            settings,
            lead,
            "hb:playbook",
            None,
        )
        self.assertIn("hb:webinar:register", callback_data(renderer.screens[-1]))

        await route_callback(
            renderer,
            self.storage,
            settings,
            lead,
            "hb:webinar:register",
            None,
        )
        registration = await self.storage.get_webinar_registration(
            "E02",
            lead.telegram_id,
        )
        self.assertIsNotNone(registration)
        self.assertEqual(registration.source, "youtube")
        self.assertEqual(registration.start_payload, "youtube_hermes")
        self.assertEqual(registration.selected_route, "offer")
        self.assertEqual(
            await self.storage.count_events(
                lead.telegram_id,
                "webinar_registered",
            ),
            1,
        )
        self.assertNotIn("hb:webinar:calendar", callback_data(renderer.screens[-1]))
        self.assertIn("hb:materials", callback_data(renderer.screens[-1]))

        await route_callback(
            renderer,
            self.storage,
            settings,
            lead,
            "hb:webinar:register",
            None,
        )
        self.assertEqual(
            await self.storage.count_events(
                lead.telegram_id,
                "webinar_already_registered",
            ),
            1,
        )
        self.assertIn(
            "уже зарегистрированы",
            str(renderer.screens[-1]["text"]),
        )

    async def test_direct_entry_registers_with_last_touch_and_keeps_first_touch(self) -> None:
        start = (datetime.now(MOSCOW) + timedelta(days=2)).replace(
            minute=0,
            second=0,
            microsecond=0,
        )
        settings = make_settings(start=start, end=start + timedelta(hours=1))
        await self.storage.ensure_webinar_event(
            event_id="E02",
            title=settings.webinar_title or "Эфир E02",
            start_at=start.isoformat(),
        )
        await self.storage.update_webinar_event("E02", phase="registration")
        lead = await self.create_lead("youtube_hermes")
        first_touch = (lead.source, lead.raw_start_payload, lead.campaign)
        lead = await self.storage.upsert_lead(
            telegram_id=lead.telegram_id,
            username=lead.username,
            first_name=lead.first_name,
            source=parse_start_payload("am_e02_register_1608"),
        )
        renderer = FakeRenderer()

        await route_entry(renderer, self.storage, settings, lead)

        self.assertEqual(
            callback_data(renderer.screens[-1]),
            ["hb:webinar:register"],
        )
        self.assertIn(
            start.strftime("%d.%m.%Y в %H:%M МСК"),
            str(renderer.screens[-1]["text"]),
        )
        self.assertEqual(
            (lead.source, lead.raw_start_payload, lead.campaign),
            first_touch,
        )

        await route_callback(
            renderer,
            self.storage,
            settings,
            lead,
            "hb:webinar:register",
            None,
        )
        registration = await self.storage.get_webinar_registration("E02", lead.telegram_id)
        self.assertIsNotNone(registration)
        self.assertEqual(registration.source, "andrey_main")
        self.assertEqual(registration.start_payload, "am_e02_register_1608")
        self.assertEqual(registration.campaign, "e02_1608_announcement")
        self.assertEqual(registration.post, "e02_announcement_1608")
        self.assertEqual(callback_data(renderer.screens[-1]), [])
        self.assertNotIn("3 августа", str(renderer.screens[-1]["text"]))

        deliveries = await (
            await self.storage.db.execute(
                "SELECT COUNT(*) AS total FROM vc_funnel_webinar_deliveries WHERE event_id = 'E02' AND telegram_user_id = ?",
                (lead.telegram_id,),
            )
        ).fetchone()
        self.assertEqual(int(deliveries["total"]), 4)

        await route_callback(
            renderer,
            self.storage,
            settings,
            lead,
            "hb:webinar:register",
            None,
        )
        deliveries = await (
            await self.storage.db.execute(
                "SELECT COUNT(*) AS total FROM vc_funnel_webinar_deliveries WHERE event_id = 'E02' AND telegram_user_id = ?",
                (lead.telegram_id,),
            )
        ).fetchone()
        self.assertEqual(int(deliveries["total"]), 4)
        self.assertIn("Вы уже зарегистрированы", str(renderer.screens[-1]["text"]))

        await route_callback(
            renderer,
            self.storage,
            settings,
            lead,
            "hb:webinar:calendar",
            None,
        )
        self.assertEqual(callback_data(renderer.screens[-1]), [])
        self.assertNotIn("calendar", str(renderer.screens[-1]).lower())
        self.assertEqual(
            await self.storage.count_events(
                lead.telegram_id,
                "webinar_calendar_legacy_clicked",
            ),
            1,
        )

        stats = await self.storage.webinar_stats("E02")
        campaign_stats = stats["e02_1608_announcement"]
        self.assertEqual(campaign_stats["entries"], 1)
        self.assertEqual(campaign_stats["cards"], 1)
        self.assertEqual(campaign_stats["registrations"], 1)
        self.assertEqual(campaign_stats["conversion"], 1.0)

    async def test_direct_entry_existing_registration_and_closed_phase(self) -> None:
        start = datetime(2026, 8, 16, 19, 0, tzinfo=MOSCOW)
        settings = make_settings(start=start, end=start + timedelta(hours=1))
        await self.storage.ensure_webinar_event(
            event_id="E02",
            title=settings.webinar_title or "Эфир E02",
            start_at=start.isoformat(),
        )
        await self.storage.update_webinar_event("E02", phase="registration")
        lead = await self.create_lead("am_e02_register_1608")
        await self.storage.upsert_webinar_registration(
            event_id="E02",
            telegram_user_id=lead.telegram_id,
            telegram_chat_id=lead.telegram_id,
            username=lead.username,
            first_name=lead.first_name,
            source="andrey_main",
            start_payload="am_e02_register_1608",
            campaign="e02_1608_announcement",
            post="e02_announcement_1608",
            selected_route=None,
            bottleneck=None,
        )
        renderer = FakeRenderer()
        await route_entry(renderer, self.storage, settings, lead)
        self.assertIn("Вы уже зарегистрированы", str(renderer.screens[-1]["text"]))
        self.assertEqual(callback_data(renderer.screens[-1]), [])

        await self.storage.update_webinar_event("E02", phase="closed")
        unregistered = await self.create_lead("am_e02_register_1608")
        await route_entry(renderer, self.storage, settings, unregistered)
        self.assertIn("Регистрация на эфир сейчас закрыта", str(renderer.screens[-1]["text"]))
        self.assertNotIn("hb:webinar:register", callback_data(renderer.screens[-1]))

    async def test_concurrent_registration_callbacks_create_one_row(self) -> None:
        settings = make_settings(
            start=datetime.now(MOSCOW) + timedelta(hours=2),
            end=datetime.now(MOSCOW) + timedelta(hours=3),
        )
        lead = await self.create_lead("youtube_hermes")
        renderer = FakeRenderer()
        lead = await self.complete_business_route(lead, settings, renderer)

        await asyncio.gather(
            route_callback(
                FakeRenderer(),
                self.storage,
                settings,
                lead,
                "hb:webinar:register",
                None,
            ),
            route_callback(
                FakeRenderer(),
                self.storage,
                settings,
                lead,
                "hb:webinar:register",
                None,
            ),
        )

        stats = await self.storage.webinar_stats("E02")
        self.assertEqual(stats["registrations"], 1)
        self.assertEqual(
            await self.storage.count_events(
                lead.telegram_id,
                "webinar_registered",
            ),
            1,
        )
        self.assertEqual(
            await self.storage.count_events(
                lead.telegram_id,
                "webinar_already_registered",
            ),
            1,
        )

    async def test_telegram_user_keeps_telegram_attribution(self) -> None:
        settings = make_settings(
            start=datetime.now(MOSCOW) + timedelta(hours=2),
            end=datetime.now(MOSCOW) + timedelta(hours=3),
        )
        lead = await self.create_lead("telegram_hermes")
        renderer = FakeRenderer()
        lead = await self.complete_business_route(lead, settings, renderer)
        await route_callback(
            renderer,
            self.storage,
            settings,
            lead,
            "hb:webinar:register",
            None,
        )
        registration = await self.storage.get_webinar_registration(
            "E02",
            lead.telegram_id,
        )
        self.assertEqual(registration.source, "telegram")
        self.assertEqual(registration.start_payload, "telegram_hermes")

    async def test_disabled_mode_shows_plan_without_final_cta(self) -> None:
        settings = make_settings(mode="disabled")
        lead = await self.create_lead()
        renderer = FakeRenderer()
        await self.complete_business_route(lead, settings, renderer)
        self.assertEqual(callback_data(renderer.screens[-1]), ["hb:playbook"])
        self.assertFalse(
            any(
                "hb:webinar:register" in callback_data(screen)
                for screen in renderer.screens
            )
        )
        self.assertFalse(
            any(
                "hb:plan" in callback_data(screen)
                for screen in renderer.screens
            )
        )

    async def test_personal_plan_mode_keeps_sales_handoff(self) -> None:
        settings = make_settings(mode="personal_plan")
        lead = await self.create_lead()
        renderer = FakeRenderer()
        lead = await self.complete_business_route(lead, settings, renderer)
        self.assertEqual(callback_data(renderer.screens[-1]), ["hb:playbook"])

        await route_callback(
            renderer,
            self.storage,
            settings,
            lead,
            "hb:playbook",
            None,
        )
        self.assertEqual(callback_data(renderer.screens[-1]), ["hb:plan"])

        await route_callback(
            renderer,
            self.storage,
            settings,
            lead,
            "hb:plan",
            None,
        )
        fresh = await self.storage.get_lead(lead.telegram_id)
        self.assertEqual(fresh.lead_status, "application_started")

    async def test_live_user_registers_before_join_button_is_shown(self) -> None:
        now = datetime.now(MOSCOW)
        settings = make_settings(
            start=now - timedelta(minutes=10),
            end=now + timedelta(minutes=50),
            join_url="https://example.com/live",
        )
        lead = await self.create_lead()
        renderer = FakeRenderer()
        lead = await self.complete_business_route(lead, settings, renderer)
        await route_callback(
            renderer,
            self.storage,
            settings,
            lead,
            "hb:playbook",
            None,
        )
        self.assertEqual(
            callback_data(renderer.screens[-1])[0],
            "hb:webinar:register",
        )

        await route_callback(
            renderer,
            self.storage,
            settings,
            lead,
            "hb:webinar:register",
            None,
        )
        self.assertEqual(
            callback_data(renderer.screens[-1])[0],
            "hb:webinar:join",
        )

        await route_callback(
            renderer,
            self.storage,
            settings,
            lead,
            "hb:materials",
            None,
        )
        self.assertEqual(
            callback_data(renderer.screens[-1])[0],
            "hb:playbook",
        )

    async def test_setup_help_precedes_webinar_card(self) -> None:
        settings = make_settings(
            start=datetime.now(MOSCOW) + timedelta(hours=2),
            end=datetime.now(MOSCOW) + timedelta(hours=3),
        )
        lead = await self.create_lead("telegram_hermes")
        renderer = FakeRenderer()
        await route_callback(
            renderer,
            self.storage,
            settings,
            lead,
            "hb:stage:setup",
            None,
        )
        lead = await self.storage.get_lead(lead.telegram_id)
        await route_callback(
            renderer,
            self.storage,
            settings,
            lead,
            "hb:setup:windows",
            None,
        )
        plan_index = next(
            index
            for index, screen in enumerate(renderer.screens)
            if "план из трёх действий" in str(screen.get("text"))
        )
        help_index = next(
            index
            for index, screen in enumerate(renderer.screens)
            if callback_data(screen) == ["hb:setup_help"]
        )
        card_index = next(
            index
            for index, screen in enumerate(renderer.screens)
            if "hb:webinar:register" in callback_data(screen)
        )
        self.assertLess(plan_index, help_index)
        self.assertLess(help_index, card_index)

    async def test_replay_is_available_without_registration(self) -> None:
        settings = make_settings(
            mode="replay",
            replay_url="https://example.com/replay",
        )
        lead = await self.create_lead()
        renderer = FakeRenderer()
        await route_callback(
            renderer,
            self.storage,
            settings,
            lead,
            "hb:webinar:replay",
            None,
        )
        self.assertEqual(
            await self.storage.count_events(
                lead.telegram_id,
                "webinar_replay_clicked",
            ),
            1,
        )
        self.assertIsNone(
            await self.storage.get_webinar_registration(
                "E02",
                lead.telegram_id,
            )
        )
        markup = renderer.screens[-1]["reply_markup"]
        self.assertEqual(
            markup.inline_keyboard[0][0].url,
            "https://example.com/replay",
        )

    async def test_replay_without_url_shows_pending_state(self) -> None:
        settings = make_settings(mode="replay")
        lead = await self.create_lead()
        renderer = FakeRenderer()
        await self.complete_business_route(lead, settings, renderer)
        await route_callback(
            renderer,
            self.storage,
            settings,
            lead,
            "hb:playbook",
            None,
        )

        self.assertIn("Запись появится", str(renderer.screens[-1]["text"]))
        self.assertNotIn(
            "hb:webinar:replay",
            callback_data(renderer.screens[-1]),
        )

    async def test_admin_stats_and_events_do_not_contain_urls(self) -> None:
        settings = make_settings(
            start=datetime.now(MOSCOW) + timedelta(hours=2),
            end=datetime.now(MOSCOW) + timedelta(hours=3),
            join_url="https://secret.example/join",
            replay_url="https://secret.example/replay",
        )
        lead = await self.create_lead()
        await self.storage.add_event(
            lead.telegram_id,
            "webinar_card_shown",
            {
                "event_id": "E02",
                "source": "youtube",
                "route": "offer",
            },
        )
        await self.storage.upsert_webinar_registration(
            event_id="E02",
            telegram_user_id=lead.telegram_id,
            telegram_chat_id=lead.telegram_id,
            username=lead.username,
            first_name=lead.first_name,
            source="youtube",
            start_payload="youtube_hermes",
            campaign="hermes",
            post="hermes",
            selected_route="offer",
            bottleneck="offer",
        )
        text = await webinar_admin_text(self.storage, settings)
        self.assertIn("Зарегистрировались: 1", text)
        self.assertIn("Статус: Регистрация открыта", text)
        self.assertIn("Регистрации по источникам: YouTube: 1", text)
        self.assertNotIn("Join URL", text)
        self.assertNotIn("registration", text)
        self.assertNotIn("secret.example", text)
        events = await self.storage.list_events(lead.telegram_id)
        self.assertNotIn(
            "secret.example",
            repr([event.event_payload for event in events]),
        )

    async def test_reminders_survive_storage_restart_without_duplicates(self) -> None:
        settings = make_settings()
        lead = await self.create_lead()
        await self.storage.upsert_webinar_registration(
            event_id="E02",
            telegram_user_id=lead.telegram_id,
            telegram_chat_id=lead.telegram_id,
            username=lead.username,
            first_name=lead.first_name,
            source=lead.source,
            start_payload=lead.raw_start_payload,
            campaign=lead.campaign,
            post=lead.post_id,
            selected_route="offer",
            bottleneck="offer",
        )
        bot = FakeBot()
        now = EVENT_START - timedelta(hours=2)
        sent = await send_due_webinar_reminders(
            bot,  # type: ignore[arg-type]
            self.storage,
            settings,
            now=now,
        )
        self.assertEqual(sent, 1)
        self.assertEqual(len(bot.sent_messages), 1)

        await self.storage.close()
        self.storage = VcStorage(self.db_path, MOSCOW)
        await self.storage.connect()
        sent = await send_due_webinar_reminders(
            bot,  # type: ignore[arg-type]
            self.storage,
            settings,
            now=now,
        )
        self.assertEqual(sent, 0)
        self.assertEqual(len(bot.sent_messages), 1)

    async def test_reminder_timestamp_is_saved_after_delivery(self) -> None:
        settings = make_settings()
        lead = await self.create_lead()
        await self.storage.upsert_webinar_registration(
            event_id="E02",
            telegram_user_id=lead.telegram_id,
            telegram_chat_id=lead.telegram_id,
            username=lead.username,
            first_name=lead.first_name,
            source=lead.source,
            start_payload=lead.raw_start_payload,
            campaign=lead.campaign,
            post=lead.post_id,
            selected_route="offer",
            bottleneck="offer",
        )

        storage = self.storage

        class InspectingBot:
            marker_during_delivery: str | None = "not-read"

            async def send_message(self, **kwargs):
                del kwargs
                registration = await storage.get_webinar_registration(
                    "E02",
                    lead.telegram_id,
                )
                self.marker_during_delivery = (
                    registration.reminder_3h_sent_at
                    if registration is not None
                    else "missing"
                )
                return object()

        bot = InspectingBot()
        sent = await send_due_webinar_reminders(
            bot,  # type: ignore[arg-type]
            self.storage,
            settings,
            now=EVENT_START - timedelta(hours=2),
        )
        registration = await self.storage.get_webinar_registration(
            "E02",
            lead.telegram_id,
        )

        self.assertEqual(sent, 1)
        self.assertIsNone(bot.marker_during_delivery)
        self.assertIsNotNone(registration.reminder_3h_sent_at)

    async def test_15m_reminder_hides_missing_join_url(self) -> None:
        settings = make_settings()
        lead = await self.create_lead()
        await self.storage.upsert_webinar_registration(
            event_id="E02",
            telegram_user_id=lead.telegram_id,
            telegram_chat_id=lead.telegram_id,
            username=lead.username,
            first_name=lead.first_name,
            source=lead.source,
            start_payload=lead.raw_start_payload,
            campaign=lead.campaign,
            post=lead.post_id,
            selected_route="offer",
            bottleneck="offer",
        )
        bot = FakeBot()
        await send_due_webinar_reminders(
            bot,  # type: ignore[arg-type]
            self.storage,
            settings,
            now=EVENT_START - timedelta(minutes=10),
        )
        self.assertIsNone(bot.sent_messages[0]["reply_markup"])
        self.assertIn(
            "ссылка",
            str(bot.sent_messages[0]["text"]).lower(),
        )

    async def test_15m_reminder_can_reveal_configured_join_url(self) -> None:
        now = datetime.now(MOSCOW)
        settings = make_settings(
            start=now + timedelta(minutes=10),
            end=now + timedelta(hours=1, minutes=10),
            join_url="https://example.com/live",
        )
        lead = await self.create_lead()
        await self.storage.upsert_webinar_registration(
            event_id="E02",
            telegram_user_id=lead.telegram_id,
            telegram_chat_id=lead.telegram_id,
            username=lead.username,
            first_name=lead.first_name,
            source=lead.source,
            start_payload=lead.raw_start_payload,
            campaign=lead.campaign,
            post=lead.post_id,
            selected_route="offer",
            bottleneck="offer",
        )
        bot = FakeBot()
        await send_due_webinar_reminders(
            bot,  # type: ignore[arg-type]
            self.storage,
            settings,
            now=now,
        )
        markup = bot.sent_messages[0]["reply_markup"]
        self.assertEqual(
            markup.inline_keyboard[0][0].callback_data,
            "hb:webinar:join",
        )

        renderer = FakeRenderer()
        await route_callback(
            renderer,
            self.storage,
            settings,
            lead,
            "hb:webinar:join",
            None,
        )
        url_markup = renderer.screens[-1]["reply_markup"]
        self.assertEqual(
            url_markup.inline_keyboard[0][0].url,
            "https://example.com/live",
        )


if __name__ == "__main__":
    unittest.main()
