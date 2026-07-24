from __future__ import annotations

import logging
from collections.abc import Iterable
from dataclasses import dataclass

from aiogram import Bot
from aiogram.exceptions import TelegramAPIError

from .messages import human_source
from .models import Lead
from .safety import mask_sensitive
from .storage import VcStorage


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class SupportAttachment:
    telegram_file_id: str
    telegram_file_type: str
    telegram_file_name: str | None = None
    caption: str | None = None


def _yes_no(value: bool) -> str:
    return "yes" if value else "no"


def build_sales_message(lead: Lead, *, updated: bool = False) -> str:
    prefix = "UPDATED: " if updated else ""
    is_support = lead.intent == "setup_support"
    heading = (
        "🛠 Новое обращение в поддержку Hermes"
        if is_support
        else "🔥 Новый лид на созвон VC"
    )
    username = f"@{lead.username}" if lead.username else "username закрыт"
    pain = lead.pain or "не указано"
    contact = lead.contact or (f"@{lead.username}" if lead.username else "нет")
    next_step = (
        "Проверить этап установки и ответить пользователю в Telegram."
        if is_support
        else "Написать лично и назначить короткий разбор."
    )
    opening = (
        "“Привет. Видел обращение по установке Hermes. Уточню несколько "
        "деталей и помогу найти шаг, на котором возникла ошибка.”"
        if is_support
        else (
            f"“Привет. Видел, ты пришёл из {human_source(lead)} и отметил: "
            f"{pain}. Можем коротко разобрать, какую связку тебе стоит "
            "собрать первой?”"
        )
    )

    return f"""{prefix}{heading}

Источник: {lead.source} ({lead.source_type} / {lead.source_channel})
Поверхность: {lead.entry_surface}
Entry mode: {lead.entry_mode}
Кампания: {lead.campaign}
CJM: {lead.cjm}
CTA: {lead.cta_type}
Payload: {lead.raw_start_payload or "нет"}
Post: {lead.post_id or "нет"} / {lead.post_slug or "нет"}
Post topic: {lead.post_topic or "нет"}

Telegram: {username} / id={lead.telegram_id}
Имя: {lead.first_name or "нет"}
Контакт: {contact}

Статус: {lead.lead_status}
Температура: {lead.lead_temperature}

Hermes bottleneck: {pain}
Current asset / OS: {lead.segment or "нет"}
Intent: {lead.intent or "нет"}
Application / support context: {mask_sensitive(lead.application_context)}

Материалы: {_yes_no(lead.materials_sent)}
Приватный канал: {_yes_no(lead.private_channel_sent)}

Следующий шаг:
{next_step}

Повод для первого сообщения:
{opening}"""


async def notify_sales(
    *,
    bot: Bot,
    storage: VcStorage,
    lead: Lead,
    sales_chat_id: int | None = None,
    sales_chat_ids: Iterable[int] | None = None,
    updated: bool = False,
    attachment: SupportAttachment | None = None,
) -> bool:
    if lead.sales_notified:
        await storage.add_event(lead.telegram_id, "sales_notification_duplicate_skipped")
        return False

    chat_ids = tuple(sales_chat_ids or ())
    if not chat_ids and sales_chat_id is not None:
        chat_ids = (sales_chat_id,)
    chat_ids = tuple(dict.fromkeys(chat_ids))

    if not chat_ids:
        logger.warning("VC sales notification skipped: VC_SALES_CHAT_ID is not configured")
        await storage.add_event(lead.telegram_id, "sales_notification_skipped_no_sales_chat")
        return False

    message = build_sales_message(lead, updated=updated)
    sent_any = False
    for chat_id in chat_ids:
        try:
            await bot.send_message(chat_id=chat_id, text=message)
            sent_any = True
            if attachment is not None:
                sender = {
                    "photo": bot.send_photo,
                    "document": bot.send_document,
                    "video": bot.send_video,
                    "animation": bot.send_animation,
                }.get(attachment.telegram_file_type, bot.send_document)
                field_name = (
                    attachment.telegram_file_type
                    if attachment.telegram_file_type
                    in {"photo", "video", "animation"}
                    else "document"
                )
                await sender(
                    **{
                        "chat_id": chat_id,
                        field_name: attachment.telegram_file_id,
                        "caption": attachment.caption,
                    }
                )
                await storage.add_event(
                    lead.telegram_id,
                    "support_attachment_sent",
                    {
                        "chat_id": chat_id,
                        "file_type": attachment.telegram_file_type,
                        "file_name": attachment.telegram_file_name,
                    },
                )
        except TelegramAPIError as exc:
            error_message = str(exc).replace("\n", " ")[:240]
            logger.warning(
                "VC sales notification failed for chat %s: %s: %s",
                chat_id,
                exc.__class__.__name__,
                error_message,
            )
            await storage.add_event(
                lead.telegram_id,
                "sales_notification_failed",
                {
                    "chat_id": chat_id,
                    "error_type": exc.__class__.__name__,
                    "error_message": error_message,
                },
            )

    if not sent_any:
        return False

    await storage.mark_sales_notified(lead.telegram_id)
    return True
