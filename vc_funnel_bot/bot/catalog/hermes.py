from __future__ import annotations

import json
from pathlib import Path
from typing import Any


SPEC_PATH = (
    Path(__file__).resolve().parents[2]
    / "material_packs"
    / "hermes_first_audit"
    / "bot_flow_spec.json"
)

with SPEC_PATH.open(encoding="utf-8") as spec_file:
    HERMES_FLOW_SPEC: dict[str, Any] = json.load(spec_file)

HERMES_FLOW_VERSION = int(HERMES_FLOW_SPEC["version"])
HERMES_PAYLOAD = str(HERMES_FLOW_SPEC["payload"])
HERMES_PUBLIC_PAYLOADS = {
    str(source): str(payload)
    for source, payload in HERMES_FLOW_SPEC["public_payloads"].items()
}
HERMES_ENTRY_MODE = str(HERMES_FLOW_SPEC["entry_mode"])
HERMES_START_MESSAGE = str(HERMES_FLOW_SPEC["start_message"])
HERMES_MAIN_MENU_TEXT = str(HERMES_FLOW_SPEC["main_menu"]["text"])
HERMES_QUESTION_1 = str(HERMES_FLOW_SPEC["question_1"]["text"])
HERMES_QUESTION_2_GENERAL = str(HERMES_FLOW_SPEC["question_2_general"]["text"])
HERMES_QUESTION_2_SETUP = str(HERMES_FLOW_SPEC["question_2_setup"]["text"])
HERMES_APPLY_PROMPT = str(HERMES_FLOW_SPEC["apply_prompt"])
HERMES_URGENCY_QUESTION = str(HERMES_FLOW_SPEC["urgency"]["text"])

HERMES_STAGE_OPTIONS = tuple(HERMES_FLOW_SPEC["question_1"]["options"])
HERMES_GENERAL_CONTEXT_OPTIONS = tuple(
    HERMES_FLOW_SPEC["question_2_general"]["options"]
)
HERMES_SETUP_CONTEXT_OPTIONS = tuple(
    HERMES_FLOW_SPEC["question_2_setup"]["options"]
)
HERMES_URGENCY_OPTIONS = tuple(HERMES_FLOW_SPEC["urgency"]["options"])

HERMES_STAGE_BY_CALLBACK = {
    option["callback"]: option["pain"] for option in HERMES_STAGE_OPTIONS
}
HERMES_GENERAL_CONTEXT_BY_CALLBACK = {
    option["callback"]: option["segment"]
    for option in HERMES_GENERAL_CONTEXT_OPTIONS
}
HERMES_SETUP_CONTEXT_BY_CALLBACK = {
    option["callback"]: option["segment"]
    for option in HERMES_SETUP_CONTEXT_OPTIONS
}
HERMES_URGENCY_BY_CALLBACK = {
    option["callback"]: option["value"]
    for option in HERMES_URGENCY_OPTIONS
}

HERMES_BUNDLES = {
    track: tuple(material_keys)
    for track, material_keys in HERMES_FLOW_SPEC["bundles"].items()
}
HERMES_MATERIAL_KEYS = tuple(
    dict.fromkeys(
        material_key
        for material_keys in HERMES_BUNDLES.values()
        for material_key in material_keys
    )
) + ("hermes_full_playbook",)

HERMES_RESULT_TEXTS = {
    "find_business": (
        "Ваш следующий шаг — выбрать первые 10 компаний, где продажи уже идут "
        "в переписках. Начните не с масштаба, а с тёплого доступа и "
        "наблюдаемой проблемы."
    ),
    "offer": (
        "Ваш следующий шаг — предложить узкий бесплатный тест: аудит 10 "
        "обезличенных диалогов с конкретным отчётом, без доступа к аккаунтам "
        "и без обещаний роста продаж."
    ),
    "build": (
        "Ваш следующий шаг — провести один полный аудит: подготовить данные, "
        "запустить проверку по критериям, верифицировать выводы и собрать "
        "управленческую сводку."
    ),
    "deal": (
        "Ваш следующий шаг — показать три подтверждённых факта, согласовать "
        "одну приоритетную проблему и предложить измеримый пилот на 7 дней."
    ),
}

HERMES_SETUP_READY_TEXT = (
    "Покажем инструкцию именно для вашего этапа. Если после неё ошибка "
    "останется, отправьте её текстом или скриншотом — без токенов, паролей "
    "и платёжных данных."
)
HERMES_SETUP_FALLBACK_TEXT = (
    "Видео по этому этапу ещё готовится. Вы можете описать проблему, и "
    "команда посмотрит, где возникла ошибка."
)

HERMES_PERSONAL_PLAN_STEPS = {
    "find_business": (
        "Соберите список из 10 компаний, где продажи уже идут в переписках.",
        "Для каждой отметьте доступ к владельцу и одну наблюдаемую проблему.",
        "Выберите три компании, с которых проще всего начать предметный разговор.",
    ),
    "offer": (
        "Выберите одну компанию и конкретную проблему в её переписках.",
        "Предложите аудит 10 обезличенных диалогов с коротким отчётом.",
        "Отправьте персональное сообщение и один корректный follow-up через 2–3 дня.",
    ),
    "build": (
        "Подготовьте и обезличьте 10 диалогов для проверки.",
        "Проведите аудит по комплекту и готовому промпту.",
        "Проверьте выводы по исходным данным и заполните рабочую таблицу.",
    ),
    "deal": (
        "Подготовьте три подтверждённых факта из проведённого аудита.",
        "Согласуйте с бизнесом одну приоритетную проблему.",
        "Предложите измеримый пилот на 7 дней, а РКО обсудите только при реальной потребности.",
    ),
    "setup_help": (
        "Откройте инструкцию для вашей системы или этапа подключения.",
        "Повторите запуск и зафиксируйте точный шаг и текст ошибки.",
        "Если ошибка осталась, отправьте безопасное описание или скриншот через кнопку помощи.",
    ),
}


def hermes_personal_plan_text(pain: str, segment: str) -> str:
    del segment
    route = "setup_help" if pain == "setup" else pain
    steps = HERMES_PERSONAL_PLAN_STEPS.get(
        route,
        HERMES_PERSONAL_PLAN_STEPS["find_business"],
    )
    return (
        "Ваш следующий шаг\n\n"
        "На основании ваших ответов я собрал план из трёх действий:\n\n"
        f"1. {steps[0]}\n"
        f"2. {steps[1]}\n"
        f"3. {steps[2]}"
    )


def hermes_track(pain: str, segment: str) -> str:
    if pain != "setup":
        return pain
    return {
        "windows": "setup_windows",
        "macos": "setup_macos",
        "model": "setup_model",
        "other": "setup_other",
    }.get(segment, "setup_other")
