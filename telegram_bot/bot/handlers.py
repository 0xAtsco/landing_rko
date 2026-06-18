from __future__ import annotations

import re

from aiogram import Bot, F, Router
from aiogram.exceptions import TelegramAPIError
from aiogram.filters import Command, CommandObject, CommandStart
from aiogram.types import CallbackQuery, Message, ReplyKeyboardRemove
from sqlalchemy.ext.asyncio import async_sessionmaker

from .config import Settings
from .db import Lead
from .keyboards import (
    Q1_OPTIONS,
    admin_keyboard,
    apply_keyboard,
    contact_keyboard,
    q1_keyboard,
    start_keyboard,
)
from .messages import (
    CONTACT_TEXT,
    FINAL_TEXT,
    FIRST_SCREEN_TEXT,
    INVALID_CONTACT_TEXT,
    Q1_TEXT,
)
from .repository import (
    STATUS_ANSWERED_Q1,
    STATUS_CLICKED_APPLY,
    STATUS_CONTACT_SHARED,
    STATUS_CONTACT_TEXT_PROVIDED,
    add_event,
    get_lead_by_telegram_id,
    now_local,
    touch_lead_from_user,
    update_status,
    upsert_lead_from_user,
)
from .sheets_sync import GoogleSheetsSync


USERNAME_RE = re.compile(
    r"(?:@|(?:https?://)?t(?:elegram)?\.me/)?([A-Za-z0-9_]{5,32})/?"
)


def create_router(
    session_factory: async_sessionmaker,
    settings: Settings,
    sheets_sync: GoogleSheetsSync,
) -> Router:
    router = Router(name="rko_leads")

    @router.message(CommandStart())
    async def start(message: Message, command: CommandObject) -> None:
        if message.from_user is None:
            return

        payload = (command.args or "").strip() or None
        async with session_factory() as session:
            await upsert_lead_from_user(
                session=session,
                settings=settings,
                user=message.from_user,
                chat_id=message.chat.id,
                start_payload=payload,
            )
            await session.commit()

        await sheets_sync.sync_lead_id(
            session_factory,
            message.from_user.id,
            "lead_started",
        )
        await message.answer(FIRST_SCREEN_TEXT, reply_markup=start_keyboard())

    @router.callback_query(F.data == "lead:apply")
    async def apply(callback: CallbackQuery) -> None:
        if callback.from_user is None or callback.message is None:
            return

        async with session_factory() as session:
            lead = await touch_lead_from_user(
                session=session,
                settings=settings,
                user=callback.from_user,
                chat_id=callback.message.chat.id,
            )
            await update_status(
                session,
                settings,
                lead,
                STATUS_CLICKED_APPLY,
                "clicked_apply",
            )
            await session.commit()

        await sheets_sync.sync_lead_id(
            session_factory,
            callback.from_user.id,
            "clicked_apply",
        )
        await callback.answer()
        await callback.message.answer(Q1_TEXT, reply_markup=q1_keyboard())

    @router.callback_query(F.data.startswith("q1:"))
    async def answer_q1(callback: CallbackQuery) -> None:
        if callback.from_user is None or callback.message is None or callback.data is None:
            return

        code = callback.data.split(":", 1)[1]
        answer = Q1_OPTIONS.get(code)
        if answer is None:
            await callback.answer("Не понял ответ. Нажми кнопку ещё раз.", show_alert=True)
            return

        async with session_factory() as session:
            lead = await touch_lead_from_user(
                session=session,
                settings=settings,
                user=callback.from_user,
                chat_id=callback.message.chat.id,
            )
            lead.q1_business_status = answer
            await update_status(
                session,
                settings,
                lead,
                STATUS_ANSWERED_Q1,
                "answered_q1",
                {"answer": answer},
            )
            await session.commit()

        await sheets_sync.sync_lead_id(
            session_factory,
            callback.from_user.id,
            "answered_q1",
        )
        await callback.answer()
        await callback.message.answer(CONTACT_TEXT, reply_markup=contact_keyboard())

    @router.message(F.contact)
    async def contact_shared(message: Message, bot: Bot) -> None:
        if message.from_user is None or message.contact is None:
            return

        async with session_factory() as session:
            lead = await touch_lead_from_user(
                session=session,
                settings=settings,
                user=message.from_user,
                chat_id=message.chat.id,
            )
            lead.phone = message.contact.phone_number
            await update_status(
                session,
                settings,
                lead,
                STATUS_CONTACT_SHARED,
                "contact_shared",
                {"phone": message.contact.phone_number},
            )
            await session.commit()

        await sheets_sync.sync_lead_id(
            session_factory,
            message.from_user.id,
            "contact_shared",
        )
        await message.answer(FINAL_TEXT, reply_markup=ReplyKeyboardRemove())
        await notify_admin(bot, session_factory, settings, message.from_user.id)

    @router.message(Command("reply"))
    async def admin_reply(message: Message, command: CommandObject, bot: Bot) -> None:
        if not is_admin_chat(message.chat.id, settings):
            await message.answer("Команда доступна только из админ-чата.")
            return

        args = (command.args or "").strip()
        if not args or " " not in args:
            await message.answer("Формат: /reply <telegram_id> <текст>")
            return

        telegram_id_raw, text = args.split(" ", 1)
        try:
            telegram_id = int(telegram_id_raw)
        except ValueError:
            await message.answer("telegram_id должен быть числом.")
            return

        async with session_factory() as session:
            lead = await get_lead_by_telegram_id(session, telegram_id)
            if lead is None:
                await message.answer("Лид не найден.")
                return

            try:
                await bot.send_message(chat_id=lead.chat_id, text=text)
            except TelegramAPIError as exc:
                await add_event(
                    session,
                    settings,
                    lead,
                    "admin_reply_failed",
                    {"error": str(exc)},
                    admin_chat_id=message.chat.id,
                )
                await session.commit()
                await message.answer(f"Не удалось отправить: {exc}")
                return

            await add_event(
                session,
                settings,
                lead,
                "admin_reply_sent",
                {"text": text},
                admin_chat_id=message.chat.id,
            )
            await session.commit()

        await sheets_sync.sync_lead_id(
            session_factory,
            telegram_id,
            "admin_reply_sent",
        )
        await message.answer("Отправлено.")

    @router.message(Command("chat_id", "id"))
    async def show_chat_id(message: Message) -> None:
        user_id = message.from_user.id if message.from_user else "нет"
        await message.answer(
            f"chat_id: {message.chat.id}\ntelegram_id: {user_id}"
        )

    @router.message(Command("sync_sheet"))
    async def sync_sheet(message: Message) -> None:
        if not is_admin_chat(message.chat.id, settings):
            await message.answer("Команда доступна только из админ-чата.")
            return

        enabled, count = await sheets_sync.sync_all_leads(session_factory)
        if not enabled:
            await message.answer(
                "Google Sheet ещё не подключён. Проверь GOOGLE_SHEET_ID, "
                "GOOGLE_SERVICE_ACCOUNT_FILE и доступ service account к таблице."
            )
            return

        await message.answer(f"Готово. В Google Sheet синхронизировано лидов: {count}.")

    @router.callback_query(F.data.startswith("admin:"))
    async def admin_action(callback: CallbackQuery) -> None:
        if callback.message is None or callback.data is None:
            return

        if not is_admin_chat(callback.message.chat.id, settings):
            await callback.answer("Нет доступа.", show_alert=True)
            return

        parts = callback.data.split(":")
        if len(parts) != 3:
            await callback.answer("Не понял действие.", show_alert=True)
            return

        _, action, telegram_id_raw = parts
        try:
            telegram_id = int(telegram_id_raw)
        except ValueError:
            await callback.answer("Некорректный telegram_id.", show_alert=True)
            return

        if action == "reply_hint":
            await callback.answer()
            await callback.message.answer(
                f"Команда для ответа:\n/reply {telegram_id} Текст сообщения"
            )
            return

        allowed_statuses = {
            "in_work": "in_work",
            "qualified": "qualified",
            "rejected": "rejected",
        }
        status = allowed_statuses.get(action)
        if status is None:
            await callback.answer("Не понял действие.", show_alert=True)
            return

        async with session_factory() as session:
            lead = await get_lead_by_telegram_id(session, telegram_id)
            if lead is None:
                await callback.answer("Лид не найден.", show_alert=True)
                return

            await update_status(
                session,
                settings,
                lead,
                status,
                "admin_action",
                {"action": action},
                admin_chat_id=callback.message.chat.id,
            )
            await session.commit()

        await sheets_sync.sync_lead_id(
            session_factory,
            telegram_id,
            f"admin_{action}",
        )
        await callback.answer(f"Статус: {status}")

    @router.message(F.text)
    async def text_contact(message: Message, bot: Bot) -> None:
        if message.from_user is None or message.text is None:
            return

        async with session_factory() as session:
            lead = await touch_lead_from_user(
                session=session,
                settings=settings,
                user=message.from_user,
                chat_id=message.chat.id,
            )

            if lead.status != STATUS_ANSWERED_Q1:
                await session.commit()
                await message.answer(FIRST_SCREEN_TEXT, reply_markup=start_keyboard())
                return

            text = message.text.strip()

            username = extract_manual_username(text)
            if not username:
                await add_event(
                    session,
                    settings,
                    lead,
                    "invalid_contact_text",
                    {"text": text},
                )
                await session.commit()
                await message.answer(INVALID_CONTACT_TEXT, reply_markup=contact_keyboard())
                return

            lead.contact_text = text
            lead.manual_username = username
            lead.contact_preference = "username"

            await update_status(
                session,
                settings,
                lead,
                STATUS_CONTACT_TEXT_PROVIDED,
                "contact_text_provided",
                {"text": text},
            )
            await session.commit()

        await sheets_sync.sync_lead_id(
            session_factory,
            message.from_user.id,
            "contact_text_provided",
        )
        await message.answer(FINAL_TEXT, reply_markup=ReplyKeyboardRemove())
        await notify_admin(bot, session_factory, settings, message.from_user.id)

    return router


def is_admin_chat(chat_id: int, settings: Settings) -> bool:
    return settings.admin_chat_id is not None and chat_id == settings.admin_chat_id


def extract_manual_username(text: str) -> str | None:
    candidate = text.strip()
    match = USERNAME_RE.fullmatch(candidate)
    if not match:
        return None
    return f"@{match.group(1)}"


async def notify_admin(
    bot: Bot,
    session_factory: async_sessionmaker,
    settings: Settings,
    telegram_id: int,
) -> None:
    async with session_factory() as session:
        lead = await get_lead_by_telegram_id(session, telegram_id)
        if lead is None:
            return

        if settings.admin_chat_id is None:
            await add_event(
                session,
                settings,
                lead,
                "admin_notification_skipped",
                {"reason": "ADMIN_CHAT_ID is not set"},
            )
            await session.commit()
            return

        message = build_admin_message(lead)
        try:
            await bot.send_message(
                chat_id=settings.admin_chat_id,
                text=message,
                reply_markup=admin_keyboard(lead.telegram_id),
            )
        except TelegramAPIError as exc:
            await add_event(
                session,
                settings,
                lead,
                "admin_notification_failed",
                {"error": str(exc)},
                admin_chat_id=settings.admin_chat_id,
            )
            await session.commit()
            return

        await add_event(
            session,
            settings,
            lead,
            "admin_notification_sent",
            {"sent_at": now_local(settings).isoformat()},
            admin_chat_id=settings.admin_chat_id,
        )
        await session.commit()


def build_admin_message(lead: Lead) -> str:
    name = " ".join(part for part in [lead.first_name, lead.last_name] if part).strip() or "нет"
    username = f"@{lead.username}" if lead.username else lead.manual_username or "нет"
    phone = lead.phone or "нет"
    source = lead.source or lead.start_payload or "нет"
    contact_lines = []
    contact_username = lead.username or (
        lead.manual_username.lstrip("@") if lead.manual_username else None
    )

    if contact_username:
        contact_lines.append(f"https://t.me/{contact_username}")
    else:
        contact_lines.append("Username нет")

    if lead.phone:
        contact_lines.append(f"Телефон: {lead.phone}")

    contact_block = "\n".join(f"* {line}" for line in contact_lines)

    return f"""Новая заявка: ИИ + РКО

Имя: {name}
Telegram ID: {lead.telegram_id}
Username: {username}
Телефон: {phone}
Источник: {source}
Статус: {lead.status}

Ответы:

1. Работа с РКО/лидами: {lead.q1_business_status or "нет"}

Связаться:

{contact_block}"""
