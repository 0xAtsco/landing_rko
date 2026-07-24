from __future__ import annotations

import logging
from collections.abc import Iterable
from dataclasses import dataclass

from aiogram import Bot
from aiogram.exceptions import TelegramAPIError

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


BOTTLENECK_LABELS = {
    "find_business": "Не знает, кому предложить",
    "offer": "Есть бизнес, не знает, что предложить",
    "build": "Есть задача, не получается собрать решение",
    "deal": "Решение есть, не получается довести до сделки",
    "setup": "Не получается запустить Hermes",
}

SITUATION_LABELS = {
    "warm_business_contacts": "Знакомые предприниматели",
    "rko_base": "РКО-клиенты или база",
    "channel_audience": "Канал или аудитория",
    "no_asset": "Нужен маршрут с нуля",
    "windows": "Windows: установка или запуск",
    "macos": "macOS: установка или запуск",
    "model": "Не подключается модель",
    "other": "Другая ошибка",
}

URGENCY_LABELS = {
    "7d": "В течение 7 дней",
    "30d": "В течение месяца",
    "undefined": "Срок пока не определён",
}

MATERIAL_LABELS = {
    "hermes_find_business_guide": "Кому предложить Hermes-аудит",
    "hermes_audit_workbook": "Рабочая книга Hermes-аудита",
    "hermes_offer_pack": "Предложение для бизнеса",
    "hermes_outreach_templates": "Шаблоны первого контакта",
    "hermes_audit_kit": "Комплект Hermes-аудита",
    "hermes_audit_prompt": "Промпт для аудита",
    "hermes_result_to_deal": "От отчёта к сделке и РКО",
    "hermes_presentation_script": "Сценарий презентации результата",
    "hermes_setup_windows_video": "Запуск на Windows",
    "hermes_setup_macos_video": "Запуск на macOS",
    "hermes_model_connection_video": "Подключение модели",
}


def material_labels(keys: Iterable[str]) -> list[str]:
    return [MATERIAL_LABELS.get(key, key) for key in keys]


def human_source_label(lead: Lead) -> str:
    if lead.source == "youtube" or lead.source_type == "youtube":
        return "YouTube"
    if lead.source == "telegram" or lead.source_type in {"telegram", "channel"}:
        return "Telegram"
    return "direct"


def _user_block(lead: Lead) -> str:
    username = f"@{lead.username}" if lead.username else "нет"
    contact = lead.contact or (f"@{lead.username}" if lead.username else "нет")
    return f"""Имя: {lead.first_name or "нет"}
Username: {username}
Telegram ID: {lead.telegram_id}
Контакт: {contact}"""


def build_sales_message(
    lead: Lead,
    *,
    delivered_materials: Iterable[str] = (),
    playbook_opened: bool = False,
    updated: bool = False,
) -> str:
    heading = (
        "🔥 ОБНОВЛЕНИЕ ЗАЯВКИ НА ПЛАН ЗАПУСКА"
        if updated
        else "🔥 НОВАЯ ЗАЯВКА НА ПЛАН ЗАПУСКА"
    )
    materials = ", ".join(material_labels(delivered_materials)) or "нет"
    return f"""{heading}

Источник: {human_source_label(lead)}
Узкое звено: {BOTTLENECK_LABELS.get(lead.pain or "", lead.pain or "не указано")}
Текущая ситуация: {SITUATION_LABELS.get(lead.segment or "", lead.segment or "не указано")}
Желаемый срок: {URGENCY_LABELS.get(lead.urgency or "", lead.urgency or "не указан")}
Полученные материалы: {materials}
Полный playbook открыт: {"да" if playbook_opened else "нет"}

Контекст:
{mask_sensitive(lead.application_context)}

Пользователь:
{_user_block(lead)}

Создано:
{lead.created_at}"""


def build_support_message(
    lead: Lead,
    *,
    delivered_materials: Iterable[str] = (),
) -> str:
    materials = ", ".join(material_labels(delivered_materials)) or "нет"
    return f"""🛠 ЗАПРОС НА ПОМОЩЬ С HERMES

Источник: {human_source_label(lead)}
Этап: {SITUATION_LABELS.get(lead.segment or "", lead.segment or "не указан")}
Полученные материалы: {materials}

Описание:
{mask_sensitive(lead.application_context)}

Пользователь:
{_user_block(lead)}

Создано:
{lead.created_at}"""


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

    delivered_materials, playbook_opened = await storage.delivery_details(
        lead.telegram_id
    )
    message = build_sales_message(
        lead,
        delivered_materials=delivered_materials,
        playbook_opened=playbook_opened,
        updated=updated,
    )
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


async def notify_support(
    *,
    bot: Bot,
    storage: VcStorage,
    lead: Lead,
    sales_chat_id: int | None = None,
    sales_chat_ids: Iterable[int] | None = None,
    attachment: SupportAttachment | None = None,
) -> bool:
    if lead.support_notified:
        await storage.add_event(
            lead.telegram_id,
            "support_notification_duplicate_skipped",
        )
        return False

    chat_ids = tuple(sales_chat_ids or ())
    if not chat_ids and sales_chat_id is not None:
        chat_ids = (sales_chat_id,)
    chat_ids = tuple(dict.fromkeys(chat_ids))
    if not chat_ids:
        logger.warning(
            "VC support notification skipped: recipient chat is not configured"
        )
        await storage.add_event(
            lead.telegram_id,
            "support_notification_skipped_no_chat",
        )
        return False

    delivered_materials, _ = await storage.delivery_details(lead.telegram_id)
    message = build_support_message(
        lead,
        delivered_materials=delivered_materials,
    )
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
        except TelegramAPIError as exc:
            logger.warning(
                "VC support notification failed for chat %s: %s",
                chat_id,
                exc.__class__.__name__,
            )
            await storage.add_event(
                lead.telegram_id,
                "support_notification_failed",
                {
                    "chat_id": chat_id,
                    "error_type": exc.__class__.__name__,
                },
            )

    if not sent_any:
        return False
    await storage.mark_support_notified(lead.telegram_id)
    return True
