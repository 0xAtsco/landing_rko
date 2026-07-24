from __future__ import annotations

import re


UNSAFE_DIGITS_RE = re.compile(r"(?:\d[\s-]?){13,19}")
UNSAFE_WORDS = (
    "паспорт",
    "номер карты",
    "банковск",
    "реквизит",
    "cvv",
    "cvc",
    "sms",
    "смс",
    "код из",
    "одноразовый код",
    "пароль",
    "токен",
)


def contains_unsafe_data(text: str) -> bool:
    normalized = text.lower()
    return any(word in normalized for word in UNSAFE_WORDS) or bool(
        UNSAFE_DIGITS_RE.search(text)
    )


def mask_sensitive(text: str | None, *, limit: int = 1200) -> str:
    if not text:
        return "нет"
    if contains_unsafe_data(text):
        return "[скрыто: похоже на чувствительные данные]"
    return text[:limit]
