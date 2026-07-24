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
    HERMES_QUESTION_1,
    HERMES_QUESTION_2_GENERAL,
    HERMES_QUESTION_2_SETUP,
    HERMES_SETUP_CONTEXT_BY_CALLBACK,
    HERMES_STAGE_BY_CALLBACK,
    HERMES_START_MESSAGE,
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
    hermes_q1_keyboard,
    hermes_q2_general_keyboard,
    hermes_q2_setup_keyboard,
    hermes_result_actions_keyboard,
    materials_actions_keyboard,
    q1_keyboard,
    q2_keyboard,
    result_actions_keyboard,
    unsafe_continue_keyboard,
    unknown_text_keyboard,
    vc_interest_keyboard,
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
    HERMES_CHANNEL_REPLY,
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
)
from .models import Lead
from .notifier import SupportAttachment, notify_sales
from .rendering import BotScreenRenderer
from .safety import contains_unsafe_data, mask_sensitive as mask_sensitive_text
from .source_parser import parse_start_payload, parse_text_trigger
from .storage import VcStorage


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

        lead = await storage.upsert_lead(
            telegram_id=message.from_user.id,
            username=message.from_user.username,
            first_name=message.from_user.first_name,
            source=parse_start_payload((command.args or "").strip() or None),
        )
        renderer = BotScreenRenderer(bot, storage, settings)
        await route_entry(renderer, storage, settings, lead)

    @router.message(Command("reset_vc"))
    async def reset_vc(message: Message) -> None:
        if message.from_user is None:
            return
        reset_done = await storage.reset_lead_for_test(message.from_user.id)
        await message.answer(RESET_DONE_TEXT if reset_done else RESET_EMPTY_TEXT)

    @router.message(Command("menu"))
    async def menu(message: Message, bot: Bot) -> None:
        lead = await ensure_lead_from_message(message, storage, parse_start_payload(None))
        await show_universal_start(BotScreenRenderer(bot, storage, settings), storage, lead, None)

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
    async def help_command(message: Message) -> None:
        await message.answer(HELP_TEXT, reply_markup=direct_start_keyboard())

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
        await message.answer(lead_card_text(lead), reply_markup=admin_lead_keyboard(lead.telegram_id))

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
        if lead is None or lead.intent != "setup_support":
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
    async def contact_shared(message: Message) -> None:
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
        await storage.save_contact(lead.telegram_id, contact[:120])
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

        if contains_unsafe_data(text):
            await show_unsafe_warning(renderer, storage, lead)
            return

        if lead.lead_status == "review_context_requested":
            await handle_review_context(renderer, bot, storage, settings, lead, text)
            return

        if is_terminal_lead(lead):
            combined = "\n\n".join(part for part in (lead.application_context, text[:1200]) if part)
            lead = await storage.save_application_context(lead.telegram_id, combined[-2400:])
            await storage.add_event(lead.telegram_id, "application_context_appended_after_sales")
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

    if is_terminal_lead(lead):
        await show_returning_after_sales(renderer, lead, settings, source_message)
        return

    if lead.source_type == "unknown" and lead.raw_start_payload:
        await storage.add_event(lead.telegram_id, "unknown_payload_routed", {"payload": lead.raw_start_payload})
        await show_universal_start(renderer, storage, lead, source_message)
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
            "hermes_route_started",
            {
                "payload": payload,
                "post_topic": lead.post_topic,
                "returning_terminal_lead": True,
            },
        )
    else:
        lead = await storage.set_status(
            lead.telegram_id,
            "qual_started",
            "hermes_route_started",
            {
                "payload": payload,
                "post_topic": lead.post_topic,
            },
            temperature="warm",
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
        lead = await storage.save_answer(lead.telegram_id, "pain", pain)
        await storage.add_event(
            lead.telegram_id,
            "hermes_bottleneck_selected",
            {"pain": pain},
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
        lead = await storage.save_answer(lead.telegram_id, "segment", segment)
        track = hermes_track(lead.pain, segment)
        lead = await storage.save_answer(lead.telegram_id, "intent", track)
        await storage.add_event(
            lead.telegram_id,
            "hermes_context_selected",
            {
                "pain": lead.pain,
                "segment": segment,
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

    if data == "hb:channel":
        await storage.add_event(
            lead.telegram_id,
            "hermes_channel_clicked",
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

    if data == "hb:apply":
        intent = "setup_support" if lead.pain == "setup" else "apply"
        lead = await storage.save_answer(lead.telegram_id, "intent", intent)
        await storage.add_event(
            lead.telegram_id,
            "hermes_apply_clicked",
            {
                "intent": intent,
                "pain": lead.pain,
                "segment": lead.segment,
            },
        )
        if is_terminal_lead(lead):
            await renderer.render_screen(
                lead=lead,
                text=HERMES_APPLY_PROMPT,
                source_message=source_message,
            )
        else:
            await start_review_request(
                renderer,
                storage,
                lead,
                HERMES_APPLY_PROMPT,
                source_message,
            )
        return

    await storage.add_event(
        lead.telegram_id,
        "unknown_hermes_callback",
        {"data": data},
    )
    await renderer.render_screen(
        lead=lead,
        text=f"{HERMES_START_MESSAGE}\n\n{HERMES_QUESTION_1}",
        reply_markup=hermes_q1_keyboard(),
        source_message=source_message,
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
    if not is_terminal_lead(lead):
        lead = await storage.mark_qual_completed(lead.telegram_id)
    await storage.add_event(
        lead.telegram_id,
        "hermes_route_completed",
        {
            "track": track,
            "materials_requested": delivery.requested,
            "materials_delivered": delivery.delivered,
        },
    )
    await renderer.render_screen(
        lead=lead,
        text="Выберите следующий шаг.",
        reply_markup=hermes_result_actions_keyboard(),
        mode="send_new",
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
    return lead.call_requested or lead.sales_notified or lead.lead_status in {"call_requested", "sales_notified"}


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
    if is_terminal_lead(lead):
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
        await storage.add_event(
            lead.telegram_id,
            "application_context_appended_after_sales",
            {"media": True},
        )
        await renderer.render_screen(
            lead=lead,
            text=FINAL_SAVED_APPLICATION_TEXT,
            mode="send_new",
        )
        return

    if lead.lead_status != "review_context_requested":
        return

    lead = await storage.save_application_context(lead.telegram_id, context)
    await storage.add_event(
        lead.telegram_id,
        "application_context_submitted",
        {
            "length": len(context),
            "media": True,
            "file_type": attachment.telegram_file_type,
        },
    )
    sent = await notify_sales(
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
            SUPPORT_CONTEXT_RECEIVED_TEXT
            if sent
            else SALES_DELIVERY_PENDING_TEXT
        ),
        mode="send_new",
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
            [InlineKeyboardButton(text="Deep links", callback_data="admin:links")],
            [InlineKeyboardButton(text="Материалы", callback_data="admin:materials")],
            [InlineKeyboardButton(text="Hermes readiness", callback_data="admin:hermes_readiness")],
            [InlineKeyboardButton(text="Пользователи", callback_data="admin:leads")],
            [InlineKeyboardButton(text="Статистика", callback_data="admin:stats")],
            [InlineKeyboardButton(text="Preview payload", callback_data="admin:preview")],
            [InlineKeyboardButton(text="Export CSV", callback_data="admin:export")],
        ]
    )


def admin_materials_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Добавить материал", callback_data="admin:material_add_hint")],
            [InlineKeyboardButton(text="Hermes readiness", callback_data="admin:hermes_readiness")],
            [InlineKeyboardButton(text="Preview payload", callback_data="admin:preview")],
            [InlineKeyboardButton(text="Deep links", callback_data="admin:links")],
        ]
    )


def admin_preview_keyboard(payload: str) -> InlineKeyboardMarkup | None:
    if not payload:
        return None
    return InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="Deep links", callback_data="admin:links")]])


def admin_leads_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="Export CSV", callback_data="admin:export")], [InlineKeyboardButton(text="Stats", callback_data="admin:stats")]])


def admin_lead_keyboard(telegram_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="Events", callback_data=f"admin:events:{telegram_id}")], [InlineKeyboardButton(text="Back to leads", callback_data="admin:leads")]])


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


async def material_status(storage: VcStorage, settings: Settings, payload: str) -> str:
    material = await resolve_material(storage, settings, payload=payload)
    return material.status if material.has_content else "missing"


async def admin_links_text(storage: VcStorage, settings: Settings) -> str:
    lines = ["Deep links"]
    if not settings.bot_username:
        lines.append("\nVC_BOT_USERNAME не задан. Укажи username бота в .env, чтобы генерировать ссылки.")
    readiness = await material_readiness(
        storage,
        settings,
        HERMES_MATERIAL_KEYS,
    )
    loaded = sum(status == "loaded" for status in readiness.values())
    lines.append(
        "\nHermes Bottleneck Router:"
        f"\n- {HERMES_PAYLOAD}"
        "\n  entry: hermes_bottleneck"
        f"\n  materials: {loaded}/{len(HERMES_MATERIAL_KEYS)} loaded"
        f"\n  link: {link_for(settings, HERMES_PAYLOAD)}"
    )
    for group in ("andrey_main", "youtube", "telegram", "private_channel"):
        lines.append(f"\n{group}:")
        for payload, definition in PAYLOAD_CATALOG.items():
            if definition.group != group or payload == HERMES_PAYLOAD:
                continue
            lines.append(
                f"- {payload}\n  entry: {definition.entry_mode}\n  material: {definition.material_key or 'нет'} / {await material_status(storage, settings, payload)}\n  link: {link_for(settings, payload)}"
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
    bindings = await storage.list_material_bindings()
    keys = sorted(set(MATERIAL_CATALOG) | set(sqlite_materials))
    lines = ["Материалы"]
    for index, key in enumerate(keys, start=1):
        material = sqlite_materials.get(key)
        fallback = MATERIAL_CATALOG.get(key)
        payloads = [payload for payload, definition in PAYLOAD_CATALOG.items() if definition.material_key == key]
        payloads += [payload for payload, bound_key in bindings.items() if bound_key == key and payload not in payloads]
        status = "configured" if material and material.is_active else "env fallback" if fallback and (fallback.body or (fallback.env_url_name and _fallback_url(settings, fallback.env_url_name))) else "missing"
        lines.append(
            f"\n{index}. {key}\nTitle: {(material.title if material else fallback.title if fallback else key)}\nStatus: {status}\nURL: {'yes' if (material and material.url) or (fallback and _fallback_url(settings, fallback.env_url_name)) else 'no'}\nFile: {'yes' if material and material.telegram_file_id else 'no'}\nPayloads:\n"
            + "\n".join(f"- {payload}" for payload in payloads or ["нет"])
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
        return "Последние пользователи\n\nПока пусто."
    lines = ["Последние пользователи"]
    for index, lead in enumerate(leads, start=1):
        username = f"@{lead.username}" if lead.username else "username закрыт"
        lines.append(f"\n{index}. {lead.telegram_id} {username} {lead.first_name or ''}\nstatus: {lead.lead_status} / {lead.lead_temperature}\npayload: {lead.latest_start_payload or lead.raw_start_payload or 'нет'}\nupdated: {lead.updated_at}")
    return "\n".join(lines)


def mask_sensitive(text: str | None) -> str:
    return mask_sensitive_text(text)


def lead_card_text(lead: Lead) -> str:
    return f"""Lead {lead.telegram_id}

Username: {('@' + lead.username) if lead.username else 'нет'}
First name: {lead.first_name or 'нет'}

Status: {lead.lead_status}
Temperature: {lead.lead_temperature}

Original payload: {lead.raw_start_payload or 'нет'}
Latest payload: {lead.latest_start_payload or 'нет'}
Entry mode: {lead.entry_mode}
Source: {lead.source}
Entry surface: {lead.entry_surface}
Post id: {lead.post_id or 'нет'}
Post slug: {lead.post_slug or 'нет'}
CTA type: {lead.cta_type}

Segment: {lead.segment or 'нет'}
Pain: {lead.pain or 'нет'}
VC interest: {lead.intent or 'нет'}

Context:
{mask_sensitive(lead.application_context)}

Created: {lead.created_at}
Updated: {lead.updated_at}
Sales notified: {lead.sales_notified_at or 'нет'}"""


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
    lines = [
        "Stats",
        "",
        f"Total leads: {stats['total_leads']}",
        f"Today leads: {stats['today_leads']}",
        f"Call requested: {stats['call_requested']}",
        f"Sales notified: {stats['sales_notified']}",
        "",
        "By status:",
    ]
    lines += [f"- {label}: {total}" for label, total in stats["by_status"]]
    lines.append("\nBy payload:")
    lines += [f"- {label}: {total}" for label, total in stats["by_payload"]]
    lines.append("\nHermes conversion (unique users):")
    lines += [
        f"- {label}: {total}"
        for label, total in stats.get("hermes_funnel", [])
    ]
    return "\n".join(lines)


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
