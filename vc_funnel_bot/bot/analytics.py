from __future__ import annotations

from .models import Lead


SEGMENT_OPTIONS = {
    "rko": "Работаю с РКО / финансовыми офферами",
    "audience": "Есть трафик, база или Telegram-канал",
    "product": "Есть продукт, команда или отдел продаж",
    "starting": "Только начинаю",
}

PAIN_OPTIONS = {
    "more_leads": "Получать больше заявок",
    "build_funnel": "Собрать лендинг, бота или воронку",
    "automate_people": "Автоматизировать обработку людей",
    "learn_build": "Научиться собирать решения самостоятельно",
    "watching": "Пока просто изучаю",
}

INTENT_OPTIONS = {
    "materials": "Просто материалы",
    "channel": "Доступ в приватный канал",
    "own_bundle": "Понять, какую связку собрать",
    "call": "Разобрать ситуацию на созвоне",
    "vc_participation": "Узнать про участие в VC",
}

CALL_INTENTS = {
    INTENT_OPTIONS["call"],
    INTENT_OPTIONS["vc_participation"],
}

HOT_SEGMENTS = {
    SEGMENT_OPTIONS["rko"],
    SEGMENT_OPTIONS["audience"],
    SEGMENT_OPTIONS["product"],
}


def is_call_intent(intent: str | None) -> bool:
    return intent in CALL_INTENTS


def next_required_question(lead: Lead) -> str | None:
    if not lead.segment:
        return "q1"
    if not lead.pain:
        return "q2"
    return None


def is_qualification_complete(lead: Lead) -> bool:
    return next_required_question(lead) is None


def calculate_temperature(lead: Lead, *, call_requested: bool | None = None) -> str:
    wants_call = lead.call_requested if call_requested is None else call_requested
    hot_source = lead.cta_type in {"access", "dostup", "sale"}
    hot_intent = is_call_intent(lead.intent)
    hot_segment = lead.segment in HOT_SEGMENTS
    not_just_watching = lead.pain != PAIN_OPTIONS["watching"]

    if wants_call and lead.intent == INTENT_OPTIONS["vc_participation"]:
        return "hot_sql"
    if wants_call and (hot_source or hot_intent) and hot_segment and not_just_watching:
        return "hot_sql"
    if wants_call or hot_intent:
        return "sql"
    if lead.intent == INTENT_OPTIONS["materials"] or lead.pain == PAIN_OPTIONS["watching"]:
        return "cold"
    if lead.segment and lead.pain:
        return "warm"
    if lead.materials_sent:
        return "cold"
    return "cold"


def should_notify_sales(lead: Lead) -> bool:
    return lead.call_requested and lead.lead_temperature in {"sql", "hot_sql"} and not lead.sales_notified


def personal_result_text(lead: Lead) -> str:
    if lead.pain == PAIN_OPTIONS["more_leads"]:
        return (
            "Вам подойдёт связка: конкретный оффер → лендинг или бот → диалог → заявка. "
            "Сначала стоит проверить один источник трафика и один сценарий."
        )
    if lead.pain == PAIN_OPTIONS["build_funnel"]:
        return (
            "Оптимальный первый шаг — короткая воронка под один оффер: экран с понятным "
            "действием, Telegram-бот и передача заявки ответственному человеку."
        )
    if lead.pain == PAIN_OPTIONS["automate_people"]:
        return (
            "Логичный первый проект — бот или агент обработки: он собирает контекст, "
            "не теряет обращения и передаёт человеку уже понятную заявку."
        )
    if lead.pain == PAIN_OPTIONS["learn_build"]:
        return (
            "Начните с одного небольшого решения под реальную задачу: лендинга, бота или "
            "автоматизации. Так быстрее появится рабочий навык и понятный результат."
        )
    if lead.pain == PAIN_OPTIONS["watching"]:
        return (
            "Окей, тогда лучше начать с канала.\n\n"
            "Там уже имеются: разборы, примеры и материалы."
        )
    return "Начать стоит с одной конкретной задачи и минимальной ИИ-связки под неё."
