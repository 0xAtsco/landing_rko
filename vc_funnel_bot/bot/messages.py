from __future__ import annotations

from .models import Lead


UNIVERSAL_START_TEXT = """Привет! Здесь можно увидеть, как ИИ-связки помогают создавать полезные решения, находить клиентов и выходить на РКО-заявки.

Выберите следующий шаг."""

MATERIALS_PLACEHOLDER = "Материалы скоро пришлём сюда."

MATERIALS_REPLY = """Вот обещанный материал: {materials_title}

{material_body_or_url_or_placeholder}"""

MATERIAL_MISSING_TEXT = """Материал к этой ссылке пока не загружен.

Можно посмотреть следующие разборы в канале или подобрать связку под вашу ситуацию."""

DIAGNOSTIC_INTRO_TEXT = "Что у вас уже есть?"

ACCESS_REPLY = """Переходите в канал «ИИ-связки | Андрей Фадеев».

Там выходят следующие разборы, схемы и демонстрации."""

APPLICATION_CONTEXT_PROMPT = """Опишите в 2–3 предложениях:
— что у вас есть сейчас;
— где возникает проблема;
— какой результат хотите получить."""

DIRECT_REVIEW_TEXT = APPLICATION_CONTEXT_PROMPT

Q1_TEXT = "Что у вас уже есть?"

Q2_TEXT = "Что сейчас важнее всего?"

ENTER_CHANNEL_REPLY = """Переходите в канал «ИИ-связки | Андрей Фадеев».

Начните с закреплённой навигации и выберите нужный разбор."""

REVIEW_CTA_REPLY = APPLICATION_CONTEXT_PROMPT

CONTEXT_RECEIVED_TEXT = """Заявка передана команде. Менеджер напишет вам в Telegram, чтобы согласовать время короткого созвона.

Пока ждёте, можно посмотреть дополнительные примеры и разборы в канале."""

SUPPORT_CONTEXT_RECEIVED_TEXT = """Спасибо, контекст и скриншот сохранены и переданы команде поддержки.

Мы посмотрим, на каком шаге возникла ошибка, и напишем в Telegram."""

HERMES_PLAYBOOK_TEXT = (
    "Если хотите увидеть весь путь целиком, откройте полную инструкцию "
    "по связке: от поиска бизнеса до презентации результата."
)

HERMES_COMMERCIAL_TRANSITION_TEXT = """Материалы помогут пройти текущий этап самостоятельно. Но основная сложность обычно возникает не в самом файле, а в выборе первого сценария и доведении его до результата.

Команда может разобрать вашу ситуацию и составить персональный план запуска: что делать первым, на кого выходить и какой результат проверить."""

HERMES_WEBINAR_LIVE_REGISTERED_TEXT = """Вы записаны.

Эфир уже идёт. Нажмите кнопку ниже, чтобы открыть трансляцию."""

HERMES_WEBINAR_LIVE_REGISTERED_NO_URL_TEXT = """Вы записаны.

Эфир уже идёт, но ссылка пока не настроена. Как только она появится, бот покажет её здесь."""

HERMES_WEBINAR_LIVE_TEXT = """Эфир уже идёт.

Нажмите кнопку ниже, чтобы открыть трансляцию."""

HERMES_WEBINAR_JOIN_MISSING_TEXT = """Эфир уже идёт, но ссылка пока не настроена.

Как только ссылка появится, бот покажет её здесь."""

HERMES_WEBINAR_REPLAY_TEXT = """Запись вебинара готова.

Нажмите кнопку ниже, чтобы открыть её."""

HERMES_WEBINAR_REPLAY_PENDING_TEXT = """Эфир завершён. Запись готовится и появится здесь."""

HERMES_WEBINAR_JOIN_READY_TEXT = """Ссылка на прямой эфир готова.

Нажмите кнопку ниже, чтобы войти."""

HERMES_WEBINAR_REPLAY_READY_TEXT = """Ссылка на запись готова.

Нажмите кнопку ниже, чтобы посмотреть вебинар."""

HERMES_WEBINAR_REMINDER_24H = """Завтра в 19:00 МСК — живой разбор с Андреем.

Покажем, где искать потенциальных клиентов и как подготовить первые персональные сообщения через полезные ИИ-решения."""

HERMES_WEBINAR_REMINDER_24H_TODAY = """Сегодня в 19:00 МСК — живой разбор с Андреем.

Покажем, где искать потенциальных клиентов и как подготовить первые персональные сообщения через полезные ИИ-решения."""

HERMES_WEBINAR_REMINDER_3H = """До вебинара осталось 3 часа.

Сегодня Андрей вживую пройдёт путь от выбора ниши до первых сообщений потенциальным клиентам."""

HERMES_WEBINAR_REMINDER_15M = """Начинаем через 15 минут.

Нажмите кнопку ниже, чтобы открыть эфир."""

HERMES_WEBINAR_REMINDER_15M_NO_URL = """Начинаем через 15 минут.

Ссылка на эфир ещё не настроена. Как только она появится, бот покажет её здесь."""

HERMES_APPLICATION_INTRO_TEXT = """Чтобы команда подготовилась, ответьте ещё на два коротких вопроса.

На коротком созвоне менеджер разберёт вашу ситуацию и определит ближайший план действий. Если наш формат вам подходит, менеджер расскажет, как команда может помочь с реализацией."""

HERMES_CONTACT_PROMPT = """Контекст сохранил. Чтобы менеджер команды смог связаться с вами, отправьте номер телефона кнопкой ниже или напишите одним сообщением @username / другой контакт."""

HERMES_CONTEXT_TOO_SHORT_TEXT = """Нужно немного больше контекста, чтобы команда подготовилась к разговору.

Напишите одним сообщением: что хотите получить, что уже есть и что сейчас мешает."""

HERMES_SETUP_CONTEXT_PROMPT = """Опишите ошибку одним сообщением или отправьте скриншот.

Укажите, что запускали, на каком шаге остановились и что увидели на экране.

Не отправляйте пароли, токены, банковские или платёжные данные."""

HERMES_SETUP_RECEIVED_TEXT = """Запрос передан команде. Мы посмотрим, на каком шаге возникла ошибка, и напишем вам в Telegram."""

HERMES_PLAYBOOK_MISSING_TEXT = """Полная инструкция сейчас недоступна. Остальные материалы уже можно использовать, а этот файл команда добавит отдельно."""
HERMES_PLAYBOOK_SUBSCRIPTION_TEXT = """Полная инструкция доступна подписчикам канала «ИИ-связки | Андрей Фадеев».

Подпишитесь на канал, вернитесь сюда и нажмите «Проверить подписку»."""
HERMES_PLAYBOOK_SUBSCRIPTION_ERROR_TEXT = """Сейчас не получилось проверить подписку.

Инструкция не потеряется. Попробуйте ещё раз через минуту."""

HERMES_SUPPORT_PENDING_TEXT = """Описание сохранено.

Автоматически передать его команде сейчас не получилось. Запрос остаётся в боте и доступен администраторам."""

HERMES_CHANNEL_REPLY = """Переходите в канал «ИИ-связки | Андрей Фадеев».

Там есть примеры разборов и следующие практические маршруты."""

CHANNEL_MATERIAL_REPLY = """Держи материал к посту: {post_title}

Он дополняет разбор из канала.

Могу ещё быстро подсказать, как применить это к твоей ситуации."""

CHANNEL_DIAGNOSTIC_INTRO = "Ты пришёл из поста про {post_topic}.\n\nПроверю, подходит ли тебе такая связка."

CHANNEL_CONTEXT_QUESTION = "Что ближе к твоей ситуации?"

CHANNEL_CALL_REPLY = APPLICATION_CONTEXT_PROMPT

VC_PARTICIPATION_QUESTION = "Сначала определим, какой формат тебе подойдет лучше."

VC_INTEREST_CONTEXT_TEXT = "Принял. Напиши одним сообщением, что хочешь получить от VC и что уже делаешь сейчас."

RETURNING_AFTER_SALES_TEXT = """Заявку уже сохранил.

Если хочешь добавить больше информации — напиши одним сообщением, я сохраню к существующей заявке."""

FINAL_SAVED_APPLICATION_TEXT = """Дополнение сохранено.

Оно добавлено к вашей заявке."""

SALES_DELIVERY_PENDING_TEXT = """Контекст сохранён.

Автоматически передать его команде сейчас не получилось. Заявка остаётся в боте и доступна администраторам."""

RESET_DONE_TEXT = "Тестовый лид сброшен. Теперь можно заново нажать /start или открыть deep link."

RESET_EMPTY_TEXT = "Тестового лида пока нет. Можно начать с /start."

PRIVATE_CHANNEL_MISSING_TEXT = "Канал почти готов. Я сохранил твои ответы, доступ пришлём сюда."

UNSAFE_DATA_WARNING_TEXT = """Не присылай сюда паспорт, карты, коды и банковские данные.

Для разбора достаточно описать нишу, задачу и что хочешь собрать."""

UNKNOWN_TEXT = "Выберите: посмотреть, как работает связка, перейти в канал или подобрать связку под вашу ситуацию."


def with_optional_url(text: str, url: str | None) -> str:
    if not url:
        return text
    return f"{text}\n\n{url}"


def material_text(materials_title: str, body_or_url: str | None) -> str:
    return MATERIALS_REPLY.format(
        materials_title=materials_title,
        material_body_or_url_or_placeholder=body_or_url or MATERIALS_PLACEHOLDER,
    )


def external_material_text(materials_title: str, materials_url: str | None) -> str:
    return material_text(materials_title, materials_url)


def direct_materials_text(materials_url: str | None) -> str:
    return material_text("Материалы VC", materials_url)


def channel_material_text(post_title: str, materials_url: str | None) -> str:
    return with_optional_url(CHANNEL_MATERIAL_REPLY.format(post_title=post_title), materials_url)


def channel_diagnostic_intro(post_topic: str) -> str:
    return CHANNEL_DIAGNOSTIC_INTRO.format(post_topic=post_topic)


def human_source(lead: Lead) -> str:
    if lead.source == "andrey_main":
        return "поста Андрея"
    if lead.source == "channel":
        return "поста в приватном канале"
    if lead.source_type == "youtube":
        return "YouTube"
    if lead.source_channel == "manual_text":
        return "текстового запроса в боте"
    if lead.source_type == "telegram":
        return "Telegram"
    if lead.source_type == "direct":
        return "прямого входа в бота"
    return "бота"
