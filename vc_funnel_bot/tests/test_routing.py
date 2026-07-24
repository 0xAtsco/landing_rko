from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from zoneinfo import ZoneInfo

from bot.config import Settings
from bot.handlers import (
    contains_unsafe_data,
    handle_pain_selected,
    handle_review_context,
    handle_segment_selected,
    handle_vc_interest,
    route_callback,
    route_entry,
)
from bot.keyboards import (
    CALLBACK_ACCESS,
    CALLBACK_DIAGNOSTIC_START,
    CALLBACK_MAIN_VIDEO,
    CALLBACK_REVIEW,
    CALLBACK_VC_INTEREST_PREFIX,
)
from bot.source_parser import parse_start_payload
from bot.storage import VcStorage


class FakeRenderer:
    def __init__(self) -> None:
        self.screens: list[dict[str, object]] = []

    async def render_screen(self, **kwargs):
        self.screens.append(kwargs)
        return object()


class FakeBot:
    def __init__(self) -> None:
        self.sent_messages: list[dict[str, object]] = []

    async def send_message(self, **kwargs):
        self.sent_messages.append(kwargs)
        return object()


def make_settings(sales_chat_id: int | None = None) -> Settings:
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
        ux_typing_delay_test_mode=True,
    )


def button_texts(screen: dict[str, object]) -> list[str]:
    markup = screen.get("reply_markup")
    if markup is None:
        return []
    return [button.text for row in markup.inline_keyboard for button in row]


class RoutingTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.storage = VcStorage(Path(self.tmp.name) / "vc_funnel.db", ZoneInfo("Europe/Moscow"))
        await self.storage.connect()
        self.settings = make_settings()

    async def asyncTearDown(self) -> None:
        await self.storage.close()
        self.tmp.cleanup()

    async def create_lead(self, payload: str | None = None):
        return await self.storage.upsert_lead(
            telegram_id=777,
            username="vc_user",
            first_name="VC",
            source=parse_start_payload(payload),
        )

    async def test_materials_does_not_start_diagnostic(self) -> None:
        lead = await self.create_lead("yt_video_0704_description")
        renderer = FakeRenderer()

        await route_entry(renderer, self.storage, self.settings, lead)  # type: ignore[arg-type]
        fresh = await self.storage.get_lead(lead.telegram_id)

        self.assertEqual(len(renderer.screens), 1)
        text = str(renderer.screens[0]["text"])
        self.assertIn("Вот обещанный материал", text)
        self.assertNotIn("Что у вас уже есть?", text)
        self.assertEqual(fresh.lead_status, "materials_sent")  # type: ignore[union-attr]
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "diagnostic_started"), 0)
        self.assertEqual(
            button_texts(renderer.screens[0]),
            ["📲 Смотреть следующие разборы в канале", "🎯 Подобрать связку под мою ситуацию"],
        )

    async def test_diagnostic_starts_only_after_diagnostic_click(self) -> None:
        lead = await self.create_lead()
        renderer = FakeRenderer()

        await route_callback(
            renderer,  # type: ignore[arg-type]
            self.storage,
            self.settings,
            lead,  # type: ignore[arg-type]
            CALLBACK_DIAGNOSTIC_START,
            None,
        )

        self.assertEqual(str(renderer.screens[-1]["text"]), "Что у вас уже есть?")
        self.assertEqual(
            button_texts(renderer.screens[-1]),
            [
                "Работаю с РКО / финансовыми офферами",
                "Есть трафик, база или Telegram-канал",
                "Есть продукт, команда или отдел продаж",
                "Только начинаю",
            ],
        )
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "diagnostic_started"), 1)
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "route_started"), 1)

    async def test_result_does_not_auto_send_channel(self) -> None:
        lead = await self.create_lead()
        renderer = FakeRenderer()

        await route_callback(renderer, self.storage, self.settings, lead, CALLBACK_DIAGNOSTIC_START, None)  # type: ignore[arg-type]
        fresh = await self.storage.get_lead(lead.telegram_id)
        await handle_segment_selected(renderer, self.storage, fresh, "audience", None)  # type: ignore[arg-type]
        fresh = await self.storage.get_lead(lead.telegram_id)
        self.assertEqual(str(renderer.screens[-1]["text"]), "Что сейчас важнее всего?")
        await handle_pain_selected(renderer, self.storage, fresh, "automate_people", None)  # type: ignore[arg-type]
        fresh = await self.storage.get_lead(lead.telegram_id)

        self.assertEqual(fresh.lead_status, "review_context_requested")  # type: ignore[union-attr]
        self.assertFalse(fresh.private_channel_sent)  # type: ignore[union-attr]
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "private_channel_sent"), 0)
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "route_completed"), 1)
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "application_started"), 1)
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "sales_notified"), 0)
        self.assertIn("Опишите в 2–3 предложениях", str(renderer.screens[-1]["text"]))
        self.assertEqual(button_texts(renderer.screens[-1]), [])

    async def test_channel_sent_only_after_channel_click(self) -> None:
        lead = await self.create_lead()
        renderer = FakeRenderer()

        await route_callback(renderer, self.storage, self.settings, lead, CALLBACK_ACCESS, None)  # type: ignore[arg-type]
        fresh = await self.storage.get_lead(lead.telegram_id)

        self.assertEqual(fresh.lead_status, "private_channel_sent")  # type: ignore[union-attr]
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "diagnostic_started"), 0)
        self.assertIn("ИИ-связки | Андрей Фадеев", str(renderer.screens[-1]["text"]))
        self.assertEqual(button_texts(renderer.screens[-1]), ["📲 Перейти в канал"])
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "channel_cta_clicked"), 1)

    async def test_review_sales_only_after_context(self) -> None:
        lead = await self.create_lead()
        renderer = FakeRenderer()

        await route_callback(renderer, self.storage, self.settings, lead, CALLBACK_REVIEW, None)  # type: ignore[arg-type]
        fresh = await self.storage.get_lead(lead.telegram_id)

        self.assertEqual(fresh.lead_status, "review_context_requested")  # type: ignore[union-attr]
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "sales_notification_sent"), 0)

    async def test_channel_materials_no_sales(self) -> None:
        lead = await self.create_lead("ch_0706_agent_lost_leads_materials")
        renderer = FakeRenderer()

        await route_entry(renderer, self.storage, self.settings, lead)  # type: ignore[arg-type]

        self.assertIn("Держи материал к посту", str(renderer.screens[-1]["text"]))
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "channel_materials_requested"), 1)
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "sales_notification_sent"), 0)

    async def test_channel_call_waits_for_context(self) -> None:
        lead = await self.create_lead("ch_0706_agent_lost_leads_call")
        renderer = FakeRenderer()

        await route_entry(renderer, self.storage, self.settings, lead)  # type: ignore[arg-type]
        fresh = await self.storage.get_lead(lead.telegram_id)

        self.assertEqual(fresh.lead_status, "review_context_requested")  # type: ignore[union-attr]
        self.assertIn("Опишите в 2–3 предложениях", str(renderer.screens[-1]["text"]))
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "sales_notification_sent"), 0)

    async def test_want_vc_flow_sets_hot_context_request(self) -> None:
        lead = await self.create_lead("ch_0709_want_vc")
        renderer = FakeRenderer()

        await route_entry(renderer, self.storage, self.settings, lead)  # type: ignore[arg-type]
        fresh = await self.storage.get_lead(lead.telegram_id)
        await handle_vc_interest(renderer, self.storage, fresh, f"{CALLBACK_VC_INTEREST_PREFIX}mentor".rsplit(":", 1)[-1], None)  # type: ignore[arg-type]
        fresh = await self.storage.get_lead(lead.telegram_id)

        self.assertEqual(fresh.lead_status, "review_context_requested")  # type: ignore[union-attr]
        self.assertEqual(fresh.lead_temperature, "hot_sql")  # type: ignore[union-attr]
        self.assertIn("что хочешь получить от VC", str(renderer.screens[-1]["text"]))

    def test_unsafe_data_guard(self) -> None:
        self.assertTrue(contains_unsafe_data("номер карты 4111 1111 1111 1111"))
        self.assertTrue(contains_unsafe_data("паспорт и смс код"))
        self.assertFalse(contains_unsafe_data("хочу собрать бота для заявок"))

    async def test_andrey_material_opens_directly_with_two_actions(self) -> None:
        await self.storage.upsert_material(
            material_key="am_p01_video",
            title="Основное видео",
            url="https://example.com/video",
        )
        lead = await self.create_lead("am_p01_video")
        renderer = FakeRenderer()

        await route_entry(renderer, self.storage, self.settings, lead)  # type: ignore[arg-type]
        fresh = await self.storage.get_lead(lead.telegram_id)

        self.assertEqual(fresh.source, "andrey_main")  # type: ignore[union-attr]
        self.assertIn("Основное видео", str(renderer.screens[-1]["text"]))
        self.assertEqual(
            button_texts(renderer.screens[-1]),
            ["📲 Смотреть следующие разборы в канале", "🎯 Подобрать связку под мою ситуацию"],
        )
        material_markup = renderer.screens[-1]["reply_markup"]
        self.assertEqual(material_markup.inline_keyboard[0][0].url, "https://t.me/+invite")
        self.assertIsNone(material_markup.inline_keyboard[0][0].callback_data)
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "post_entry_started"), 1)
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "material_delivered"), 1)
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "sales_notified"), 0)

    async def test_andrey_apply_waits_for_context_then_notifies_sales(self) -> None:
        lead = await self.create_lead("am_p05_apply")
        renderer = FakeRenderer()
        settings = make_settings(sales_chat_id=1001)

        await route_entry(renderer, self.storage, settings, lead)  # type: ignore[arg-type]
        fresh = await self.storage.get_lead(lead.telegram_id)
        self.assertEqual(fresh.lead_status, "review_context_requested")  # type: ignore[union-attr]
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "application_started"), 1)
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "sales_notified"), 0)

        bot = FakeBot()
        await handle_review_context(  # type: ignore[arg-type]
            renderer,
            bot,
            self.storage,
            settings,
            fresh,
            "Есть Telegram-канал, но заявки теряются. Хочу собрать бота для обработки.",
        )
        submitted = await self.storage.get_lead(lead.telegram_id)
        self.assertTrue(submitted.sales_notified)  # type: ignore[union-attr]
        self.assertEqual(len(bot.sent_messages), 1)
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "application_context_submitted"), 1)
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "sales_notified"), 1)
        self.assertIn("Заявка передана команде", str(renderer.screens[-1]["text"]))

    async def test_andrey_route_uses_two_choices_then_requests_context(self) -> None:
        lead = await self.create_lead("am_p04_route")
        renderer = FakeRenderer()

        await route_entry(renderer, self.storage, self.settings, lead)  # type: ignore[arg-type]
        self.assertEqual(str(renderer.screens[-1]["text"]), "Что у вас уже есть?")

        fresh = await self.storage.get_lead(lead.telegram_id)
        await handle_segment_selected(renderer, self.storage, fresh, "product", None)  # type: ignore[arg-type]
        self.assertEqual(str(renderer.screens[-1]["text"]), "Что сейчас важнее всего?")
        self.assertEqual(
            button_texts(renderer.screens[-1]),
            [
                "Получать больше заявок",
                "Собрать лендинг, бота или воронку",
                "Автоматизировать обработку людей",
                "Научиться собирать решения самостоятельно",
            ],
        )

        fresh = await self.storage.get_lead(lead.telegram_id)
        await handle_pain_selected(renderer, self.storage, fresh, "build_funnel", None)  # type: ignore[arg-type]
        submitted = await self.storage.get_lead(lead.telegram_id)

        self.assertEqual(submitted.lead_status, "review_context_requested")  # type: ignore[union-attr]
        self.assertEqual(submitted.application_context, None)  # type: ignore[union-attr]
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "post_entry_started"), 1)
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "route_started"), 1)
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "route_completed"), 1)
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "application_started"), 1)
        self.assertEqual(await self.storage.count_events(lead.telegram_id, "sales_notified"), 0)
        self.assertIn("Опишите в 2–3 предложениях", str(renderer.screens[-1]["text"]))

    async def test_unknown_payload_opens_main_hermes_route(self) -> None:
        await self.storage.upsert_material(
            material_key="am_p01_video",
            title="Основное видео",
            url="https://example.com/video",
        )
        lead = await self.create_lead("unknown_campaign_payload")
        renderer = FakeRenderer()

        await route_entry(renderer, self.storage, self.settings, lead)  # type: ignore[arg-type]

        self.assertIn("Где вы сейчас застряли?", str(renderer.screens[-1]["text"]))
        self.assertEqual(
            button_texts(renderer.screens[-1]),
            [
                "🧭 Не знаю, кому предложить",
                "💬 Есть бизнес, не знаю, что предложить",
                "🛠 Есть задача, не могу собрать решение",
                "💰 Решение есть, не понимаю, как довести до сделки",
                "⚙️ Не получается запустить Hermes",
            ],
        )

        fresh = await self.storage.get_lead(lead.telegram_id)
        await route_callback(  # type: ignore[arg-type]
            renderer,
            self.storage,
            self.settings,
            fresh,
            CALLBACK_MAIN_VIDEO,
            None,
        )
        self.assertIn("Основное видео", str(renderer.screens[-1]["text"]))
        self.assertEqual((await self.storage.get_lead(lead.telegram_id)).source, "direct")


if __name__ == "__main__":
    unittest.main()
