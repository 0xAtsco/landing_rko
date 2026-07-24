from __future__ import annotations

from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
)

from .analytics import PAIN_OPTIONS, SEGMENT_OPTIONS
from .catalog.hermes import (
    HERMES_FLOW_SPEC,
    HERMES_GENERAL_CONTEXT_OPTIONS,
    HERMES_SETUP_CONTEXT_OPTIONS,
    HERMES_STAGE_OPTIONS,
    HERMES_URGENCY_OPTIONS,
)

VISIBLE_SEGMENT_CODES = ("rko", "audience", "product", "starting")
VISIBLE_PAIN_CODES = ("more_leads", "build_funnel", "automate_people", "learn_build")

CALLBACK_MATERIALS = "vc:materials"
CALLBACK_MAIN_VIDEO = "vc:main:video"
CALLBACK_DIAGNOSTIC_START = "vc:diagnostic:start"
CALLBACK_ACCESS = "vc:access"
CALLBACK_REVIEW = "vc:review"
CALLBACK_SEGMENT_PREFIX = "vc:segment:"
CALLBACK_PAIN_PREFIX = "vc:pain:"
CALLBACK_CHANNEL_RETURN = "vc:channel:return"
CALLBACK_CHANNEL_CONTEXT_PREFIX = "vc:ch:answer:"
CALLBACK_VC_INTEREST_PREFIX = "vc:vc_interest:"

SEGMENT_CALLBACK_CODES = {
    "rko": "rko",
    "audience": "audience",
    "product": "product",
    "starting": "starting",
}

PAIN_CALLBACK_CODES = {
    "more_leads": "more_leads",
    "build_funnel": "build_funnel",
    "automate_people": "automate_people",
    "learn_build": "learn_build",
}


def youtube_start_keyboard() -> InlineKeyboardMarkup:
    return materials_actions_keyboard()


def telegram_start_keyboard() -> InlineKeyboardMarkup:
    return direct_start_keyboard()


def direct_start_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="▶️ Как работает связка", callback_data=CALLBACK_MAIN_VIDEO)],
            [InlineKeyboardButton(text="📲 Перейти в канал", callback_data=CALLBACK_ACCESS)],
            [InlineKeyboardButton(text="🎯 Хочу собрать свою связку", callback_data=CALLBACK_DIAGNOSTIC_START)],
        ]
    )


def materials_actions_keyboard(channel_url: str | None = None) -> InlineKeyboardMarkup:
    channel_button = (
        InlineKeyboardButton(text="📲 Смотреть следующие разборы в канале", url=channel_url)
        if channel_url
        else InlineKeyboardButton(text="📲 Смотреть следующие разборы в канале", callback_data=CALLBACK_ACCESS)
    )
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [channel_button],
            [InlineKeyboardButton(text="🎯 Подобрать связку под мою ситуацию", callback_data=CALLBACK_DIAGNOSTIC_START)],
        ]
    )


def q1_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=label, callback_data=f"{CALLBACK_SEGMENT_PREFIX}{SEGMENT_CALLBACK_CODES[code]}")]
            for code in VISIBLE_SEGMENT_CODES
            for label in (SEGMENT_OPTIONS[code],)
        ]
    )


def q2_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=PAIN_OPTIONS[code], callback_data=f"{CALLBACK_PAIN_PREFIX}{PAIN_CALLBACK_CODES[code]}")]
            for code in VISIBLE_PAIN_CODES
        ]
    )


def materials_url_keyboard(url: str | None) -> InlineKeyboardMarkup | None:
    if not url:
        return None
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Открыть материалы", url=url)],
        ]
    )


def private_channel_keyboard(url: str | None) -> InlineKeyboardMarkup | None:
    if not url:
        return None
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Войти в приватный канал", url=url)],
        ]
    )


def channel_access_keyboard(url: str | None) -> InlineKeyboardMarkup | None:
    if not url:
        return None
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="📲 Перейти в канал", url=url)],
        ]
    )


def result_actions_keyboard(*, review: bool = True) -> InlineKeyboardMarkup:
    buttons = [[InlineKeyboardButton(text="📲 Перейти в канал", callback_data=CALLBACK_ACCESS)]]
    if review:
        buttons.append([InlineKeyboardButton(text="🎯 Хочу собрать свою связку", callback_data=CALLBACK_REVIEW)])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def channel_return_button(url: str | None) -> InlineKeyboardButton:
    if url:
        return InlineKeyboardButton(text="Вернуться в канал", url=url)
    return InlineKeyboardButton(text="Вернуться в канал", callback_data=CALLBACK_ACCESS)


def channel_result_actions_keyboard(channel_url: str | None) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🎯 Хочу собрать свою связку", callback_data=CALLBACK_REVIEW)],
            [channel_return_button(channel_url)],
        ]
    )


def channel_material_actions_keyboard(channel_url: str | None) -> InlineKeyboardMarkup:
    return materials_actions_keyboard(channel_url)


def channel_context_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Лиды без ответа", callback_data=f"{CALLBACK_CHANNEL_CONTEXT_PREFIX}lost_leads")],
            [InlineKeyboardButton(text="Много ручной обработки", callback_data=f"{CALLBACK_CHANNEL_CONTEXT_PREFIX}manual")],
            [InlineKeyboardButton(text="Нет выжимки по заявкам", callback_data=f"{CALLBACK_CHANNEL_CONTEXT_PREFIX}summary")],
            [InlineKeyboardButton(text="Хочу такую связку", callback_data=f"{CALLBACK_CHANNEL_CONTEXT_PREFIX}want")],
        ]
    )


def vc_interest_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Записи", callback_data=f"{CALLBACK_VC_INTEREST_PREFIX}records")],
            [InlineKeyboardButton(text="Интенсив", callback_data=f"{CALLBACK_VC_INTEREST_PREFIX}intensive")],
            [InlineKeyboardButton(text="С ментором", callback_data=f"{CALLBACK_VC_INTEREST_PREFIX}mentor")],
            [InlineKeyboardButton(text="Не знаю", callback_data=f"{CALLBACK_VC_INTEREST_PREFIX}unknown")],
        ]
    )


def unknown_text_keyboard() -> InlineKeyboardMarkup:
    return direct_start_keyboard()


def unsafe_continue_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Продолжить без данных", callback_data=CALLBACK_REVIEW)],
        ]
    )


def hermes_q1_keyboard(*, preview: bool = False) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=option["label"],
                    callback_data=(
                        f"admin:preview:{option['callback']}"
                        if preview
                        else option["callback"]
                    ),
                )
            ]
            for option in HERMES_STAGE_OPTIONS
        ]
    )


def hermes_q2_general_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=option["label"],
                    callback_data=option["callback"],
                )
            ]
            for option in HERMES_GENERAL_CONTEXT_OPTIONS
        ]
    )


def hermes_q2_setup_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=option["label"],
                    callback_data=option["callback"],
                )
            ]
            for option in HERMES_SETUP_CONTEXT_OPTIONS
        ]
    )


def hermes_playbook_keyboard() -> InlineKeyboardMarkup:
    button = HERMES_FLOW_SPEC["playbook_button"]
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=button["label"], callback_data=button["callback"]
                )
            ]
        ]
    )


def hermes_business_cta_keyboard() -> InlineKeyboardMarkup:
    button = HERMES_FLOW_SPEC["business_cta"]
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=button["label"], callback_data=button["callback"]
                )
            ]
        ]
    )


def hermes_setup_help_keyboard() -> InlineKeyboardMarkup:
    button = HERMES_FLOW_SPEC["setup_cta"]
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=button["label"], callback_data=button["callback"]
                )
            ]
        ]
    )


def hermes_urgency_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=option["label"], callback_data=option["callback"]
                )
            ]
            for option in HERMES_URGENCY_OPTIONS
        ]
    )


def contact_request_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(
                    text="Отправить номер телефона",
                    request_contact=True,
                )
            ]
        ],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


def submitted_channel_keyboard(url: str | None) -> InlineKeyboardMarkup | None:
    if not url:
        return None
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="📲 Смотреть примеры в канале",
                    callback_data="hb:channel",
                )
            ]
        ]
    )
