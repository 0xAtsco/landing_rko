from __future__ import annotations

from dataclasses import dataclass

from aiogram import Bot
from aiogram.exceptions import TelegramAPIError


@dataclass(frozen=True)
class SubscriptionCheck:
    allowed: bool
    reason: str


async def check_channel_subscription(
    bot: Bot | None,
    *,
    chat_id: int | None,
    user_id: int,
) -> SubscriptionCheck:
    if bot is None or chat_id is None:
        return SubscriptionCheck(False, "misconfigured")
    try:
        member = await bot.get_chat_member(chat_id=chat_id, user_id=user_id)
    except TelegramAPIError:
        return SubscriptionCheck(False, "telegram_error")

    status = getattr(member.status, "value", member.status)
    if status in {"creator", "administrator", "member"}:
        return SubscriptionCheck(True, str(status))
    if status == "restricted" and bool(getattr(member, "is_member", False)):
        return SubscriptionCheck(True, "restricted_member")
    return SubscriptionCheck(False, str(status))
