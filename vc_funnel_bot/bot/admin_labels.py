from __future__ import annotations

from typing import Any


PHASE_LABELS = {
    "draft": "Подготовка",
    "registration": "Регистрация открыта",
    "live": "Эфир идёт",
    "replay": "Доступна запись",
    "closed": "Регистрация закрыта",
    "disabled": "Эфир отключён",
    "personal_plan": "Персональный план",
}

SOURCE_LABELS = {
    "direct": "Прямой вход",
    "telegram": "Telegram",
    "andrey_main": "Основной канал Андрея",
    "bot_broadcast": "Рассылка бота",
    "youtube": "YouTube",
    "channel": "Канал «ИИ-связки»",
    "private_channel": "Канал «ИИ-связки»",
    "manual_text": "Сообщение в боте",
    "unknown": "Источник не определён",
}

ROUTE_LABELS = {
    "find_business": "Ищет подходящий бизнес",
    "offer": "Формирует предложение",
    "build": "Собирает решение",
    "deal": "Ведёт диалог до сделки",
    "setup": "Нужна помощь с установкой",
    "setup_help": "Нужна помощь с установкой",
    "setup_windows": "Установка Hermes на Windows",
    "setup_macos": "Установка Hermes на macOS",
    "setup_model": "Подключение модели",
    "setup_other": "Другая проблема с установкой",
    "unknown": "Маршрут не выбран",
}

LEAD_STATUS_LABELS = {
    "started": "Начал пользоваться ботом",
    "materials_requested": "Запросил материалы",
    "materials_sent": "Получил материалы",
    "qual_started": "Отвечает на вопросы",
    "qual_completed": "Ответил на вопросы",
    "route_completed": "Получил материалы по своему маршруту",
    "private_channel_sent": "Получил ссылку на канал",
    "call_cta_shown": "Увидел предложение связаться с командой",
    "call_requested": "Запросил разговор с командой",
    "contact_requested": "Ожидается контакт",
    "not_ready": "Пока не готов продолжить",
    "application_started": "Начал оставлять заявку",
    "application_context_requested": "Описывает свою задачу",
    "application_submitted": "Отправил заявку",
    "review_context_requested": "Описывает задачу для разбора",
    "setup_context_requested": "Описывает проблему с установкой",
    "support_requested": "Запросил помощь",
    "sales_notified": "Передан команде",
}

TICKET_STATUS_LABELS = {
    "new": "Новое",
    "in_progress": "В работе",
    "answered": "Получен ответ",
    "closed": "Закрыто",
}

MATERIAL_STATUS_LABELS = {
    "loaded": "загружен",
    "ready": "готов",
    "configured": "настроен",
    "unverified": "ещё не проверен",
    "missing": "отсутствует",
    "invalid": "недоступен",
    "inactive": "отключён",
}

INTENT_LABELS = {
    "sales_consultation": "Хочет обсудить запуск",
    "setup_help": "Нужна помощь с установкой",
    "call": "Хочет поговорить с командой",
    "materials": "Нужны материалы",
}

EVENT_LABELS = {
    "lead_started": "Пользователь впервые открыл бота",
    "lead_restarted": "Пользователь снова открыл бота",
    "route_started": "Начал отвечать на вопросы",
    "pain_selected": "Выбрал основную задачу",
    "segment_selected": "Описал текущую ситуацию",
    "bundle_delivered": "Получил материалы",
    "full_playbook_requested": "Запросил полную инструкцию",
    "webinar_card_shown": "Увидел приглашение на эфир",
    "webinar_registration_clicked": "Нажал кнопку регистрации",
    "webinar_registered": "Зарегистрировался на эфир",
    "webinar_already_registered": "Повторно открыл регистрацию",
    "webinar_broadcast_sent": "Получил приглашение на эфир",
    "webinar_broadcast_registration_clicked": "Нажал регистрацию в приглашении",
    "webinar_broadcast_registered": "Зарегистрировался из рассылки",
    "webinar_broadcast_already_registered": "Повторно подтвердил регистрацию из рассылки",
    "webinar_join_clicked": "Открыл ссылку на эфир",
    "application_started": "Начал оставлять заявку",
    "application_submitted": "Отправил заявку",
    "support_requested": "Запросил помощь",
    "sales_notified": "Передан команде",
}


def _label(mapping: dict[str, str], value: str | None, fallback: str) -> str:
    if not value:
        return fallback
    return mapping.get(value, fallback)


def phase_label(value: str | None) -> str:
    return _label(PHASE_LABELS, value, "Статус не определён")


def source_label(value: str | None) -> str:
    return _label(SOURCE_LABELS, value, "Источник не определён")


def route_label(value: str | None) -> str:
    return _label(ROUTE_LABELS, value, "Маршрут не выбран")


def lead_status_label(value: str | None) -> str:
    return _label(LEAD_STATUS_LABELS, value, "Статус не определён")


def ticket_status_label(value: str | None) -> str:
    return _label(TICKET_STATUS_LABELS, value, "Статус не определён")


def material_status_label(value: str | None) -> str:
    return _label(MATERIAL_STATUS_LABELS, value, "не определён")


def intent_label(value: str | None) -> str:
    return _label(INTENT_LABELS, value, "Не указано")


def event_label(value: str | None) -> str:
    return _label(EVENT_LABELS, value, "Другое служебное действие")


def groups_text(values: dict[str, int], labeler) -> str:
    if not values:
        return "нет данных"
    return ", ".join(
        f"{labeler(str(key))}: {value}"
        for key, value in values.items()
    )


def safe_value(value: Any) -> str:
    if value is None or value == "":
        return "не указано"
    return str(value)
