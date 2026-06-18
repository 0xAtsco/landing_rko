from __future__ import annotations

from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
)


BTN_APPLY = "Оставить заявку"
BTN_CONTACT_PHONE = "Поделиться телефоном"

Q1_OPTIONS = {
    "work": "Да, уже работаю",
    "plan": "Планирую начать",
    "interest": "Нет, просто интересно",
}


def start_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=BTN_APPLY, callback_data="lead:apply")],
        ]
    )


def apply_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=BTN_APPLY, callback_data="lead:apply")],
        ]
    )


def q1_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=text, callback_data=f"q1:{code}")]
            for code, text in Q1_OPTIONS.items()
        ]
    )


def contact_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text=BTN_CONTACT_PHONE, request_contact=True)],
        ],
        resize_keyboard=True,
        one_time_keyboard=True,
        input_field_placeholder="@username, t.me/username или телефон",
    )


def admin_keyboard(telegram_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Взять в работу",
                    callback_data=f"admin:in_work:{telegram_id}",
                ),
                InlineKeyboardButton(
                    text="Qualified",
                    callback_data=f"admin:qualified:{telegram_id}",
                ),
            ],
            [
                InlineKeyboardButton(
                    text="Не подходит",
                    callback_data=f"admin:rejected:{telegram_id}",
                ),
                InlineKeyboardButton(
                    text="Написать через бота",
                    callback_data=f"admin:reply_hint:{telegram_id}",
                ),
            ],
        ]
    )
