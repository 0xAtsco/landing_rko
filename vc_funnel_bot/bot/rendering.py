from __future__ import annotations

import asyncio
from typing import Literal

from aiogram import Bot
from aiogram.enums import ChatAction
from aiogram.exceptions import TelegramAPIError, TelegramBadRequest
from aiogram.types import InlineKeyboardMarkup, Message

from .config import Settings
from .materials import ResolvedMaterial
from .models import Lead
from .storage import VcStorage


async def typing_pause(bot: Bot, settings: Settings, chat_id: int, seconds: float | None = None) -> None:
    if not settings.ux_typing_delay_enabled or settings.ux_typing_delay_test_mode:
        return
    try:
        await bot.send_chat_action(chat_id=chat_id, action=ChatAction.TYPING)
    except TelegramAPIError:
        pass
    await asyncio.sleep(settings.ux_typing_delay_seconds if seconds is None else seconds)


class BotScreenRenderer:
    def __init__(self, bot: Bot, storage: VcStorage, settings: Settings) -> None:
        self.bot = bot
        self.storage = storage
        self.settings = settings

    async def render_screen(
        self,
        *,
        lead: Lead,
        text: str,
        reply_markup: InlineKeyboardMarkup | None = None,
        source_message: Message | None = None,
        mode: Literal["edit_or_send", "send_new"] = "edit_or_send",
        cleanup: bool = True,
        typing: bool = True,
        persistent: bool = False,
    ) -> Message:
        if typing:
            await typing_pause(self.bot, self.settings, lead.telegram_id)

        rendered: Message | None = None
        edited = False
        if mode == "edit_or_send" and source_message is not None:
            try:
                rendered = await source_message.edit_text(text, reply_markup=reply_markup)
                edited = True
            except TelegramBadRequest as exc:
                if "message is not modified" in str(exc).lower():
                    rendered = source_message
                    edited = True
                else:
                    await self.storage.add_event(lead.telegram_id, "screen_edit_failed_send_new")
            except TelegramAPIError:
                await self.storage.add_event(lead.telegram_id, "screen_edit_failed_send_new")

        if rendered is None:
            if (cleanup or persistent) and source_message is not None:
                await self._remove_stale_keyboard(lead, source_message)
            rendered = await self.bot.send_message(
                chat_id=lead.telegram_id,
                text=text,
                reply_markup=reply_markup,
            )

        message_id = getattr(rendered, "message_id", None)
        if isinstance(message_id, int) and not persistent:
            await self.storage.remember_bot_screen(lead.telegram_id, message_id)
            if cleanup and not edited and self.settings.cleanup_old_bot_messages:
                await self._cleanup_old_screens(lead.telegram_id, keep_message_id=message_id)

        await self.storage.add_event(
            lead.telegram_id,
            "screen_rendered",
            {"edited": edited, "persistent": persistent},
        )
        return rendered

    async def render_material(
        self,
        *,
        lead: Lead,
        material: ResolvedMaterial,
        text: str,
        reply_markup: InlineKeyboardMarkup | None = None,
        source_message: Message | None = None,
        persistent: bool = False,
    ) -> Message:
        if not material.telegram_file_id or not material.telegram_file_type:
            return await self.render_screen(
                lead=lead,
                text=text,
                reply_markup=reply_markup,
                source_message=source_message,
                mode="send_new" if persistent else "edit_or_send",
                persistent=persistent,
            )

        await typing_pause(self.bot, self.settings, lead.telegram_id)
        if source_message is not None:
            await self._remove_stale_keyboard(lead, source_message)

        sender = {
            "document": self.bot.send_document,
            "photo": self.bot.send_photo,
            "video": self.bot.send_video,
            "animation": self.bot.send_animation,
        }.get(material.telegram_file_type, self.bot.send_document)
        kwargs = {
            "chat_id": lead.telegram_id,
            material.telegram_file_type if material.telegram_file_type in {"photo", "video", "animation"} else "document": material.telegram_file_id,
            "caption": material.telegram_caption or text,
            "reply_markup": reply_markup,
        }
        rendered = await sender(**kwargs)
        message_id = getattr(rendered, "message_id", None)
        if isinstance(message_id, int) and not persistent:
            await self.storage.remember_bot_screen(lead.telegram_id, message_id)
            if self.settings.cleanup_old_bot_messages:
                await self._cleanup_old_screens(lead.telegram_id, keep_message_id=message_id)
        await self.storage.add_event(
            lead.telegram_id,
            "screen_rendered",
            {
                "edited": False,
                "attachment": True,
                "persistent": persistent,
            },
        )
        return rendered

    async def _remove_stale_keyboard(self, lead: Lead, message: Message) -> None:
        try:
            await message.edit_reply_markup(reply_markup=None)
        except TelegramAPIError:
            return
        await self.storage.add_event(lead.telegram_id, "stale_keyboard_removed")

    async def _cleanup_old_screens(self, telegram_id: int, *, keep_message_id: int) -> None:
        lead = await self.storage.get_lead(telegram_id)
        if lead is None:
            return
        keep = max(1, self.settings.keep_last_bot_messages)
        protected = set(lead.bot_screen_message_ids[-keep:])
        protected.add(keep_message_id)
        stale_ids = [mid for mid in lead.bot_screen_message_ids if mid not in protected]

        removed: list[int] = []
        for message_id in stale_ids:
            try:
                await self.bot.delete_message(chat_id=telegram_id, message_id=message_id)
                removed.append(message_id)
            except TelegramAPIError:
                await self.storage.add_event(telegram_id, "bot_message_cleanup_failed", {"message_id": message_id})

        if removed:
            await self.storage.forget_bot_screens(telegram_id, removed)
