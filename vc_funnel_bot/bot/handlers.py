from __future__ import annotations

import asyncio
import csv
import io
import logging
from datetime import datetime
from types import SimpleNamespace

from aiogram import Bot, F, Router
from aiogram.exceptions import TelegramBadRequest
from aiogram.filters import Command, CommandObject, CommandStart
from aiogram.types import BotCommand, BufferedInputFile, CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, Message

from .analytics import INTENT_OPTIONS, PAIN_OPTIONS, SEGMENT_OPTIONS, personal_result_text
from .catalog.hermes import (
    HERMES_APPLY_PROMPT,
    HERMES_BUNDLES,
    HERMES_GENERAL_CONTEXT_BY_CALLBACK,
    HERMES_MATERIAL_KEYS,
    HERMES_PAYLOAD,
    HERMES_PUBLIC_PAYLOADS,
    HERMES_QUESTION_1,
    HERMES_QUESTION_2_GENERAL,
    HERMES_QUESTION_2_SETUP,
    HERMES_SETUP_CONTEXT_BY_CALLBACK,
    HERMES_STAGE_BY_CALLBACK,
    HERMES_START_MESSAGE,
    HERMES_URGENCY_BY_CALLBACK,
    HERMES_URGENCY_QUESTION,
    hermes_personal_plan_text,
    hermes_track,
)
from .config import Settings
from .hermes import hermes_result_text, send_material_bundle
from .keyboards import (
    CALLBACK_ACCESS,
    CALLBACK_CHANNEL_CONTEXT_PREFIX,
    CALLBACK_DIAGNOSTIC_START,
    CALLBACK_MAIN_VIDEO,
    CALLBACK_MATERIALS,
    CALLBACK_PAIN_PREFIX,
    CALLBACK_REVIEW,
    CALLBACK_SEGMENT_PREFIX,
    CALLBACK_VC_INTEREST_PREFIX,
    channel_access_keyboard,
    channel_context_keyboard,
    channel_material_actions_keyboard,
    channel_result_actions_keyboard,
    direct_start_keyboard,
    contact_request_keyboard,
    hermes_business_cta_keyboard,
    hermes_playbook_keyboard,
    hermes_q1_keyboard,
    hermes_q2_general_keyboard,
    hermes_q2_setup_keyboard,
    hermes_setup_help_keyboard,
    hermes_urgency_keyboard,
    hermes_webinar_card_keyboard,
    hermes_webinar_confirmation_keyboard,
    materials_actions_keyboard,
    q1_keyboard,
    q2_keyboard,
    result_actions_keyboard,
    submitted_channel_keyboard,
    unsafe_continue_keyboard,
    unknown_text_keyboard,
    vc_interest_keyboard,
    webinar_url_keyboard,
)
from .messages import (
    ACCESS_REPLY,
    APPLICATION_CONTEXT_PROMPT,
    CHANNEL_CALL_REPLY,
    CHANNEL_CONTEXT_QUESTION,
    CONTEXT_RECEIVED_TEXT,
    DIAGNOSTIC_INTRO_TEXT,
    DIRECT_REVIEW_TEXT,
    ENTER_CHANNEL_REPLY,
    FINAL_SAVED_APPLICATION_TEXT,
    HERMES_APPLICATION_INTRO_TEXT,
    HERMES_COMMERCIAL_TRANSITION_TEXT,
    HERMES_CONTACT_PROMPT,
    HERMES_CONTEXT_TOO_SHORT_TEXT,
    HERMES_CHANNEL_REPLY,
    HERMES_PLAYBOOK_MISSING_TEXT,
    HERMES_PLAYBOOK_TEXT,
    HERMES_SETUP_CONTEXT_PROMPT,
    HERMES_SUPPORT_PENDING_TEXT,
    HERMES_SETUP_RECEIVED_TEXT,
    HERMES_WEBINAR_ALREADY_REGISTERED_TEXT,
    HERMES_WEBINAR_CALENDAR_READY_TEXT,
    HERMES_WEBINAR_CARD_TEXT,
    HERMES_WEBINAR_JOIN_MISSING_TEXT,
    HERMES_WEBINAR_JOIN_READY_TEXT,
    HERMES_WEBINAR_LIVE_REGISTERED_TEXT,
    HERMES_WEBINAR_LIVE_REGISTERED_NO_URL_TEXT,
    HERMES_WEBINAR_LIVE_TEXT,
    HERMES_WEBINAR_REGISTERED_TEXT,
    HERMES_WEBINAR_REPLAY_PENDING_TEXT,
    HERMES_WEBINAR_REPLAY_READY_TEXT,
    HERMES_WEBINAR_REPLAY_TEXT,
    MATERIAL_MISSING_TEXT,
    PRIVATE_CHANNEL_MISSING_TEXT,
    Q2_TEXT,
    RESET_DONE_TEXT,
    RESET_EMPTY_TEXT,
    RETURNING_AFTER_SALES_TEXT,
    REVIEW_CTA_REPLY,
    SALES_DELIVERY_PENDING_TEXT,
    SUPPORT_CONTEXT_RECEIVED_TEXT,
    UNSAFE_DATA_WARNING_TEXT,
    UNKNOWN_TEXT,
    UNIVERSAL_START_TEXT,
    VC_INTEREST_CONTEXT_TEXT,
    VC_PARTICIPATION_QUESTION,
    channel_diagnostic_intro,
    channel_material_text,
    direct_materials_text,
    external_material_text,
    material_text,
)
from .catalog.materials import MATERIAL_CATALOG
from .catalog.payloads import PAYLOAD_CATALOG, normalize_payload
from .materials import (
    ResolvedMaterial,
    material_body,
    material_readiness,
    resolve_material,
    resolve_material_key,
)
from .models import Lead
from .notifier import (
    BOTTLENECK_LABELS,
    SITUATION_LABELS,
    URGENCY_LABELS,
    SupportAttachment,
    material_labels,
    notify_sales,
    notify_support,
)
from .rendering import BotScreenRenderer
from .safety import contains_unsafe_data, mask_sensitive as mask_sensitive_text
from .source_parser import parse_start_payload, parse_text_trigger
from .storage import VcStorage
from .webinar import (
    google_calendar_url,
    selected_route,
    webinar_event_payload,
    webinar_join_is_available,
    webinar_phase,
)


logger = logging.getLogger(__name__)

MATERIAL_CALLBACKS = {
    CALLBACK_MAIN_VIDEO,
    CALLBACK_MATERIALS,
    "vc:direct:materials",
    "vc:yt:materials",
    "vc:tg:materials",
}
DIAGNOSTIC_CALLBACKS = {
    CALLBACK_DIAGNOSTIC_START,
    "vc:direct:diagnostic",
    "vc:tg:start_diagnostic",
    "vc:channel:diagnostic",
}
ACCESS_CALLBACKS = {CALLBACK_ACCESS, "vc:tg:access", "vc:channel:open", "vc:channel:return", "vc:channel:inside"}
REVIEW_CALLBACKS = {CALLBACK_REVIEW, "vc:review:start", "vc:call:yes"}
SEGMENT_ALIASES = {
    "content": "audience",
    "ai": "starting",
    "channel": "audience",
    "learn_ai": "starting",
    "traffic": "audience",
}
PAIN_ALIASES = {
    "no_leads": "more_leads",
    "lost_leads": "automate_people",
    "ai_to_money": "learn_build",
    "ai_money": "learn_build",
    "build_artifact": "build_funnel",
    "build_asset": "build_funnel",
}
VC_INTEREST_LABELS = {
    "records": "Записи",
    "intensive": "Интенсив",
    "mentor": "С ментором",
    "unknown": "Не знаю",
}
HELP_TEXT = """Здесь можно:

1. посмотреть, как работает ИИ-связка;
2. перейти в канал «ИИ-связки | Андрей Фадеев»;
3. подобрать связку под вашу ситуацию.

Выберите следующий шаг."""

ADMIN_DENIED_TEXT = "Команда недоступна."


def create_router(storage: VcStorage, settings: Settings) -> Router:
    router = Router(name="vc_funnel")
    callback_locks: dict[int, asyncio.Lock] = {}
    material_wizards: dict[int, dict[str, object]] = {}

    def user_lock(telegram_id: int) -> asyncio.Lock:
        lock = callback_locks.get(telegram_id)
        if lock is None:
            lock = asyncio.Lock()
            callback_locks[telegram_id] = lock
        return lock

    @router.message(CommandStart())
    async def start(message: Message, command: CommandObject, bot: Bot) -> None:
        if message.from_user is None:
            return
        raw_payload = (command.args or "").strip() or None
        parsed_source = parse_start_payload(raw_payload)
        if raw_payload and parsed_source.source_type == "unknown":
            parsed_source = parse_start_payload(None)
        lead = await storage.upsert_lead(
            telegram_id=message.from_user.id,
            username=message.from_user.username,
            first_name=message.from_user.first_name,
            source=parsed_source,
        )
        renderer = BotScreenRenderer(bot, storage, settings)
        if (
            raw_payload is None
            or normalize_payload(raw_payload) not in PAYLOAD_CATALOG
        ):
            await show_hermes_start(
                renderer,
                storage,
                lead,
                None,
            )
            return
        await route_entry(renderer, storage, settings, lead)

    @router.message(Command("reset_vc"))
    async def reset_vc(message: Message) -> None:
        if not await require_admin(message, settings):
            return
        assert message.from_user is not None
        reset_done = await storage.reset_lead_for_test(message.from_user.id)
        await message.answer(RESET_DONE_TEXT if reset_done else RESET_EMPTY_TEXT)

    @router.message(Command("menu"))
    async def menu(message: Message, bot: Bot) -> None:
        lead = await ensure_lead_from_message(message, storage, parse_start_payload(None))
        await show_hermes_start(
            BotScreenRenderer(bot, storage, settings),
            storage,
            lead,
            None,
        )

    @router.message(Command("materials"))
    async def materials_command(message: Message, bot: Bot) -> None:
        lead = await ensure_lead_from_message(message, storage, parse_text_trigger("материалы") or parse_start_payload(None))
        await send_materials_screen(
            BotScreenRenderer(bot, storage, settings),
            storage,
            settings,
            lead,
            None,
            material_payload="am_p01_video",
        )

    @router.message(Command("diagnostic"))
    async def diagnostic_command(message: Message, bot: Bot) -> None:
        lead = await ensure_lead_from_message(message, storage, parse_start_payload(None))
        await show_diagnostic_start(BotScreenRenderer(bot, storage, settings), storage, lead, None)

    @router.message(Command("access"))
    async def access_command(message: Message, bot: Bot) -> None:
        lead = await ensure_lead_from_message(message, storage, parse_text_trigger("доступ") or parse_start_payload(None))
        await show_channel_access(BotScreenRenderer(bot, storage, settings), storage, settings, lead, None, direct=True)

    @router.message(Command("review"))
    async def review_command(message: Message, bot: Bot) -> None:
        lead = await ensure_lead_from_message(message, storage, parse_text_trigger("разбор") or parse_start_payload(None))
        await start_review_request(BotScreenRenderer(bot, storage, settings), storage, lead, REVIEW_CTA_REPLY, None)

    @router.message(Command("help"))
    async def help_command(message: Message, bot: Bot) -> None:
        lead = await ensure_lead_from_message(
            message,
            storage,
            parse_start_payload(None),
        )
        await show_hermes_start(
            BotScreenRenderer(bot, storage, settings),
            storage,
            lead,
            None,
        )

    @router.message(Command("admin"))
    async def admin(message: Message) -> None:
        if not await require_admin(message, settings):
            return
        await storage.add_event(message.from_user.id, "admin_opened")  # type: ignore[union-attr]
        await message.answer(
            "Админ-панель VC Funnel Bot.\n\nЧто открыть?",
            reply_markup=admin_keyboard(),
        )

    @router.message(Command("links"))
    async def links(message: Message) -> None:
        if not await require_admin(message, settings):
            return
        await storage.add_event(message.from_user.id, "admin_links_opened")  # type: ignore[union-attr]
        await message.answer(await admin_links_text(storage, settings))

    @router.message(Command("testlink"))
    async def testlink(message: Message, command: CommandObject) -> None:
        if not await require_admin(message, settings):
            return
        payload = (command.args or "").strip()
        await message.answer(testlink_text(settings, payload))

    @router.message(Command("preview"))
    async def preview(message: Message, command: CommandObject) -> None:
        if not await require_admin(message, settings):
            return
        payload = (command.args or "").strip()
        await storage.add_event(message.from_user.id, "admin_preview_used", {"payload": payload})  # type: ignore[union-attr]
        preview_markup = (
            hermes_q1_keyboard(preview=True)
            if normalize_payload(payload) == HERMES_PAYLOAD
            else admin_preview_keyboard(payload)
        )
        await message.answer(
            await admin_preview_text(storage, settings, payload),
            reply_markup=preview_markup,
        )

    @router.message(Command("admin_materials"))
    async def admin_materials(message: Message) -> None:
        if not await require_admin(message, settings):
            return
        await message.answer(await admin_materials_text(storage, settings), reply_markup=admin_materials_keyboard())

    @router.message(Command("hermes_readiness"))
    async def hermes_readiness_command(message: Message) -> None:
        if not await require_admin(message, settings):
            return
        await message.answer(await hermes_readiness_text(storage, settings))

    @router.message(Command("material_add"))
    async def material_add(message: Message) -> None:
        if not await require_admin(message, settings):
            return
        material_wizards[message.from_user.id] = {"step": "key", "data": {}}  # type: ignore[union-attr]
        await message.answer("Введи material_key.\n\nНапример:\nandrey_video_0704\nagent_lost_leads")

    @router.message(Command("material_set_url"))
    async def material_set_url(message: Message, command: CommandObject) -> None:
        if not await require_admin(message, settings):
            return
        parts = (command.args or "").split(maxsplit=1)
        if len(parts) != 2:
            await message.answer("Формат: /material_set_url <material_key> <url>")
            return
        existing = await storage.get_material(parts[0])
        await storage.upsert_material(material_key=parts[0], title=existing.title if existing else parts[0], body=existing.body if existing else None, url=parts[1])
        await storage.add_event(message.from_user.id, "admin_material_updated", {"material_key": parts[0]})  # type: ignore[union-attr]
        await message.answer(f"URL сохранён для {parts[0]}.")

    @router.message(Command("material_bind"))
    async def material_bind(message: Message, command: CommandObject) -> None:
        if not await require_admin(message, settings):
            return
        parts = (command.args or "").split()
        if len(parts) != 2:
            await message.answer("Формат: /material_bind <payload> <material_key>")
            return
        await storage.bind_material(normalize_payload(parts[0]) or parts[0], parts[1])
        await storage.add_event(message.from_user.id, "admin_material_bound", {"payload": parts[0], "material_key": parts[1]})  # type: ignore[union-attr]
        await message.answer(f"Payload {parts[0]} привязан к {parts[1]}.")

    @router.message(Command("material_unbind"))
    async def material_unbind(message: Message, command: CommandObject) -> None:
        if not await require_admin(message, settings):
            return
        payload = (command.args or "").strip()
        await storage.unbind_material(normalize_payload(payload) or payload)
        await storage.add_event(message.from_user.id, "admin_material_unbound", {"payload": payload})  # type: ignore[union-attr]
        await message.answer(f"Payload {payload} отвязан.")

    @router.message(Command("material_delete"))
    async def material_delete(message: Message, command: CommandObject) -> None:
        if not await require_admin(message, settings):
            return
        key = (command.args or "").strip()
        await storage.delete_material(key)
        await storage.add_event(message.from_user.id, "admin_material_deleted", {"material_key": key})  # type: ignore[union-attr]
        await message.answer(f"Материал {key} удалён.")

    @router.message(Command("material_preview"))
    async def material_preview(message: Message, command: CommandObject) -> None:
        if not await require_admin(message, settings):
            return
        key = (command.args or "").strip()
        material = await storage.get_material(key)
        if material is None:
            await message.answer("Материал не найден.")
            return
        await message.answer(format_material_preview(material))

    @router.message(Command("leads"))
    async def leads(message: Message) -> None:
        if not await require_admin(message, settings):
            return
        await storage.add_event(message.from_user.id, "admin_leads_opened")  # type: ignore[union-attr]
        await message.answer(await leads_text(storage), reply_markup=admin_leads_keyboard())

    @router.message(Command("lead"))
    async def lead_command(message: Message, command: CommandObject) -> None:
        if not await require_admin(message, settings):
            return
        telegram_id = parse_int_arg(command.args)
        lead = await storage.get_lead(telegram_id) if telegram_id else None
        if lead is None:
            await message.answer("Lead не найден.")
            return
        await storage.add_event(message.from_user.id, "admin_lead_opened", {"telegram_id": telegram_id})  # type: ignore[union-attr]
        delivered, playbook_opened = await storage.delivery_details(
            lead.telegram_id
        )
        await message.answer(
            lead_card_text(
                lead,
                delivered_materials=delivered,
                playbook_opened=playbook_opened,
            ),
            reply_markup=admin_lead_keyboard(lead.telegram_id),
        )

    @router.message(Command("events"))
    async def events_command(message: Message, command: CommandObject) -> None:
        if not await require_admin(message, settings):
            return
        telegram_id = parse_int_arg(command.args)
        await storage.add_event(message.from_user.id, "admin_events_opened", {"telegram_id": telegram_id})  # type: ignore[union-attr]
        await message.answer(events_text(await storage.list_recent_events(telegram_id, limit=30 if telegram_id else 50), telegram_id))

    @router.message(Command("stats"))
    async def stats_command(message: Message) -> None:
        if not await require_admin(message, settings):
            return
        await message.answer(stats_text(await storage.stats()))

    @router.message(Command("export_leads"))
    async def export_leads(message: Message) -> None:
        if not await require_admin(message, settings):
            return
        await storage.add_event(message.from_user.id, "admin_export_leads")  # type: ignore[union-attr]
        await send_leads_csv(message, storage)

    @router.message(Command("admin_reset"))
    async def admin_reset(message: Message, command: CommandObject) -> None:
        if not await require_admin(message, settings):
            return
        telegram_id = parse_int_arg(command.args)
        if telegram_id is None:
            await message.answer("Формат: /admin_reset <telegram_id>")
            return
        await storage.admin_reset_lead(telegram_id, message.from_user.id)  # type: ignore[union-attr]
        await message.answer(f"Lead {telegram_id} сброшен.")

    @router.callback_query(F.data.startswith("admin:"))
    async def admin_callback(callback: CallbackQuery) -> None:
        await ack_callback(callback)
        if callback.from_user is None or not is_admin(callback.from_user.id, settings) or callback.message is None or callback.data is None:
            return
        message = callback.message
        if not isinstance(message, Message):
            return
        action = callback.data.removeprefix("admin:")
        if action == "links":
            await message.answer(await admin_links_text(storage, settings))
        elif action == "materials":
            await message.answer(await admin_materials_text(storage, settings), reply_markup=admin_materials_keyboard())
        elif action == "hermes_readiness":
            await message.answer(await hermes_readiness_text(storage, settings))
        elif action == "leads":
            await message.answer(await leads_text(storage), reply_markup=admin_leads_keyboard())
        elif action == "stats":
            await message.answer(stats_text(await storage.stats()))
        elif action == "webinar":
            await message.answer(
                await webinar_admin_text(storage, settings)
            )
        elif action == "preview":
            await message.answer("Напиши: /preview <payload>")
        elif action == "export":
            await send_leads_csv(message, storage)
        elif action == "material_add_hint":
            await message.answer("Напиши: /material_add")
        elif action.startswith("events:"):
            telegram_id = parse_int_arg(action.removeprefix("events:"))
            await message.answer(events_text(await storage.list_recent_events(telegram_id, limit=30), telegram_id))

    @router.message(F.document | F.photo | F.video | F.animation)
    async def media_message(message: Message, bot: Bot) -> None:
        if message.from_user is None:
            return
        if (
            message.from_user.id in material_wizards
            and is_admin(message.from_user.id, settings)
        ):
            await handle_material_wizard_media(message, material_wizards)
            return
        lead = await storage.get_lead(message.from_user.id)
        if lead is None or lead.intent != "setup_help":
            return
        await handle_support_media(
            BotScreenRenderer(bot, storage, settings),
            bot,
            storage,
            settings,
            lead,
            message,
        )

    @router.callback_query(F.data.startswith("vc:") | F.data.startswith("hb:"))
    async def bot_callback(callback: CallbackQuery, bot: Bot) -> None:
        if callback.from_user is None or callback.data is None:
            return

        lock = user_lock(callback.from_user.id)
        if lock.locked():
            await ack_callback(callback)
            await storage.add_event(callback.from_user.id, "duplicate_callback_ignored", {"data": callback.data})
            return

        async with lock:
            await ack_callback(callback)
            lead = await ensure_lead_from_callback(callback, storage)
            renderer = BotScreenRenderer(bot, storage, settings)
            source_message = callback.message if isinstance(callback.message, Message) else None
            await route_callback(renderer, storage, settings, lead, callback.data, source_message)

    @router.message(F.contact)
    async def contact_shared(message: Message, bot: Bot) -> None:
        if message.from_user is None or message.contact is None:
            return
        lead = await storage.get_lead(message.from_user.id)
        if lead is None:
            lead = await storage.upsert_lead(
                telegram_id=message.from_user.id,
                username=message.from_user.username,
                first_name=message.from_user.first_name,
                source=parse_start_payload(None),
            )
        contact = message.contact.phone_number or ""
        if not contact:
            await message.answer(REVIEW_CTA_REPLY)
            return
        lead = await storage.save_contact(lead.telegram_id, contact[:120])
        if (
            lead.lead_status == "contact_requested"
            and lead.application_context
        ):
            await finalize_sales_application(
                BotScreenRenderer(bot, storage, settings),
                bot,
                storage,
                settings,
                lead,
            )
            return
        await message.answer("Контакт сохранил.")

    @router.message(F.text)
    async def text_message(message: Message, bot: Bot) -> None:
        if message.from_user is None or message.text is None:
            return
        text = message.text.strip()
        if text.startswith("/"):
            return
        if message.from_user.id in material_wizards and is_admin(message.from_user.id, settings):
            if await handle_material_wizard_text(message, storage, material_wizards, text):
                return

        lead = await storage.get_lead(message.from_user.id)
        if lead is None:
            lead = await storage.upsert_lead(
                telegram_id=message.from_user.id,
                username=message.from_user.username,
                first_name=message.from_user.first_name,
                source=parse_start_payload(None),
            )
        renderer = BotScreenRenderer(bot, storage, settings)

        if lead.lead_status == "contact_requested":
            if contains_unsafe_data(text):
                await show_unsafe_warning(renderer, storage, lead)
                return
            lead = await storage.save_contact(lead.telegram_id, text[:120])
            await finalize_sales_application(
                renderer,
                bot,
                storage,
                settings,
                lead,
            )
            return

        if contains_unsafe_data(text):
            await show_unsafe_warning(renderer, storage, lead)
            return

        if lead.lead_status == "application_context_requested":
            await handle_sales_application_context(
                renderer,
                bot,
                storage,
                settings,
                lead,
                text,
            )
            return

        if lead.lead_status == "setup_context_requested":
            await handle_setup_context(
                renderer,
                bot,
                storage,
                settings,
                lead,
                text,
            )
            return

        if lead.lead_status == "review_context_requested":
            await handle_review_context(renderer, bot, storage, settings, lead, text)
            return

        if lead.lead_status in {
            "application_submitted",
            "support_requested",
            "sales_notified",
        } or is_terminal_lead(lead):
            combined = "\n\n".join(part for part in (lead.application_context, text[:1200]) if part)
            lead = await storage.save_application_context(lead.telegram_id, combined[-2400:])
            await renderer.render_screen(lead=lead, text=FINAL_SAVED_APPLICATION_TEXT, mode="send_new")
            return

        if settings.enable_text_triggers:
            source = parse_text_trigger(text)
            if source is not None:
                lead = await storage.upsert_lead(
                    telegram_id=message.from_user.id,
                    username=message.from_user.username,
                    first_name=message.from_user.first_name,
                    source=source,
                )
                await route_entry(renderer, storage, settings, lead)
                return

        await storage.add_event(lead.telegram_id, "unknown_text_routed")
        await renderer.render_screen(
            lead=lead,
            text=UNKNOWN_TEXT,
            reply_markup=unknown_text_keyboard(),
            mode="send_new",
        )

    return router


async def ack_callback(callback: CallbackQuery) -> None:
    try:
        await callback.answer()
    except TelegramBadRequest:
        pass


async def route_callback(
    renderer: BotScreenRenderer,
    storage: VcStorage,
    settings: Settings,
    lead: Lead,
    data: str,
    source_message: Message | None,
) -> None:
    if data.startswith("hb:"):
        await route_hermes_callback(
            renderer,
            storage,
            settings,
            lead,
            data,
            source_message,
        )
        return

    if is_terminal_lead(lead):
        await storage.add_event(lead.telegram_id, "repeat_start_after_call_requested", {"callback": data})
        await show_returning_after_sales(renderer, lead, settings, source_message)
        return

    if data in MATERIAL_CALLBACKS:
        await send_materials_screen(
            renderer,
            storage,
            settings,
            lead,
            source_message,
            material_payload="am_p01_video" if data == CALLBACK_MAIN_VIDEO else None,
        )
        return

    if data in DIAGNOSTIC_CALLBACKS:
        if data == "vc:channel:diagnostic" or lead.entry_surface == "private_channel":
            await show_channel_diagnostic(renderer, storage, settings, lead, source_message)
            return
        await show_diagnostic_start(renderer, storage, lead, source_message)
        return

    if data in ACCESS_CALLBACKS:
        await storage.add_event(
            lead.telegram_id,
            "channel_cta_clicked",
            {"target": "andrey_ai_links", "membership_verified": False},
        )
        direct = lead.lead_status == "started" or lead.entry_mode == "access_gate"
        await show_channel_access(renderer, storage, settings, lead, source_message, direct=direct)
        return

    if data in REVIEW_CALLBACKS:
        await start_review_request(renderer, storage, lead, REVIEW_CTA_REPLY, source_message)
        return

    if data.startswith(CALLBACK_SEGMENT_PREFIX) or data.startswith("vc:q1:"):
        code = data.rsplit(":", 1)[-1]
        await handle_segment_selected(renderer, storage, lead, code, source_message)
        return

    if data.startswith(CALLBACK_PAIN_PREFIX) or data.startswith("vc:q2:"):
        code = data.rsplit(":", 1)[-1]
        await handle_pain_selected(renderer, storage, lead, code, source_message)
        return

    if data.startswith(CALLBACK_CHANNEL_CONTEXT_PREFIX):
        code = data.removeprefix(CALLBACK_CHANNEL_CONTEXT_PREFIX)
        await handle_channel_context_answer(renderer, storage, settings, lead, code, source_message)
        return

    if data.startswith(CALLBACK_VC_INTEREST_PREFIX):
        code = data.removeprefix(CALLBACK_VC_INTEREST_PREFIX)
        await handle_vc_interest(renderer, storage, lead, code, source_message)
        return

    await renderer.render_screen(
        lead=lead,
        text=UNIVERSAL_START_TEXT,
        reply_markup=direct_start_keyboard(),
        source_message=source_message,
    )


async def route_entry(
    renderer: BotScreenRenderer,
    storage: VcStorage,
    settings: Settings,
    lead: Lead,
    source_message: Message | None = None,
) -> None:
    entry_source = parse_start_payload(lead.latest_start_payload or lead.raw_start_payload)
    if entry_source.source == "andrey_main":
        await storage.add_event(
            lead.telegram_id,
            "post_entry_started",
            {
                "payload": entry_source.raw_start_payload,
                "post_id": entry_source.post_id,
                "campaign": entry_source.campaign,
                "cta": entry_source.cta_type,
            },
        )

    if entry_source.entry_mode == "hermes_bottleneck":
        await show_hermes_start(
            renderer,
            storage,
            lead,
            source_message,
        )
        return

    if (
        entry_source.raw_start_payload is None
        or (
            entry_source.source_type == "direct"
            and entry_source.raw_start_payload is not None
        )
    ):
        await show_hermes_start(
            renderer,
            storage,
            lead,
            source_message,
        )
        return

    if is_terminal_lead(lead):
        await show_returning_after_sales(renderer, lead, settings, source_message)
        return

    if lead.entry_mode == "universal_start":
        await show_universal_start(renderer, storage, lead, source_message)
        return

    if lead.entry_mode in {"external_materials", "direct_materials"}:
        await send_materials_screen(
            renderer,
            storage,
            settings,
            lead,
            source_message,
            material_payload="am_p01_video" if lead.entry_mode == "direct_materials" else None,
        )
        return

    if lead.entry_mode == "external_diagnostic":
        await show_diagnostic_start(renderer, storage, lead, source_message)
        return

    if lead.entry_mode == "access_gate":
        await show_channel_access(renderer, storage, settings, lead, source_message, direct=True)
        return

    if lead.entry_mode == "direct_review_request":
        await start_review_request(renderer, storage, lead, DIRECT_REVIEW_TEXT, source_message)
        return

    if lead.entry_mode == "channel_materials":
        await send_channel_materials_screen(renderer, storage, settings, lead, source_message)
        return

    if lead.entry_mode == "channel_diagnostic":
        await show_channel_diagnostic(renderer, storage, settings, lead, source_message)
        return

    if lead.entry_mode == "channel_call":
        await start_review_request(
            renderer,
            storage,
            lead,
            CHANNEL_CALL_REPLY,
            source_message,
            event_type="channel_call_context_requested",
        )
        return

    if lead.entry_mode == "channel_want_vc":
        await show_vc_interest_screen(renderer, storage, lead, source_message)
        return

    await show_universal_start(renderer, storage, lead, source_message)


async def show_hermes_start(
    renderer: BotScreenRenderer,
    storage: VcStorage,
    lead: Lead,
    source_message: Message | None,
) -> None:
    payload = lead.latest_start_payload or lead.raw_start_payload
    if is_terminal_lead(lead):
        await storage.add_event(
            lead.telegram_id,
            "route_started",
            {
                "source": public_source(lead),
                "returning_terminal_lead": True,
            },
        )
    else:
        lead = await storage.start_main_route(lead.telegram_id)
        await storage.add_event(
            lead.telegram_id,
            "route_started",
            {"source": public_source(lead), "payload": payload},
        )
    await renderer.render_screen(
        lead=lead,
        text=f"{HERMES_START_MESSAGE}\n\n{HERMES_QUESTION_1}",
        reply_markup=hermes_q1_keyboard(),
        source_message=source_message,
    )


async def route_hermes_callback(
    renderer: BotScreenRenderer,
    storage: VcStorage,
    settings: Settings,
    lead: Lead,
    data: str,
    source_message: Message | None,
) -> None:
    pain = HERMES_STAGE_BY_CALLBACK.get(data)
    if pain is not None:
        lead = await storage.save_route_field(
            lead.telegram_id,
            "pain",
            pain,
        )
        await storage.add_event(
            lead.telegram_id,
            "bottleneck_selected",
            {"bottleneck": pain},
        )
        is_setup = pain == "setup"
        await renderer.render_screen(
            lead=lead,
            text=(
                HERMES_QUESTION_2_SETUP
                if is_setup
                else HERMES_QUESTION_2_GENERAL
            ),
            reply_markup=(
                hermes_q2_setup_keyboard()
                if is_setup
                else hermes_q2_general_keyboard()
            ),
            source_message=source_message,
        )
        return

    segment: str | None = None
    if lead.pain == "setup":
        segment = HERMES_SETUP_CONTEXT_BY_CALLBACK.get(data)
    elif lead.pain in {"find_business", "offer", "build", "deal"}:
        segment = HERMES_GENERAL_CONTEXT_BY_CALLBACK.get(data)

    if segment is not None and lead.pain is not None:
        lead = await storage.save_route_field(
            lead.telegram_id,
            "segment",
            segment,
        )
        track = hermes_track(lead.pain, segment)
        await storage.add_event(
            lead.telegram_id,
            "situation_selected",
            {
                "bottleneck": lead.pain,
                "situation": segment,
                "track": track,
            },
        )
        await complete_hermes_route(
            renderer,
            storage,
            settings,
            lead,
            track,
            source_message,
        )
        return

    if data == "hb:materials":
        if lead.pain is None or lead.segment is None:
            await show_hermes_start(
                renderer,
                storage,
                lead,
                source_message,
            )
            return
        await complete_hermes_route(
            renderer,
            storage,
            settings,
            lead,
            hermes_track(lead.pain, lead.segment),
            source_message,
        )
        return

    if data == "hb:playbook":
        material = await resolve_material_key(
            storage,
            settings,
            "hermes_full_playbook",
        )
        if not material.has_content or material.status in {
            "missing",
            "inactive",
        }:
            await storage.add_event(
                lead.telegram_id,
                "full_playbook_requested",
                {"delivery_status": material.status},
            )
            await renderer.render_screen(
                lead=lead,
                text=HERMES_PLAYBOOK_MISSING_TEXT,
                source_message=source_message,
                mode="send_new",
            )
            if webinar_phase(settings) not in {
                "personal_plan",
                "disabled",
            }:
                await render_webinar_card(
                    renderer,
                    storage,
                    settings,
                    lead,
                )
            return
        try:
            await renderer.render_material(
                lead=lead,
                material=material,
                text=material_text(
                    material.title,
                    material_body(material),
                ),
                source_message=source_message,
                persistent=True,
            )
        except Exception as exc:
            logger.warning(
                "Hermes playbook delivery failed: %s",
                exc.__class__.__name__,
            )
            await storage.add_event(
                lead.telegram_id,
                "full_playbook_requested",
                {"delivery_status": "failed"},
            )
            await renderer.render_screen(
                lead=lead,
                text=HERMES_PLAYBOOK_MISSING_TEXT,
                source_message=source_message,
                mode="send_new",
            )
            if webinar_phase(settings) not in {
                "personal_plan",
                "disabled",
            }:
                await render_webinar_card(
                    renderer,
                    storage,
                    settings,
                    lead,
                )
            return
        await storage.add_event(
            lead.telegram_id,
            "full_playbook_requested",
            {"delivery_status": "delivered"},
        )
        if webinar_phase(settings) not in {"personal_plan", "disabled"}:
            await render_webinar_card(
                renderer,
                storage,
                settings,
                lead,
            )
        return

    if data == "hb:channel":
        await storage.add_event(
            lead.telegram_id,
            "channel_clicked",
            {"invite_configured": bool(settings.private_channel_invite_url)},
        )
        await renderer.render_screen(
            lead=lead,
            text=HERMES_CHANNEL_REPLY,
            reply_markup=channel_access_keyboard(
                settings.private_channel_invite_url
            ),
            source_message=source_message,
        )
        return

    if data == "hb:webinar:register":
        phase = webinar_phase(settings)
        payload = webinar_event_payload(settings, lead, phase=phase)
        await storage.add_event(
            lead.telegram_id,
            "webinar_registration_clicked",
            payload,
        )
        if (
            phase not in {"registration", "live"}
            or settings.webinar_event_id is None
        ):
            await render_webinar_card(
                renderer,
                storage,
                settings,
                lead,
                source_message=source_message,
            )
            return
        chat_id = (
            source_message.chat.id
            if source_message is not None
            else lead.telegram_id
        )
        _, created = await storage.upsert_webinar_registration(
            event_id=settings.webinar_event_id,
            telegram_user_id=lead.telegram_id,
            telegram_chat_id=chat_id,
            username=lead.username,
            first_name=lead.first_name,
            source=lead.source,
            start_payload=lead.raw_start_payload,
            campaign=lead.campaign,
            post=lead.post_id or lead.post_slug,
            selected_route=selected_route(lead),
            bottleneck=lead.pain,
        )
        await storage.add_event(
            lead.telegram_id,
            (
                "webinar_registered"
                if created
                else "webinar_already_registered"
            ),
            payload,
        )
        text = (
            HERMES_WEBINAR_ALREADY_REGISTERED_TEXT
            if not created
            else (
                HERMES_WEBINAR_LIVE_REGISTERED_TEXT
                if settings.webinar_join_url
                else HERMES_WEBINAR_LIVE_REGISTERED_NO_URL_TEXT
            )
            if phase == "live"
            else HERMES_WEBINAR_REGISTERED_TEXT
        )
        await renderer.render_screen(
            lead=lead,
            text=text,
            reply_markup=hermes_webinar_confirmation_keyboard(
                phase,
                join_available=bool(settings.webinar_join_url),
            ),
            source_message=source_message,
            mode="send_new",
        )
        return

    if data == "hb:webinar:calendar":
        phase = webinar_phase(settings)
        await storage.add_event(
            lead.telegram_id,
            "webinar_calendar_clicked",
            webinar_event_payload(settings, lead, phase=phase),
        )
        if phase not in {"registration", "live"}:
            await render_webinar_card(
                renderer,
                storage,
                settings,
                lead,
                source_message=source_message,
            )
            return
        await renderer.render_screen(
            lead=lead,
            text=HERMES_WEBINAR_CALENDAR_READY_TEXT,
            reply_markup=webinar_url_keyboard(
                "Открыть Google Calendar",
                google_calendar_url(settings),
            ),
            source_message=source_message,
            mode="send_new",
        )
        return

    if data == "hb:webinar:join":
        phase = webinar_phase(settings)
        registration = (
            await storage.get_webinar_registration(
                settings.webinar_event_id,
                lead.telegram_id,
            )
            if settings.webinar_event_id is not None
            else None
        )
        if registration is None:
            await render_webinar_card(
                renderer,
                storage,
                settings,
                lead,
                source_message=source_message,
            )
            return
        join_available = webinar_join_is_available(settings)
        if not join_available and phase != "live":
            await render_webinar_card(
                renderer,
                storage,
                settings,
                lead,
                source_message=source_message,
            )
            return
        await storage.add_event(
            lead.telegram_id,
            "webinar_join_clicked",
            webinar_event_payload(settings, lead, phase=phase),
        )
        if settings.webinar_event_id is not None:
            await storage.mark_webinar_click(
                settings.webinar_event_id,
                lead.telegram_id,
                "join",
            )
        if not settings.webinar_join_url:
            await renderer.render_screen(
                lead=lead,
                text=HERMES_WEBINAR_JOIN_MISSING_TEXT,
                source_message=source_message,
                mode="send_new",
            )
            return
        await renderer.render_screen(
            lead=lead,
            text=HERMES_WEBINAR_JOIN_READY_TEXT,
            reply_markup=webinar_url_keyboard(
                "Открыть эфир",
                settings.webinar_join_url,
            ),
            source_message=source_message,
            mode="send_new",
        )
        return

    if data == "hb:webinar:replay":
        phase = webinar_phase(settings)
        await storage.add_event(
            lead.telegram_id,
            "webinar_replay_clicked",
            webinar_event_payload(settings, lead, phase=phase),
        )
        if settings.webinar_event_id is not None:
            await storage.mark_webinar_click(
                settings.webinar_event_id,
                lead.telegram_id,
                "replay",
            )
        if phase != "replay" or not settings.webinar_replay_url:
            await renderer.render_screen(
                lead=lead,
                text=HERMES_WEBINAR_REPLAY_PENDING_TEXT,
                source_message=source_message,
                mode="send_new",
            )
            return
        await renderer.render_screen(
            lead=lead,
            text=HERMES_WEBINAR_REPLAY_READY_TEXT,
            reply_markup=webinar_url_keyboard(
                "Открыть запись",
                settings.webinar_replay_url,
            ),
            source_message=source_message,
            mode="send_new",
        )
        return

    if (
        data in {"hb:plan", "hb:apply"}
        and lead.pain in {"find_business", "offer", "build", "deal"}
        and lead.segment in set(HERMES_GENERAL_CONTEXT_BY_CALLBACK.values())
    ):
        if webinar_phase(settings) != "personal_plan":
            await render_funnel_end(
                renderer,
                storage,
                settings,
                lead,
                source_message=source_message,
            )
            return
        lead = await storage.set_route_state(
            lead.telegram_id,
            "application_started",
            intent="sales_consultation",
        )
        await storage.add_event(
            lead.telegram_id,
            "application_started",
            {
                "bottleneck": lead.pain,
                "situation": lead.segment,
            },
        )
        await renderer.render_screen(
            lead=lead,
            text=(
                f"{HERMES_APPLICATION_INTRO_TEXT}\n\n"
                f"{HERMES_URGENCY_QUESTION}"
            ),
            reply_markup=hermes_urgency_keyboard(),
            source_message=source_message,
        )
        return

    urgency = HERMES_URGENCY_BY_CALLBACK.get(data)
    if (
        urgency is not None
        and lead.intent == "sales_consultation"
        and lead.lead_status == "application_started"
    ):
        lead = await storage.save_route_field(
            lead.telegram_id,
            "urgency",
            urgency,
        )
        await storage.add_event(
            lead.telegram_id,
            "urgency_selected",
            {"urgency": urgency},
        )
        lead = await storage.set_route_state(
            lead.telegram_id,
            "application_context_requested",
        )
        await renderer.render_screen(
            lead=lead,
            text=HERMES_APPLY_PROMPT,
            source_message=source_message,
        )
        return

    if (
        data in {"hb:setup_help", "hb:apply"}
        and lead.pain == "setup"
        and lead.segment in set(HERMES_SETUP_CONTEXT_BY_CALLBACK.values())
    ):
        lead = await storage.set_route_state(
            lead.telegram_id,
            "setup_context_requested",
            intent="setup_help",
        )
        await renderer.render_screen(
            lead=lead,
            text=HERMES_SETUP_CONTEXT_PROMPT,
            source_message=source_message,
        )
        return

    await storage.add_event(
        lead.telegram_id,
        "unknown_callback",
        {"data": data},
    )
    await renderer.render_screen(
        lead=lead,
        text=f"{HERMES_START_MESSAGE}\n\n{HERMES_QUESTION_1}",
        reply_markup=hermes_q1_keyboard(),
        source_message=source_message,
    )


async def render_automatic_plan(
    renderer: BotScreenRenderer,
    lead: Lead,
    *,
    source_message: Message | None = None,
) -> None:
    if lead.pain is None or lead.segment is None:
        return
    await renderer.render_screen(
        lead=lead,
        text=hermes_personal_plan_text(lead.pain, lead.segment),
        source_message=source_message,
        mode="send_new",
        persistent=True,
    )


async def render_webinar_card(
    renderer: BotScreenRenderer,
    storage: VcStorage,
    settings: Settings,
    lead: Lead,
    *,
    source_message: Message | None = None,
) -> None:
    phase = webinar_phase(settings)
    if phase in {"personal_plan", "disabled"}:
        return
    if phase == "registration":
        text = HERMES_WEBINAR_CARD_TEXT
    elif phase == "live":
        live_text = (
            HERMES_WEBINAR_LIVE_TEXT
            if settings.webinar_join_url
            else HERMES_WEBINAR_JOIN_MISSING_TEXT
        )
        text = f"{HERMES_WEBINAR_CARD_TEXT}\n\n{live_text}"
    else:
        text = (
            HERMES_WEBINAR_REPLAY_TEXT
            if settings.webinar_replay_url
            else HERMES_WEBINAR_REPLAY_PENDING_TEXT
        )
    registration = (
        await storage.get_webinar_registration(
            settings.webinar_event_id,
            lead.telegram_id,
        )
        if settings.webinar_event_id is not None
        else None
    )
    await storage.add_event(
        lead.telegram_id,
        "webinar_card_shown",
        webinar_event_payload(settings, lead, phase=phase),
    )
    await renderer.render_screen(
        lead=lead,
        text=text,
        reply_markup=hermes_webinar_card_keyboard(
            phase,
            registered=registration is not None,
            join_available=bool(settings.webinar_join_url),
            replay_available=bool(settings.webinar_replay_url),
        ),
        source_message=source_message,
        mode="send_new",
    )


async def render_funnel_end(
    renderer: BotScreenRenderer,
    storage: VcStorage,
    settings: Settings,
    lead: Lead,
    *,
    source_message: Message | None = None,
) -> None:
    phase = webinar_phase(settings)
    if phase == "personal_plan":
        await renderer.render_screen(
            lead=lead,
            text=HERMES_COMMERCIAL_TRANSITION_TEXT,
            reply_markup=hermes_business_cta_keyboard(),
            source_message=source_message,
            mode="send_new",
        )
        return
    await render_automatic_plan(
        renderer,
        lead,
        source_message=source_message,
    )
    if phase != "disabled":
        await render_webinar_card(
            renderer,
            storage,
            settings,
            lead,
        )


async def complete_hermes_route(
    renderer: BotScreenRenderer,
    storage: VcStorage,
    settings: Settings,
    lead: Lead,
    track: str,
    source_message: Message | None,
) -> None:
    result_text = await hermes_result_text(storage, settings, track)
    await renderer.render_screen(
        lead=lead,
        text=result_text,
        source_message=source_message,
        mode="send_new",
        persistent=True,
    )
    delivery = await send_material_bundle(
        renderer,
        storage,
        settings,
        lead,
        track,
    )
    lead = await storage.get_lead(lead.telegram_id) or lead
    requested_keys = list(HERMES_BUNDLES.get(track, ()))
    delivered_keys = [
        key
        for key, status in delivery.statuses.items()
        if status == "delivered"
    ]
    if is_terminal_lead(lead):
        await storage.add_event(
            lead.telegram_id,
            "bundle_delivered",
            {
                "track": track,
                "requested_keys": requested_keys,
                "delivered_keys": delivered_keys,
                "statuses": delivery.statuses,
            },
        )
    else:
        lead = await storage.mark_bundle_delivered(
            lead.telegram_id,
            track=track,
            requested_keys=requested_keys,
            delivered_keys=delivered_keys,
            statuses=delivery.statuses,
        )
    if track.startswith("setup_"):
        phase = webinar_phase(settings)
        if phase != "personal_plan":
            await render_automatic_plan(renderer, lead)
        await renderer.render_screen(
            lead=lead,
            text=(
                "Если проблема осталась, команда поможет определить шаг, "
                "на котором возникла ошибка."
            ),
            reply_markup=hermes_setup_help_keyboard(),
            mode="send_new",
            persistent=phase != "personal_plan",
        )
        if phase not in {"personal_plan", "disabled"}:
            await render_webinar_card(
                renderer,
                storage,
                settings,
                lead,
            )
        return
    await renderer.render_screen(
        lead=lead,
        text=HERMES_PLAYBOOK_TEXT,
        reply_markup=hermes_playbook_keyboard(),
        mode="send_new",
        persistent=True,
    )
    await render_funnel_end(
        renderer,
        storage,
        settings,
        lead,
    )


async def ensure_lead_from_callback(callback: CallbackQuery, storage: VcStorage) -> Lead:
    lead = await storage.get_lead(callback.from_user.id)
    if lead is not None:
        return lead
    return await storage.upsert_lead(
        telegram_id=callback.from_user.id,
        username=callback.from_user.username,
        first_name=callback.from_user.first_name,
        source=parse_start_payload(None),
    )


def is_terminal_lead(lead: Lead) -> bool:
    return (
        lead.call_requested
        or lead.sales_notified
        or lead.support_notified
        or lead.lead_status
        in {
            "call_requested",
            "sales_notified",
            "application_submitted",
            "support_requested",
        }
    )


def select_materials_url(settings: Settings, lead: Lead) -> str | None:
    if lead.source_type == "youtube":
        return settings.youtube_materials_url or settings.materials_url
    if lead.source in {"telegram", "channel"}:
        return settings.telegram_materials_url or settings.materials_url
    return settings.materials_url


async def show_universal_start(
    renderer: BotScreenRenderer,
    storage: VcStorage,
    lead: Lead,
    source_message: Message | None,
) -> None:
    await storage.add_event(lead.telegram_id, "universal_start_shown")
    await renderer.render_screen(
        lead=lead,
        text=UNIVERSAL_START_TEXT,
        reply_markup=direct_start_keyboard(),
        source_message=source_message,
    )


async def show_returning_after_sales(
    renderer: BotScreenRenderer,
    lead: Lead,
    settings: Settings,
    source_message: Message | None,
) -> None:
    await renderer.render_screen(
        lead=lead,
        text=RETURNING_AFTER_SALES_TEXT,
        reply_markup=channel_access_keyboard(settings.private_channel_invite_url),
        source_message=source_message,
    )


async def send_materials_screen(
    renderer: BotScreenRenderer,
    storage: VcStorage,
    settings: Settings,
    lead: Lead,
    source_message: Message | None,
    *,
    material_payload: str | None = None,
) -> None:
    await storage.mark_materials_requested(lead.telegram_id)
    lead = await storage.mark_materials_sent(lead.telegram_id)
    material = await resolve_material(storage, settings, lead, payload=material_payload)
    actions = materials_actions_keyboard(settings.private_channel_invite_url)
    if not material.has_content:
        await storage.add_event(lead.telegram_id, "material_missing", {"material_key": material.material_key})
        await renderer.render_screen(lead=lead, text=MATERIAL_MISSING_TEXT, reply_markup=actions, source_message=source_message)
        return

    await storage.add_event(lead.telegram_id, "material_file_sent" if material.telegram_file_id else "material_url_sent", {"material_key": material.material_key})
    text = material_text(material.title, material_body(material))
    await render_material_or_screen(renderer, lead, material, text, actions, source_message)
    await storage.add_event(
        lead.telegram_id,
        "material_delivered",
        {"material_key": material.material_key, "payload": lead.raw_start_payload},
    )


async def show_diagnostic_start(
    renderer: BotScreenRenderer,
    storage: VcStorage,
    lead: Lead,
    source_message: Message | None,
) -> None:
    if lead.lead_status != "qual_started":
        lead = await storage.mark_qual_started(lead.telegram_id)
        await storage.add_event(
            lead.telegram_id,
            "route_started",
            {"payload": lead.raw_start_payload, "post_id": lead.post_id},
        )
    await renderer.render_screen(
        lead=lead,
        text=DIAGNOSTIC_INTRO_TEXT,
        reply_markup=q1_keyboard(),
        source_message=source_message,
    )


async def handle_segment_selected(
    renderer: BotScreenRenderer,
    storage: VcStorage,
    lead: Lead,
    code: str,
    source_message: Message | None,
) -> None:
    option_code = SEGMENT_ALIASES.get(code, code)
    value = SEGMENT_OPTIONS.get(option_code)
    if value is None:
        return
    lead = await storage.save_answer(lead.telegram_id, "segment", value)
    await renderer.render_screen(
        lead=lead,
        text=Q2_TEXT,
        reply_markup=q2_keyboard(),
        source_message=source_message,
    )


async def handle_pain_selected(
    renderer: BotScreenRenderer,
    storage: VcStorage,
    lead: Lead,
    code: str,
    source_message: Message | None,
) -> None:
    option_code = PAIN_ALIASES.get(code, code)
    value = PAIN_OPTIONS.get(option_code)
    if value is None:
        return
    lead = await storage.save_answer(lead.telegram_id, "pain", value)
    lead = await storage.mark_qual_completed(lead.telegram_id)
    await storage.add_event(
        lead.telegram_id,
        "route_completed",
        {"segment": lead.segment, "pain": lead.pain},
    )
    await start_review_request(
        renderer,
        storage,
        lead,
        f"{personal_result_text(lead)}\n\n{APPLICATION_CONTEXT_PROMPT}",
        source_message,
    )


async def show_channel_access(
    renderer: BotScreenRenderer,
    storage: VcStorage,
    settings: Settings,
    lead: Lead,
    source_message: Message | None,
    *,
    direct: bool,
) -> None:
    if settings.private_channel_invite_url is None:
        await storage.mark_private_channel_missing(lead.telegram_id)
    lead = await storage.mark_private_channel_sent(lead.telegram_id)
    await renderer.render_screen(
        lead=lead,
        text=ACCESS_REPLY if direct else ENTER_CHANNEL_REPLY,
        reply_markup=channel_access_keyboard(settings.private_channel_invite_url),
        source_message=source_message,
    )


async def send_channel_materials_screen(
    renderer: BotScreenRenderer,
    storage: VcStorage,
    settings: Settings,
    lead: Lead,
    source_message: Message | None,
) -> None:
    material = await resolve_material(storage, settings, lead)
    post_title = material.title if material.material_key else (lead.post_slug or "пост").replace("_", " ")
    await storage.add_event(lead.telegram_id, "channel_cta_clicked", {"cta": "materials"})
    await storage.mark_materials_requested(lead.telegram_id)
    lead = await storage.mark_materials_sent(lead.telegram_id)
    await storage.add_event(lead.telegram_id, "channel_materials_requested")
    if not material.has_content:
        await storage.add_event(lead.telegram_id, "material_missing", {"material_key": material.material_key})
        await renderer.render_screen(lead=lead, text=MATERIAL_MISSING_TEXT, reply_markup=channel_material_actions_keyboard(settings.private_channel_invite_url), source_message=source_message)
        return
    await storage.add_event(lead.telegram_id, "material_file_sent" if material.telegram_file_id else "material_url_sent", {"material_key": material.material_key})
    text = channel_material_text(post_title, material.url)
    if material.body and not material.url:
        text = f"{text}\n\n{material.body}"
    await render_material_or_screen(renderer, lead, material, text, channel_material_actions_keyboard(settings.private_channel_invite_url), source_message)
    await storage.add_event(
        lead.telegram_id,
        "material_delivered",
        {"material_key": material.material_key, "payload": lead.raw_start_payload},
    )


async def show_channel_diagnostic(
    renderer: BotScreenRenderer,
    storage: VcStorage,
    settings: Settings,
    lead: Lead,
    source_message: Message | None,
) -> None:
    await storage.add_event(lead.telegram_id, "channel_cta_clicked", {"cta": "diagnostic"})
    lead = await storage.set_status(
        lead.telegram_id,
        "qual_started",
        "channel_diagnostic_started",
        temperature="warm",
    )
    await renderer.render_screen(
        lead=lead,
        text=f"{channel_diagnostic_intro(lead.post_topic or 'пост')}\n\n{'Что тебе сейчас ближе?' if lead.post_slug == 'rko_bridge' else CHANNEL_CONTEXT_QUESTION}",
        reply_markup=rko_bridge_keyboard() if lead.post_slug == "rko_bridge" else channel_context_keyboard(),
        source_message=source_message,
    )


async def handle_channel_context_answer(
    renderer: BotScreenRenderer,
    storage: VcStorage,
    settings: Settings,
    lead: Lead,
    code: str,
    source_message: Message | None,
) -> None:
    if code == "want":
        await start_review_request(renderer, storage, lead, REVIEW_CTA_REPLY, source_message)
        return

    lead = await storage.save_answer(lead.telegram_id, "pain", PAIN_OPTIONS["automate_people"])
    lead = await storage.mark_qual_completed(lead.telegram_id)
    await storage.add_event(lead.telegram_id, "channel_diagnostic_completed", {"answer": code})
    await renderer.render_screen(
        lead=lead,
        text=personal_result_text(lead),
        reply_markup=channel_result_actions_keyboard(settings.private_channel_invite_url),
        source_message=source_message,
    )


async def show_vc_interest_screen(
    renderer: BotScreenRenderer,
    storage: VcStorage,
    lead: Lead,
    source_message: Message | None,
) -> None:
    lead = await storage.set_status(lead.telegram_id, "qual_started", "channel_cta_clicked", {"cta": "want_vc"}, temperature="warm")
    await renderer.render_screen(
        lead=lead,
        text=VC_PARTICIPATION_QUESTION,
        reply_markup=vc_interest_keyboard(),
        source_message=source_message,
    )


async def handle_vc_interest(
    renderer: BotScreenRenderer,
    storage: VcStorage,
    lead: Lead,
    code: str,
    source_message: Message | None,
) -> None:
    label = VC_INTEREST_LABELS.get(code, VC_INTEREST_LABELS["unknown"])
    await storage.save_answer(lead.telegram_id, "intent", INTENT_OPTIONS["vc_participation"])
    await storage.add_event(lead.telegram_id, "vc_interest_selected", {"interest": label})
    lead = await storage.set_status(
        lead.telegram_id,
        "review_context_requested",
        "application_started",
        {"source": "want_vc", "interest": label},
        temperature="hot_sql",
    )
    await renderer.render_screen(
        lead=lead,
        text=VC_INTEREST_CONTEXT_TEXT,
        source_message=source_message,
    )


async def start_review_request(
    renderer: BotScreenRenderer,
    storage: VcStorage,
    lead: Lead,
    text: str,
    source_message: Message | None,
    *,
    event_type: str = "review_context_requested",
) -> None:
    fresh = await storage.get_lead(lead.telegram_id)
    if fresh is None:
        return
    if is_terminal_lead(fresh):
        await renderer.render_screen(lead=fresh, text=RETURNING_AFTER_SALES_TEXT, source_message=source_message)
        return
    fresh = await storage.set_status(
        fresh.telegram_id,
        "review_context_requested",
        "application_started",
        {"payload": fresh.raw_start_payload, "post_id": fresh.post_id},
        temperature="sql",
    )
    if event_type != "review_context_requested":
        await storage.add_event(fresh.telegram_id, event_type)
    await renderer.render_screen(lead=fresh, text=text, source_message=source_message)


async def handle_sales_application_context(
    renderer: BotScreenRenderer,
    bot: Bot,
    storage: VcStorage,
    settings: Settings,
    lead: Lead,
    text: str,
) -> None:
    if len(text.strip()) < 20:
        await renderer.render_screen(
            lead=lead,
            text=HERMES_CONTEXT_TOO_SHORT_TEXT,
            mode="send_new",
        )
        return
    lead = await storage.save_application_context(
        lead.telegram_id,
        text[:1200],
    )
    if not lead.username and not lead.contact:
        lead = await storage.set_route_state(
            lead.telegram_id,
            "contact_requested",
            intent="sales_consultation",
        )
        await renderer.render_screen(
            lead=lead,
            text=HERMES_CONTACT_PROMPT,
            reply_markup=contact_request_keyboard(),
            mode="send_new",
        )
        return
    await finalize_sales_application(
        renderer,
        bot,
        storage,
        settings,
        lead,
    )


async def finalize_sales_application(
    renderer: BotScreenRenderer,
    bot: Bot,
    storage: VcStorage,
    settings: Settings,
    lead: Lead,
) -> None:
    if lead.lead_status != "application_submitted":
        lead = await storage.mark_application_submitted(lead.telegram_id)
    sent = await notify_sales(
        bot=bot,
        storage=storage,
        sales_chat_id=settings.sales_chat_id,
        sales_chat_ids=settings.sales_chat_ids,
        lead=lead,
    )
    fresh = await storage.get_lead(lead.telegram_id) or lead
    await renderer.render_screen(
        lead=fresh,
        text=CONTEXT_RECEIVED_TEXT if sent else SALES_DELIVERY_PENDING_TEXT,
        reply_markup=submitted_channel_keyboard(
            settings.private_channel_invite_url
        ),
        mode="send_new",
    )


async def handle_setup_context(
    renderer: BotScreenRenderer,
    bot: Bot,
    storage: VcStorage,
    settings: Settings,
    lead: Lead,
    text: str,
    *,
    attachment: SupportAttachment | None = None,
) -> None:
    lead = await storage.save_application_context(
        lead.telegram_id,
        text[:1200],
    )
    lead = await storage.mark_support_requested(lead.telegram_id)
    sent = await notify_support(
        bot=bot,
        storage=storage,
        sales_chat_id=settings.sales_chat_id,
        sales_chat_ids=settings.sales_chat_ids,
        lead=lead,
        attachment=attachment,
    )
    fresh = await storage.get_lead(lead.telegram_id) or lead
    await renderer.render_screen(
        lead=fresh,
        text=(
            HERMES_SETUP_RECEIVED_TEXT
            if sent
            else HERMES_SUPPORT_PENDING_TEXT
        ),
        mode="send_new",
    )


async def show_unsafe_warning(renderer: BotScreenRenderer, storage: VcStorage, lead: Lead) -> None:
    await storage.add_event(lead.telegram_id, "unsafe_data_warning_shown")
    await renderer.render_screen(
        lead=lead,
        text=UNSAFE_DATA_WARNING_TEXT,
        reply_markup=unsafe_continue_keyboard(),
        mode="send_new",
    )


async def handle_review_context(
    renderer: BotScreenRenderer,
    bot: Bot,
    storage: VcStorage,
    settings: Settings,
    lead: Lead,
    text: str,
) -> None:
    lead = await storage.save_application_context(lead.telegram_id, text[:1200])
    await storage.add_event(
        lead.telegram_id,
        "application_context_submitted",
        {"length": len(text[:1200])},
    )
    if lead.intent != "setup_support" and not lead.call_requested:
        lead = await storage.mark_call_requested(lead.telegram_id)
    sent = await notify_sales(
        bot=bot,
        storage=storage,
        sales_chat_id=settings.sales_chat_id,
        sales_chat_ids=settings.sales_chat_ids,
        lead=lead,
    )
    fresh = await storage.get_lead(lead.telegram_id) or lead
    await renderer.render_screen(
        lead=fresh,
        text=(
            SUPPORT_CONTEXT_RECEIVED_TEXT
            if sent and lead.intent == "setup_support"
            else CONTEXT_RECEIVED_TEXT
            if sent
            else SALES_DELIVERY_PENDING_TEXT
        ),
        mode="send_new",
    )


async def handle_support_media(
    renderer: BotScreenRenderer,
    bot: Bot,
    storage: VcStorage,
    settings: Settings,
    lead: Lead,
    message: Message,
) -> None:
    attachment: SupportAttachment | None = None
    if message.photo:
        attachment = SupportAttachment(
            telegram_file_id=message.photo[-1].file_id,
            telegram_file_type="photo",
            caption=message.caption,
        )
    elif (
        message.document
        and (message.document.mime_type or "").startswith("image/")
    ):
        attachment = SupportAttachment(
            telegram_file_id=message.document.file_id,
            telegram_file_type="document",
            telegram_file_name=message.document.file_name,
            caption=message.caption,
        )

    if attachment is None:
        await storage.add_event(
            lead.telegram_id,
            "support_media_rejected",
            {"reason": "not_an_image"},
        )
        await renderer.render_screen(
            lead=lead,
            text="Отправьте скриншот как изображение или опишите ошибку текстом.",
            mode="send_new",
        )
        return

    caption = (message.caption or "").strip()
    if caption and contains_unsafe_data(caption):
        await show_unsafe_warning(renderer, storage, lead)
        return

    context = caption[:1200] or "Скриншот ошибки приложен."
    if lead.lead_status == "support_requested":
        combined = "\n\n".join(
            part
            for part in (
                lead.application_context,
                f"Дополнение: {context}",
            )
            if part
        )
        lead = await storage.save_application_context(
            lead.telegram_id,
            combined[-2400:],
        )
        await renderer.render_screen(
            lead=lead,
            text=FINAL_SAVED_APPLICATION_TEXT,
            mode="send_new",
        )
        return

    if lead.lead_status != "setup_context_requested":
        return
    await handle_setup_context(
        renderer,
        bot,
        storage,
        settings,
        lead,
        context,
        attachment=attachment,
    )


def is_admin(telegram_id: int, settings: Settings) -> bool:
    return telegram_id in settings.admin_ids


async def require_admin(message: Message, settings: Settings) -> bool:
    if message.from_user is not None and is_admin(message.from_user.id, settings):
        return True
    await message.answer(ADMIN_DENIED_TEXT)
    return False


def parse_int_arg(raw: str | None) -> int | None:
    try:
        return int((raw or "").strip())
    except ValueError:
        return None


async def ensure_lead_from_message(message: Message, storage: VcStorage, source) -> Lead:
    if message.from_user is None:
        raise RuntimeError("Missing Telegram user")
    return await storage.upsert_lead(
        telegram_id=message.from_user.id,
        username=message.from_user.username,
        first_name=message.from_user.first_name,
        source=source,
    )


async def render_material_or_screen(
    renderer: BotScreenRenderer,
    lead: Lead,
    material: ResolvedMaterial,
    text: str,
    reply_markup: InlineKeyboardMarkup,
    source_message: Message | None,
) -> None:
    if hasattr(renderer, "render_material"):
        await renderer.render_material(lead=lead, material=material, text=text, reply_markup=reply_markup, source_message=source_message)
    else:
        await renderer.render_screen(lead=lead, text=text, reply_markup=reply_markup, source_message=source_message)


def admin_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Лиды", callback_data="admin:leads")],
            [InlineKeyboardButton(text="Статистика", callback_data="admin:stats")],
            [InlineKeyboardButton(text="Вебинар E02", callback_data="admin:webinar")],
            [InlineKeyboardButton(text="Материалы", callback_data="admin:materials")],
            [InlineKeyboardButton(text="Ссылки", callback_data="admin:links")],
        ]
    )


def admin_materials_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Добавить материал", callback_data="admin:material_add_hint")],
            [InlineKeyboardButton(text="Проверить готовность", callback_data="admin:hermes_readiness")],
            [InlineKeyboardButton(text="Ссылки", callback_data="admin:links")],
        ]
    )


def admin_preview_keyboard(payload: str) -> InlineKeyboardMarkup | None:
    if not payload:
        return None
    return InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="Deep links", callback_data="admin:links")]])


def admin_leads_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Статистика", callback_data="admin:stats")]
        ]
    )


def admin_lead_keyboard(telegram_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Назад к лидам", callback_data="admin:leads")]
        ]
    )


def rko_bridge_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Есть РКО, но нет новых заявок", callback_data=f"{CALLBACK_CHANNEL_CONTEXT_PREFIX}no_rko_leads")],
            [InlineKeyboardButton(text="Есть аудитория, но не понимаю связку", callback_data=f"{CALLBACK_CHANNEL_CONTEXT_PREFIX}audience")],
            [InlineKeyboardButton(text="Хочу зайти к бизнесу через пользу", callback_data=f"{CALLBACK_CHANNEL_CONTEXT_PREFIX}useful_tool")],
            [InlineKeyboardButton(text="🎯 Хочу собрать свою связку", callback_data=f"{CALLBACK_CHANNEL_CONTEXT_PREFIX}want")],
        ]
    )


def link_for(settings: Settings, payload: str) -> str:
    if not settings.bot_username:
        return "VC_BOT_USERNAME не задан."
    return f"https://t.me/{settings.bot_username.lstrip('@')}?start={payload}"


def public_source(lead: Lead) -> str:
    if lead.source == "youtube" or lead.source_type == "youtube":
        return "YouTube"
    if lead.source in {"telegram", "andrey_main", "channel"} or lead.source_type in {
        "telegram",
        "channel",
    }:
        return "Telegram"
    return "direct"


async def material_status(storage: VcStorage, settings: Settings, payload: str) -> str:
    material = await resolve_material(storage, settings, payload=payload)
    return material.status if material.has_content else "missing"


async def admin_links_text(storage: VcStorage, settings: Settings) -> str:
    lines = [
        "Ссылки",
        "",
        f"YouTube: {link_for(settings, HERMES_PUBLIC_PAYLOADS['youtube'])}",
        f"Telegram: {link_for(settings, HERMES_PUBLIC_PAYLOADS['telegram'])}",
    ]
    readiness = await material_readiness(
        storage,
        settings,
        HERMES_MATERIAL_KEYS,
    )
    loaded = sum(status == "loaded" for status in readiness.values())
    lines.append(
        f"\nМатериалы готовы: {loaded}/{len(HERMES_MATERIAL_KEYS)}"
    )
    return "\n".join(lines)


def testlink_text(settings: Settings, payload: str) -> str:
    if not payload:
        return "Формат: /testlink <payload>"
    prefix = f"Payload: {payload}\n"
    if normalize_payload(payload) not in PAYLOAD_CATALOG:
        prefix += "Payload не найден в каталоге. Всё равно ссылка:\n"
    return prefix + f"Link: {link_for(settings, payload)}"


async def admin_preview_text(storage: VcStorage, settings: Settings, payload: str) -> str:
    if not payload:
        return "Формат: /preview <payload>"
    source = parse_start_payload(payload)
    definition = PAYLOAD_CATALOG.get(normalize_payload(payload) or "")
    material = await resolve_material(storage, settings, payload=payload)
    text, buttons = first_screen_preview(source, material)
    if source.entry_mode == "hermes_bottleneck":
        readiness = await material_readiness(
            storage,
            settings,
            HERMES_MATERIAL_KEYS,
        )
        loaded = sum(status == "loaded" for status in readiness.values())
        return f"""Preview payload

Payload: {payload}
Entry mode: {source.entry_mode}
Group: {definition.group if definition else 'unknown'}
Source: {source.source}
Entry surface: {source.entry_surface}
Post id: {source.post_id}
Post slug: {source.post_slug}
CTA type: {source.cta_type}
Bundle readiness: {loaded}/{len(HERMES_MATERIAL_KEYS)}

First screen:
{text}

Buttons:
{buttons}"""
    return f"""Preview payload

Payload: {payload}
Entry mode: {source.entry_mode}
Group: {definition.group if definition else 'unknown'}
Source: {source.source}
Entry surface: {source.entry_surface}
Post id: {source.post_id}
Post slug: {source.post_slug}
CTA type: {source.cta_type}
Material key: {material.material_key or 'нет'}
Material status: {material.status if material.has_content else 'missing'}
Attachment: {material.telegram_file_type or 'нет'}

First screen:
{text}

Buttons:
{buttons}"""


def first_screen_preview(source, material: ResolvedMaterial) -> tuple[str, str]:
    if source.entry_mode == "hermes_bottleneck":
        labels = [
            row[0].text
            for row in hermes_q1_keyboard().inline_keyboard
        ]
        return (
            f"{HERMES_START_MESSAGE}\n\n{HERMES_QUESTION_1}",
            "\n".join(f"- {label}" for label in labels),
        )
    if source.entry_mode in {"external_materials", "direct_materials"}:
        text = material_text(material.title, material_body(material)) if material.has_content else MATERIAL_MISSING_TEXT
        return text, "- 📲 Смотреть следующие разборы в канале\n- 🎯 Подобрать связку под мою ситуацию"
    if source.entry_mode == "channel_materials":
        text = channel_material_text(material.title if material.material_key else (source.post_slug or "пост"), material.url)
        return text, "- 📲 Смотреть следующие разборы в канале\n- 🎯 Подобрать связку под мою ситуацию"
    if source.entry_mode == "external_diagnostic":
        return DIAGNOSTIC_INTRO_TEXT, "\n".join(f"- {label}" for label in SEGMENT_OPTIONS.values())
    if source.entry_mode == "direct_review_request":
        return APPLICATION_CONTEXT_PROMPT, "(нет кнопок)"
    if source.entry_mode == "access_gate":
        return ACCESS_REPLY, "- Войти в канал"
    if source.entry_mode == "channel_call":
        return CHANNEL_CALL_REPLY, "(нет кнопок)"
    if source.entry_mode == "channel_want_vc":
        return VC_PARTICIPATION_QUESTION, "- Записи\n- Интенсив\n- С ментором\n- Не знаю"
    if source.entry_mode == "channel_diagnostic":
        return f"{channel_diagnostic_intro(source.post_topic or 'пост')}\n\n{CHANNEL_CONTEXT_QUESTION}", "- Лиды без ответа\n- Много ручной обработки\n- Нет выжимки по заявкам\n- Хочу такую связку"
    return UNIVERSAL_START_TEXT, "- ▶️ Как работает связка\n- 📲 Перейти в канал\n- 🎯 Хочу собрать свою связку"


async def admin_materials_text(storage: VcStorage, settings: Settings) -> str:
    sqlite_materials = {material.material_key: material for material in await storage.list_materials()}
    keys = sorted(set(MATERIAL_CATALOG) | set(sqlite_materials))
    lines = ["Материалы"]
    for index, key in enumerate(keys, start=1):
        material = sqlite_materials.get(key)
        fallback = MATERIAL_CATALOG.get(key)
        status = (
            "загружен"
            if material and material.is_active
            else "встроен"
            if fallback
            and (
                fallback.body
                or (
                    fallback.env_url_name
                    and _fallback_url(settings, fallback.env_url_name)
                )
            )
            else "отсутствует"
        )
        lines.append(
            f"\n{index}. {(material.title if material else fallback.title if fallback else key)}"
            f"\nКлюч: {key}"
            f"\nСтатус: {status}"
        )
    return "\n".join(lines)


async def hermes_readiness_text(
    storage: VcStorage,
    settings: Settings,
) -> str:
    readiness = await material_readiness(
        storage,
        settings,
        HERMES_MATERIAL_KEYS,
    )
    loaded = sum(status == "loaded" for status in readiness.values())
    lines = [
        f"Hermes readiness: {loaded}/{len(HERMES_MATERIAL_KEYS)}",
        "",
        "Materials:",
    ]
    lines.extend(
        f"- {material_key}: {readiness[material_key]}"
        for material_key in HERMES_MATERIAL_KEYS
    )
    lines.append("\nBundles:")
    for track, material_keys in HERMES_BUNDLES.items():
        ready = sum(
            readiness[material_key] == "loaded"
            for material_key in material_keys
        )
        lines.append(f"- {track}: {ready}/{len(material_keys)} ready")
    return "\n".join(lines)


def _fallback_url(settings: Settings, name: str | None) -> str | None:
    return {"VC_MATERIALS_URL": settings.materials_url, "VC_YOUTUBE_MATERIALS_URL": settings.youtube_materials_url, "VC_TELEGRAM_MATERIALS_URL": settings.telegram_materials_url}.get(name or "")


def format_material_preview(material) -> str:
    return f"""Material key: {material.material_key}
Title: {material.title}
Body: {material.body or 'нет'}
URL: {material.url or 'нет'}
File: {material.telegram_file_type or 'нет'} {material.telegram_file_name or ''}
Active: {'yes' if material.is_active else 'no'}"""


async def leads_text(storage: VcStorage) -> str:
    leads = await storage.list_recent_leads(limit=20)
    if not leads:
        return "Лиды\n\nПока пусто."
    lines = ["Лиды"]
    for index, lead in enumerate(leads, start=1):
        username = f"@{lead.username}" if lead.username else "без username"
        name = lead.first_name or "Без имени"
        bottleneck = BOTTLENECK_LABELS.get(
            lead.pain or "",
            lead.pain or "не выбрано",
        )
        lines.append(
            f"\n{index}. {lead.updated_at[:16]} — {name} / {username}"
            f"\nИсточник: {public_source(lead)}"
            f"\nУзкое звено: {bottleneck}"
            f"\nСтатус: {lead.lead_status}"
            f"\nКарточка: /lead {lead.telegram_id}"
        )
    return "\n".join(lines)


def mask_sensitive(text: str | None) -> str:
    return mask_sensitive_text(text)


def lead_card_text(
    lead: Lead,
    *,
    delivered_materials: list[str] | None = None,
    playbook_opened: bool = False,
) -> str:
    username = f"@{lead.username}" if lead.username else "нет"
    materials = ", ".join(
        material_labels(delivered_materials or [])
    ) or "нет"
    return f"""Лид {lead.telegram_id}

Имя: {lead.first_name or 'нет'}
Username: {username}
Контакт: {lead.contact or username}
Источник: {public_source(lead)}
Узкое звено: {BOTTLENECK_LABELS.get(lead.pain or '', lead.pain or 'не выбрано')}
Ситуация: {SITUATION_LABELS.get(lead.segment or '', lead.segment or 'не выбрана')}
Срок: {URGENCY_LABELS.get(lead.urgency or '', lead.urgency or 'не выбран')}
Намерение: {lead.intent or 'не указано'}
Статус: {lead.lead_status}

Контекст:
{mask_sensitive(lead.application_context)}

Материалы: {materials}
Полная инструкция открыта: {'да' if playbook_opened else 'нет'}

Создан: {lead.created_at}
Обновлён: {lead.updated_at}
Последнее действие: {lead.last_interaction_at}"""


def events_text(events, telegram_id: int | None) -> str:
    title = f"Events for {telegram_id}" if telegram_id else "Последние события"
    if not events:
        return f"{title}\n\nПока пусто."
    lines = [title]
    for event in events:
        payload = event.event_payload
        safe_payload = {key: mask_sensitive(str(value)) for key, value in payload.items()}
        lines.append(f"\n{event.created_at} {event.event_type}\npayload: {safe_payload}")
    return "\n".join(lines)


def stats_text(stats: dict) -> str:
    return f"""Статистика

Старты всего: {stats['starts_total']}
Старты YouTube: {stats['starts_youtube']}
Старты Telegram: {stats['starts_telegram']}
Завершили 2 вопроса: {stats['questions_completed']}
Получили набор материалов: {stats['bundle_delivered']}
Открыли полную инструкцию: {stats['playbook_opened']}
Начали заявку: {stats['applications_started']}
Отправили заявку: {stats['applications_submitted']}
Запросы помощи с Hermes: {stats['support_requests']}"""


async def webinar_admin_text(
    storage: VcStorage,
    settings: Settings,
) -> str:
    event_id = settings.webinar_event_id or "не настроен"
    phase = webinar_phase(settings)
    if settings.webinar_event_id is None:
        stats = {
            "registrations": 0,
            "by_source": {},
            "by_route": {},
            "reminder_24h": 0,
            "reminder_3h": 0,
            "reminder_15m": 0,
            "join_clicked": 0,
            "webinar_card_shown": 0,
            "webinar_registered": 0,
            "registration_conversion": 0.0,
            "join_click_conversion": 0.0,
        }
    else:
        stats = await storage.webinar_stats(settings.webinar_event_id)
    funnel_stats = await storage.stats()

    def groups(values: dict[str, int]) -> str:
        if not values:
            return "нет"
        return ", ".join(f"{key}: {value}" for key, value in values.items())

    return f"""Вебинар {event_id}

Режим: {phase}
Join URL настроен: {'да' if settings.webinar_join_url else 'нет'}
Replay URL настроен: {'да' if settings.webinar_replay_url else 'нет'}

Уникальные старты: {funnel_stats['unique_starts']}
Завершили роутер: {funnel_stats['router_completed']}
Получили bundle: {funnel_stats['bundle_delivered']}
Карточку увидели: {stats['webinar_card_shown']}
Зарегистрировались: {stats['webinar_registered']}

Регистрации: {stats['registrations']}
По источникам: {groups(stats['by_source'])}
По маршрутам: {groups(stats['by_route'])}

Напоминания 24h: {stats['reminder_24h']}
Напоминания 3h: {stats['reminder_3h']}
Напоминания 15m: {stats['reminder_15m']}
Клики на эфир: {stats['join_clicked']}

Конверсия в регистрацию: {stats['registration_conversion']:.1%}
Конверсия в клик на эфир: {stats['join_click_conversion']:.1%}"""


async def send_leads_csv(message: Message, storage: VcStorage) -> None:
    rows = await storage.export_leads_rows()
    columns = [
        "telegram_id", "username", "first_name", "lead_status", "lead_temperature",
        "raw_start_payload", "latest_start_payload", "source", "entry_surface",
        "entry_mode", "post_id", "post_slug", "cta_type", "segment", "pain",
        "intent", "application_context", "created_at", "updated_at", "sales_notified_at",
    ]
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=columns, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        row["application_context"] = mask_sensitive(row.get("application_context"))
        writer.writerow(row)
    filename = f"vc_funnel_leads_{datetime.now().strftime('%Y-%m-%d_%H-%M')}.csv"
    await message.answer_document(BufferedInputFile(buffer.getvalue().encode("utf-8"), filename=filename))


async def handle_material_wizard_text(message: Message, storage: VcStorage, wizards: dict[int, dict[str, object]], text: str) -> bool:
    state = wizards.get(message.from_user.id)  # type: ignore[union-attr]
    if state is None:
        return False
    data = state["data"]  # type: ignore[assignment]
    step = state["step"]
    if step == "key":
        data["material_key"] = text.strip()
        state["step"] = "title"
        await message.answer("Введи название материала.")
        return True
    if step == "title":
        data["title"] = text.strip()
        state["step"] = "body"
        await message.answer("Введи короткое описание/текст материала.\n\nМожно написать `-`, если описания нет.")
        return True
    if step == "body":
        data["body"] = None if text == "-" else text
        state["step"] = "url"
        await message.answer("Вставь ссылку на материал.\n\nМожно написать `-`, если ссылки нет.")
        return True
    if step == "url":
        data["url"] = None if text == "-" else text
        state["step"] = "file"
        await message.answer("Теперь можешь отправить файл/документ/картинку/видео для этого материала.\n\nМожно написать `-`, если файла нет.")
        return True
    if step == "file":
        if text != "-":
            await message.answer("Отправь файл или напиши `-`, если файла нет.")
            return True
        state["step"] = "payloads"
        await message.answer("К каким payload привязать материал?\n\nВведи payload через запятую.")
        return True
    if step == "payloads":
        payloads = [normalize_payload(part.strip()) or part.strip() for part in text.split(",") if part.strip()]
        material = await storage.upsert_material(**data)  # type: ignore[arg-type]
        for payload in payloads:
            await storage.bind_material(payload, material.material_key)
        await storage.add_event(message.from_user.id, "admin_material_created", {"material_key": material.material_key, "payloads": payloads})  # type: ignore[union-attr]
        wizards.pop(message.from_user.id, None)  # type: ignore[arg-type]
        await message.answer(f"Материал сохранён.\n\nMaterial key: {material.material_key}\nTitle: {material.title}\nURL: {'yes' if material.url else 'no'}\nFile: {'yes' if material.telegram_file_id else 'no'}\n\nPayloads:\n" + "\n".join(f"- {payload}" for payload in payloads))
        return True
    return False


async def handle_material_wizard_media(message: Message, wizards: dict[int, dict[str, object]]) -> None:
    state = wizards.get(message.from_user.id)  # type: ignore[union-attr]
    if state is None or state["step"] != "file":
        return
    data = state["data"]  # type: ignore[assignment]
    if message.document:
        data.update({"telegram_file_id": message.document.file_id, "telegram_file_type": "document", "telegram_file_name": message.document.file_name})
    elif message.photo:
        data.update({"telegram_file_id": message.photo[-1].file_id, "telegram_file_type": "photo", "telegram_file_name": None})
    elif message.video:
        data.update({"telegram_file_id": message.video.file_id, "telegram_file_type": "video", "telegram_file_name": message.video.file_name})
    elif message.animation:
        data.update({"telegram_file_id": message.animation.file_id, "telegram_file_type": "animation", "telegram_file_name": message.animation.file_name})
    state["step"] = "payloads"
    await message.answer("Файл сохранён. К каким payload привязать материал?\n\nВведи payload через запятую.")
