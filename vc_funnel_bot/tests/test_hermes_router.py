from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from zoneinfo import ZoneInfo

from bot.catalog.hermes import (
    HERMES_BUNDLES,
    HERMES_FLOW_SPEC,
    HERMES_GENERAL_CONTEXT_BY_CALLBACK,
    HERMES_PAYLOAD,
    HERMES_RESULT_TEXTS,
    HERMES_SETUP_CONTEXT_BY_CALLBACK,
    HERMES_STAGE_BY_CALLBACK,
)
from bot.config import Settings
from bot.handlers import (
    admin_preview_text,
    handle_review_context,
    handle_support_media,
    hermes_readiness_text,
    route_callback,
    route_entry,
)
from bot.source_parser import parse_start_payload
from bot.storage import VcStorage


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
        self.sent_photos: list[dict[str, object]] = []
        self.sent_documents: list[dict[str, object]] = []
        self.sent_videos: list[dict[str, object]] = []
        self.sent_animations: list[dict[str, object]] = []

    async def send_message(self, **kwargs):
        self.sent_messages.append(kwargs)
        return object()

    async def send_photo(self, **kwargs):
        self.sent_photos.append(kwargs)
        return object()

    async def send_document(self, **kwargs):
        self.sent_documents.append(kwargs)
        return object()

    async def send_video(self, **kwargs):
        self.sent_videos.append(kwargs)
        return object()

    async def send_animation(self, **kwargs):
        self.sent_animations.append(kwargs)
        return object()


def make_settings(*, sales_chat_id: int | None = None) -> Settings:
    timezone = ZoneInfo("Europe/Moscow")
    return Settings(
        bot_token="test-token",
        sqlite_path="./data/vc_funnel.db",
        database_url=None,
        sales_chat_id=sales_chat_id,
        sales_chat_ids=(sales_chat_id,) if sales_chat_id else (),
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
        bot_username="vc_test_bot",
        ux_typing_delay_test_mode=True,
    )


def button_data(screen: dict[str, object]) -> list[str | None]:
    markup = screen.get("reply_markup")
    if markup is None:
        return []
    return [
        button.callback_data
        for row in markup.inline_keyboard
        for button in row
    ]


class HermesRouterTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.storage = VcStorage(
            Path(self.tmp.name) / "vc_funnel.db",
            ZoneInfo("Europe/Moscow"),
        )
        await self.storage.connect()
        self.settings = make_settings()
        self.next_user_id = 1000

    async def asyncTearDown(self) -> None:
        await self.storage.close()
        self.tmp.cleanup()

    async def create_lead(self, payload: str = HERMES_PAYLOAD):
        self.next_user_id += 1
        return await self.storage.upsert_lead(
            telegram_id=self.next_user_id,
            username=f"user_{self.next_user_id}",
            first_name="Тест",
            source=parse_start_payload(payload),
        )

    async def complete(
        self,
        lead,
        stage_callback: str,
        context_callback: str,
        renderer: FakeRenderer,
    ):
        await route_callback(
            renderer,
            self.storage,
            self.settings,
            lead,
            stage_callback,
            None,
        )
        lead = await self.storage.get_lead(lead.telegram_id)
        await route_callback(
            renderer,
            self.storage,
            self.settings,
            lead,
            context_callback,
            None,
        )
        return await self.storage.get_lead(lead.telegram_id)

    async def load_materials(self, *material_keys: str) -> None:
        for material_key in material_keys:
            await self.storage.upsert_material(
                material_key=material_key,
                title=material_key,
                body=f"body:{material_key}",
            )

    def test_flow_spec_is_the_runtime_source_of_truth(self) -> None:
        spec_path = (
            Path(__file__).resolve().parents[1]
            / "material_packs"
            / "hermes_first_audit"
            / "bot_flow_spec.json"
        )
        spec = json.loads(spec_path.read_text(encoding="utf-8"))
        self.assertEqual(spec, HERMES_FLOW_SPEC)
        self.assertEqual(
            HERMES_STAGE_BY_CALLBACK,
            {
                item["callback"]: item["pain"]
                for item in spec["question_1"]["options"]
            },
        )
        self.assertEqual(
            HERMES_GENERAL_CONTEXT_BY_CALLBACK,
            {
                item["callback"]: item["segment"]
                for item in spec["question_2_general"]["options"]
            },
        )
        self.assertEqual(
            HERMES_SETUP_CONTEXT_BY_CALLBACK,
            {
                item["callback"]: item["segment"]
                for item in spec["question_2_setup"]["options"]
            },
        )
        self.assertEqual(
            HERMES_BUNDLES,
            {
                key: tuple(value)
                for key, value in spec["bundles"].items()
            },
        )

    async def test_known_payload_opens_hermes_without_notification(self) -> None:
        source = parse_start_payload(HERMES_PAYLOAD)
        self.assertEqual(source.entry_mode, "hermes_bottleneck")
        self.assertEqual(source.cta_type, "bottleneck_route")
        self.assertEqual(source.cjm, "hermes_bottleneck")
        self.assertEqual(source.campaign, "hermes_video")

        lead = await self.create_lead()
        renderer = FakeRenderer()
        await route_entry(
            renderer, self.storage, self.settings, lead  # type: ignore[arg-type]
        )

        self.assertIn("Где вы сейчас застряли?", renderer.screens[-1]["text"])
        self.assertEqual(
            button_data(renderer.screens[-1]),
            list(HERMES_STAGE_BY_CALLBACK),
        )
        self.assertEqual(
            await self.storage.count_events(
                lead.telegram_id, "hermes_route_started"
            ),
            1,
        )
        self.assertEqual(
            await self.storage.count_events(
                lead.telegram_id, "sales_notified"
            ),
            0,
        )

    async def test_second_question_depends_on_stage(self) -> None:
        for stage, expected_text, expected_callbacks in (
            (
                "hb:stage:find",
                "Что у вас уже есть?",
                list(HERMES_GENERAL_CONTEXT_BY_CALLBACK),
            ),
            (
                "hb:stage:setup",
                "На каком этапе возникла проблема?",
                list(HERMES_SETUP_CONTEXT_BY_CALLBACK),
            ),
        ):
            with self.subTest(stage=stage):
                lead = await self.create_lead()
                renderer = FakeRenderer()
                await route_callback(
                    renderer,
                    self.storage,
                    self.settings,
                    lead,
                    stage,
                    None,
                )
                self.assertEqual(renderer.screens[-1]["text"], expected_text)
                self.assertEqual(
                    button_data(renderer.screens[-1]),
                    expected_callbacks,
                )
                self.assertEqual(
                    await self.storage.count_events(
                        lead.telegram_id, "sales_notified"
                    ),
                    0,
                )

    async def test_all_five_results_and_tracks(self) -> None:
        cases = (
            (
                "hb:stage:find",
                "hb:asset:warm",
                "find_business",
                HERMES_RESULT_TEXTS["find_business"],
            ),
            (
                "hb:stage:offer",
                "hb:asset:rko",
                "offer",
                HERMES_RESULT_TEXTS["offer"],
            ),
            (
                "hb:stage:build",
                "hb:asset:channel",
                "build",
                HERMES_RESULT_TEXTS["build"],
            ),
            (
                "hb:stage:deal",
                "hb:asset:none",
                "deal",
                HERMES_RESULT_TEXTS["deal"],
            ),
            (
                "hb:stage:setup",
                "hb:setup:windows",
                "setup_windows",
                "Видео для этого этапа пока не загружено.",
            ),
        )
        for stage, context, track, expected_result in cases:
            with self.subTest(track=track):
                lead = await self.create_lead()
                renderer = FakeRenderer()
                fresh = await self.complete(
                    lead, stage, context, renderer
                )
                result_screens = [
                    screen
                    for screen in renderer.screens
                    if screen.get("persistent")
                ]
                self.assertIn(expected_result, result_screens[-1]["text"])
                self.assertEqual(fresh.intent, track)
                self.assertEqual(
                    await self.storage.count_events(
                        lead.telegram_id, "hermes_route_completed"
                    ),
                    1,
                )
                self.assertEqual(
                    button_data(renderer.screens[-1]),
                    ["hb:channel", "hb:apply"],
                )

    async def test_bundle_order_partial_missing_and_persistent_files(self) -> None:
        await self.load_materials(
            "hermes_audit_kit",
            "hermes_audit_workbook",
        )
        lead = await self.create_lead()
        renderer = FakeRenderer()
        await self.complete(
            lead,
            "hb:stage:build",
            "hb:asset:warm",
            renderer,
        )

        self.assertEqual(
            [
                item["material"].material_key
                for item in renderer.materials
            ],
            ["hermes_audit_kit", "hermes_audit_workbook"],
        )
        self.assertTrue(
            all(item["persistent"] for item in renderer.materials)
        )
        events = await self.storage.list_events(lead.telegram_id)
        deliveries = [
            event.event_payload
            for event in events
            if event.event_type == "hermes_material_delivered"
        ]
        self.assertEqual(
            [item["material_key"] for item in deliveries],
            list(HERMES_BUNDLES["build"]),
        )
        self.assertEqual(
            [item["delivery_status"] for item in deliveries],
            ["delivered", "missing", "delivered"],
        )

    async def test_channel_click_and_apply_semantics(self) -> None:
        lead = await self.create_lead()
        renderer = FakeRenderer()
        lead = await self.complete(
            lead,
            "hb:stage:offer",
            "hb:asset:rko",
            renderer,
        )

        await route_callback(
            renderer,
            self.storage,
            self.settings,
            lead,
            "hb:channel",
            None,
        )
        channel_lead = await self.storage.get_lead(lead.telegram_id)
        self.assertFalse(channel_lead.call_requested)
        self.assertFalse(channel_lead.private_channel_sent)
        self.assertEqual(
            await self.storage.count_events(
                lead.telegram_id, "hermes_channel_clicked"
            ),
            1,
        )

        await route_callback(
            renderer,
            self.storage,
            self.settings,
            channel_lead,
            "hb:apply",
            None,
        )
        apply_lead = await self.storage.get_lead(lead.telegram_id)
        self.assertEqual(apply_lead.intent, "apply")
        self.assertEqual(
            apply_lead.lead_status, "review_context_requested"
        )
        self.assertEqual(
            await self.storage.count_events(
                lead.telegram_id, "sales_notified"
            ),
            0,
        )
        self.assertIn("Опишите в 3 пунктах", renderer.screens[-1]["text"])

    async def test_apply_notifies_once_only_after_text_context(self) -> None:
        settings = make_settings(sales_chat_id=5001)
        lead = await self.create_lead()
        renderer = FakeRenderer()
        await route_callback(
            renderer,
            self.storage,
            settings,
            lead,
            "hb:stage:deal",
            None,
        )
        lead = await self.storage.get_lead(lead.telegram_id)
        await route_callback(
            renderer,
            self.storage,
            settings,
            lead,
            "hb:asset:warm",
            None,
        )
        lead = await self.storage.get_lead(lead.telegram_id)
        await route_callback(
            renderer,
            self.storage,
            settings,
            lead,
            "hb:apply",
            None,
        )
        lead = await self.storage.get_lead(lead.telegram_id)
        self.assertEqual(
            await self.storage.count_events(
                lead.telegram_id, "sales_notified"
            ),
            0,
        )

        bot = FakeBot()
        await handle_review_context(  # type: ignore[arg-type]
            renderer,
            bot,
            self.storage,
            settings,
            lead,
            "Компания: тест. Проблема: паузы. Собран отчёт.",
        )
        self.assertEqual(len(bot.sent_messages), 1)
        fresh = await self.storage.get_lead(lead.telegram_id)
        await handle_review_context(  # type: ignore[arg-type]
            renderer,
            bot,
            self.storage,
            settings,
            fresh,
            "Дополнение.",
        )
        self.assertEqual(len(bot.sent_messages), 1)
        self.assertEqual(
            await self.storage.count_events(
                lead.telegram_id, "sales_notified"
            ),
            1,
        )

    async def test_setup_support_accepts_screenshot_and_marks_support(self) -> None:
        settings = make_settings(sales_chat_id=5001)
        lead = await self.create_lead()
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
            "hb:setup:model",
            None,
        )
        lead = await self.storage.get_lead(lead.telegram_id)
        await route_callback(
            renderer,
            self.storage,
            settings,
            lead,
            "hb:apply",
            None,
        )
        lead = await self.storage.get_lead(lead.telegram_id)
        self.assertEqual(lead.intent, "setup_support")

        message = SimpleNamespace(
            photo=[SimpleNamespace(file_id="photo-1")],
            document=None,
            caption="Модель не подключается после выбора провайдера.",
        )
        bot = FakeBot()
        await handle_support_media(  # type: ignore[arg-type]
            renderer,
            bot,
            self.storage,
            settings,
            lead,
            message,
        )
        fresh = await self.storage.get_lead(lead.telegram_id)
        self.assertFalse(fresh.call_requested)
        self.assertTrue(fresh.sales_notified)
        self.assertEqual(len(bot.sent_messages), 1)
        self.assertIn(
            "обращение в поддержку Hermes",
            bot.sent_messages[0]["text"],
        )
        self.assertEqual(len(bot.sent_photos), 1)

        await handle_support_media(  # type: ignore[arg-type]
            renderer,
            bot,
            self.storage,
            settings,
            fresh,
            message,
        )
        self.assertEqual(len(bot.sent_messages), 1)
        self.assertEqual(len(bot.sent_photos), 1)
        appended = await self.storage.get_lead(lead.telegram_id)
        self.assertIn("Дополнение:", appended.application_context)

    async def test_unknown_callback_and_attribution_lock_are_safe(self) -> None:
        lead = await self.create_lead()
        renderer = FakeRenderer()
        await route_callback(
            renderer,
            self.storage,
            self.settings,
            lead,
            "hb:unknown",
            None,
        )
        self.assertIn("Где вы сейчас застряли?", renderer.screens[-1]["text"])
        self.assertEqual(
            await self.storage.count_events(
                lead.telegram_id, "unknown_hermes_callback"
            ),
            1,
        )

        await self.storage.mark_call_requested(lead.telegram_id)
        restarted = await self.storage.upsert_lead(
            telegram_id=lead.telegram_id,
            username="updated",
            first_name="Тест",
            source=parse_start_payload("am_p01_video"),
        )
        self.assertEqual(restarted.raw_start_payload, HERMES_PAYLOAD)
        self.assertEqual(restarted.cjm, "hermes_bottleneck")
        self.assertEqual(restarted.latest_start_payload, "am_p01_video")

    async def test_preview_readiness_and_stats(self) -> None:
        await self.load_materials("hermes_find_business_guide")
        await self.storage.upsert_material(
            material_key="hermes_setup_windows_video",
            title="Windows",
            body="video",
        )
        await self.storage.delete_material("hermes_setup_windows_video")

        preview = await admin_preview_text(
            self.storage, self.settings, HERMES_PAYLOAD
        )
        self.assertIn("Где вы сейчас застряли?", preview)
        self.assertIsNone(await self.storage.get_lead(999999))

        readiness = await hermes_readiness_text(
            self.storage, self.settings
        )
        self.assertIn("hermes_find_business_guide: loaded", readiness)
        self.assertIn("hermes_setup_windows_video: inactive", readiness)
        self.assertIn("hermes_setup_macos_video: missing", readiness)

        lead = await self.create_lead()
        await self.storage.add_event(
            lead.telegram_id, "hermes_route_started"
        )
        await self.storage.add_event(
            lead.telegram_id, "hermes_route_started"
        )
        stats = await self.storage.stats()
        self.assertIn(
            ("hermes_route_started", 1),
            stats["hermes_funnel"],
        )


if __name__ == "__main__":
    unittest.main()
