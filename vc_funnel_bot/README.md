# VC Funnel Bot

Отдельный Telegram-бот для воронки постов Андрея в канал «ИИ-связки | Андрей Фадеев» и явную заявку на созвон.

Он не встроен в старый `telegram_bot`, не использует SWOP/RKO API, старую SQLite базу, старый Google Sheets sync и старые env.

## Что делает

Бот принимает трафик из YouTube и Telegram, за два вопроса определяет узкое
звено и выдаёт подходящие материалы. Финальный шаг переключается через env:
evergreen-заявка менеджеру, вебинар, запись или отсутствие CTA. В режиме
E02 бот автоматически показывает план из трёх действий, регистрирует одним
нажатием и отправляет persisted-напоминания.

Бот работает без LLM, voice, STT, Google Sheets, CRM и отдельной
веб-регистрации.

## Запуск

```bash
cd vc_funnel_bot
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m bot.main
```

Не запускайте два polling-процесса с одним Telegram token.

## ENV

```bash
VC_BOT_TOKEN=

VC_DATABASE_URL=
VC_SQLITE_PATH=./data/vc_funnel.db

VC_SALES_CHAT_ID=1238046892,7364640378,278533547
VC_ADMIN_IDS=1238046892,7364640378,278533547
VC_BOT_USERNAME=
VC_SET_BOT_COMMANDS_ON_START=false
VC_PRIVATE_CHANNEL_INVITE_URL=

VC_MATERIALS_TITLE=Материалы к ролику Андрея
VC_MATERIALS_URL=
VC_YOUTUBE_MATERIALS_URL=
VC_TELEGRAM_MATERIALS_URL=

VC_DEFAULT_TIMEZONE=Europe/Moscow
VC_ENABLE_TEXT_TRIGGERS=true
VC_ENABLE_FOLLOWUPS=false
VC_FUNNEL_END_MODE=webinar
VC_WEBINAR_ENABLED=true
VC_WEBINAR_EVENT_ID=E02
VC_WEBINAR_TITLE=Где находить новых клиентов на РКО
VC_WEBINAR_START_AT=2026-08-16T19:00:00+03:00
VC_WEBINAR_END_AT=2026-08-16T20:00:00+03:00
VC_WEBINAR_TIMEZONE=Europe/Moscow
VC_WEBINAR_JOIN_URL=https://stream.wb.ru/room/viberko
VC_WEBINAR_REPLAY_URL=
VC_CLEANUP_OLD_BOT_MESSAGES=true
VC_KEEP_LAST_BOT_MESSAGES=1
VC_UX_TYPING_DELAY_ENABLED=true
VC_UX_TYPING_DELAY_SECONDS=0.8
VC_UX_TYPING_DELAY_TEST_MODE=false
VC_ENABLE_TYPEWRITER=false

VC_DEBUG=false
```

`VC_BOT_TOKEN` обязателен. Если он не задан, приложение завершится с понятной ошибкой.

`VC_DATABASE_URL` в P0 поддерживает только `sqlite:///...`. Если он пустой, используется `VC_SQLITE_PATH`.

Код по умолчанию использует безопасный `personal_plan`. Значения
`webinar` и `replay` требуют `VC_WEBINAR_ENABLED=true` и полной конфигурации
события. Доступные режимы:

- `personal_plan` — прежняя заявка менеджеру;
- `webinar` — автоматические registration/live/replay состояния;
- `replay` — принудительный экран записи;
- `disabled` — материалы и план без финального CTA.

Join/replay URL не попадают в events и технические логи.

## Deep Links

Публично используются только две ссылки:

```text
YouTube:  https://t.me/viberko_bot?start=youtube_hermes
Telegram: https://t.me/viberko_bot?start=telegram_hermes
```

Обычный `/start` сохраняет `source=direct` и открывает тот же маршрут.
Старые ссылки продолжают работать для обратной совместимости, но не
показываются в `/links`.

### Hermes Bottleneck Router

```text
youtube_hermes / telegram_hermes / direct
  -> где застряли
  -> что уже есть / где сломалась установка
  -> один из пяти результатов
  -> bundle материалов
  -> полная инструкция по отдельной кнопке
  -> автоматический план из трёх действий
  -> регистрация E02 / эфир / запись
```

В `personal_plan` последние две строки заменяются прежним маршрутом:
срок → текстовый контекст → заявка менеджеру.

Business-ветки: `find_business`, `offer`, `build`, `deal`. Setup-ветка
различает Windows, macOS, подключение модели и другую ошибку. Пока три
setup-видео не загружены, бот честно предлагает помощь с запуском и принимает
текст или скриншот только после явного нажатия соответствующей кнопки.

Источник правды по текстам, callbacks и bundles:
`material_packs/hermes_first_audit/bot_flow_spec.json`.

Legacy-ссылки продолжают работать.

YouTube:

```text
https://t.me/<bot>?start=yt_video_0704_description
https://t.me/<bot>?start=yt_video_0704_pinned
https://t.me/<bot>?start=yt_video_0704_comment
https://t.me/<bot>?start=yt_video_0704_qr
```

Telegram:

```text
https://t.me/<bot>?start=tg_tgk_post_0704_materials
https://t.me/<bot>?start=tg_tgk_post_0705_diagnostic
https://t.me/<bot>?start=tg_ztgk_post_0705_closer
https://t.me/<bot>?start=tg_post_0808_access
https://t.me/<bot>?start=access_0808
https://t.me/<bot>?start=dostup_0808
```

Private channel:

```text
https://t.me/<bot>?start=ch_0706_agent_lost_leads_diagnostic
https://t.me/<bot>?start=ch_0706_agent_lost_leads_materials
https://t.me/<bot>?start=ch_0706_agent_lost_leads_call
https://t.me/<bot>?start=ch_0708_rko_bridge_check
https://t.me/<bot>?start=ch_0709_want_vc
```

Parser терпимо относится к `_`, `-`, `:` и смешанным формам.

## Как использовать deep links

Формат:

```text
https://t.me/<bot_username>?start=<payload>
```

Payload говорит боту, откуда пришёл пользователь и какой первый экран показать.

Основные сценарии Андрея:

```text
am_p01_video -> обещанное видео -> канал или персональный маршрут
am_p02_map   -> обещанная схема -> канал или персональный маршрут
am_p03_demo  -> обещанная демонстрация -> канал или персональный маршрут
am_p04_route -> 2 вопроса -> релевантный результат -> текстовый контекст -> sales
am_p05_apply -> текстовый контекст -> sales
```

YouTube materials:

```text
yt_video_0704_description
yt_video_0704_pinned
yt_video_0704_comment
yt_video_0704_qr
```

Flow: deep link -> material screen -> channel or personal route.

Telegram materials:

```text
tg_tgk_post_0704_materials
```

Flow: deep link -> material screen -> channel or personal route.

Telegram diagnostic:

```text
tg_tgk_post_0705_diagnostic
tg_ztgk_post_0705_closer
```

Flow: deep link -> 2 questions -> result -> user chooses channel / review.

Access:

```text
tg_post_0808_access
access_0808
dostup_0808
```

Flow: deep link -> channel access -> stop.

Private channel CTA:

```text
ch_0706_agent_lost_leads_materials
ch_0706_agent_lost_leads_diagnostic
ch_0706_agent_lost_leads_call
ch_0708_rko_bridge_check
ch_0709_want_vc
```

Flow: post CTA -> bot -> contextual material / contextual diagnostic / review request.

## Куда загружать материалы

Материалы можно задать тремя способами:

1. ENV fallback:
- `VC_MATERIALS_URL`
- `VC_YOUTUBE_MATERIALS_URL`
- `VC_TELEGRAM_MATERIALS_URL`

2. Admin command `/admin_materials`:
- добавить материал;
- загрузить файл прямо в Telegram через `/material_add`;
- привязать материал к payload.

3. Quick admin commands:
- `/material_set_url <material_key> <url>`
- `/material_bind <payload> <material_key>`
- `/material_preview <material_key>`

Для Hermes весь исходный пакет хранится в
`material_packs/hermes_first_audit/`. В Telegram регистрируются девять
готовых файлов из `material_upload_manifest.csv`. Полная инструкция имеет
ключ `hermes_full_playbook` и выдаётся только по отдельной кнопке; служебные
файлы пользователю не отправляются.

Проверка manifest без изменений:

```bash
python -m bot.material_importer
```

Загрузка в служебный admin chat:

```bash
python -m bot.material_importer --apply --upload-chat-id <chat_id>
```

Повторный запуск пропускает уже загруженные активные материалы. Для
принудительной замены используется `--force`. Текущую готовность показывает
`/hermes_readiness`. После регистрации полной инструкции ожидаемая
готовность — `9/12`; три
setup-видео остаются незагруженными.

Рекомендация: использовать `/admin_materials` и `/material_add`, потому что так можно хранить разные материалы под разные deep links.

## Где смотреть пользователей

Sales chat показывает только горячих hand-raisers.

Все пользователи хранятся в SQLite:

```text
vc_funnel_bot/data/vc_funnel.db
```

Главное admin-меню содержит только:

- `Лиды`;
- `Статистика`;
- `Материалы`;
- `Ссылки`.

`/leads` показывает источник, узкое звено и статус, `/lead <telegram_id>` —
контакт, ситуацию, срок, контекст и выданные материалы. Технические payload,
CJM и внутренние события в рабочей карточке не отображаются.

Admin-команды доступны только ID из `VC_ADMIN_IDS`.

## Как посмотреть, что бот ответит на deep link

Используй:

```text
/preview <payload>
```

Например:

```text
/preview ch_0706_agent_lost_leads_call
```

Preview не создаёт лида, не меняет state и не отправляет sales notification. Он показывает parsed payload, entry mode, material binding, first screen и buttons.

## BotFather commands

Public commands:

```text
start - Главное меню
menu - Главное меню
help - Помощь
```

Обработчики `/materials`, `/diagnostic`, `/access` и `/review` сохранены для обратной совместимости, но в публичное меню BotFather не добавляются.

Публичное меню Telegram содержит только `/start`, `/menu` и `/help`.
Технические и legacy-команды не публикуются. Главное admin-меню:

```text
Лиды
Статистика
Материалы
Ссылки
```

## CJM

Основной маршрут:

```text
YouTube / Telegram / direct
-> 2 вопроса
-> вывод и bundle
-> полная инструкция по кнопке
-> одна CTA на персональный план
-> срок + контекст
-> менеджер команды
```

Прямой вход:

```text
/start -> основной двухвопросный маршрут Hermes
```

YouTube materials:

```text
/start payload -> promised material -> channel or personal route
```

Telegram materials:

```text
/start payload -> promised material -> channel or personal route
```

Telegram diagnostic:

```text
/start payload -> 2 questions -> relevant result + context request -> sales after text
```

Telegram access / dostup:

```text
/start payload -> channel access screen -> stop
```

Private channel:

```text
post CTA -> bot deep link -> 0-2 questions or review context -> sales only after explicit context
```

Пустой `/start` показывает основной маршрут Hermes.

## User Journey / Bot UX

Private channel is a warm-up layer.

Бот выдаёт первый полезный результат максимум после двух вопросов, а затем
принимает либо осознанную коммерческую заявку, либо отдельный запрос помощи
с запуском.

Core rule:
first value, then next step.

Maximum path before useful result: 2 questions.

Материал ничего не запускает автоматически.
URL канала не создаёт заявку и не считается подтверждённым вступлением.
Клик по CTA не отправляет уведомление продажникам.
После двух ответов бот просит одно текстовое сообщение; только оно запускает передачу заявки.

## UX Rendering Rules

One callback = one screen.

The bot prefers editing the previous bot screen with `edit_text` instead of stacking new messages.

Every callback handler calls `answerCallbackQuery`.

The bot can use `sendChatAction(typing)` before slower screens.

Old inline keyboards are removed or the previous message is edited.

Optional cleanup can delete stale bot messages, but only bot messages. User messages and review context are never deleted.

Hermes result и выданные bundle-вложения помечаются как persistent и не
попадают в список временных экранов для cleanup.

## Повторный Тест

Один `telegram_id` = одна активная карточка. Если пользователь уже дошёл до `call_requested` или `sales_notified`, повторные кнопки не перезапускают воронку и показывают production-текст:

```text
Заявку уже сохранил.

Если хочешь добавить больше информации — напиши одним сообщением, я сохраню к существующей заявке.
```

Для ручной debug-проверки можно сбросить своего тестового лида:

```text
/reset_vc
```

После этого `/start`, deep links и кнопки снова начнут сценарий с нуля.

## Текстовые Триггеры

Если `VC_ENABLE_TEXT_TRIGGERS=true`, бот реагирует на:

- `ДОСТУП` / `доступ`
- `СТАТЬ БЛИЖЕ` / `стать ближе`
- `МАТЕРИАЛЫ` / `материалы`
- `разбор`
- `созвон`
- неизвестный текст показывает развилку: как работает связка, канал, подобрать связку

## Статусы

```text
started
materials_requested
materials_sent
qual_started
qual_completed
private_channel_sent
review_context_requested
call_requested
sales_notified
not_ready
```

Температура:

```text
cold
warm
sql
hot_sql
```

Основные события новой воронки:

```text
post_entry_started
material_delivered
channel_cta_clicked
route_started
route_completed
application_started
application_context_submitted
sales_notified
```

Основной маршрут использует события:

```text
route_started
bottleneck_selected
situation_selected
bundle_delivered
full_playbook_requested
application_started
urgency_selected
application_submitted
sales_notified
support_requested
support_notified
channel_clicked
```

Обычная URL-кнопка в канал открывается напрямую. Telegram не присылает боту событие о клике или фактическом вступлении, поэтому событие `channel_joined` не создаётся.

## Правила Передачи Продажнику

Продажнику не отправляются:

- просто стартовавшие;
- просто забравшие материалы;
- выбравшие CTA, но не отправившие текстовый контекст;
- получившие канал без запроса разбора.

Продажнику отправляются:

- пользователь нажал кнопку персонального плана, выбрал срок и написал контекст;
- пользователь пришёл через `am_p05_apply` и написал контекст;
- пользователь пришёл через legacy CTA `call` / `want_vc` и написал контекст.

Помощь с запуском получает отдельный заголовок,
`intent=setup_help` и события `support_requested` / `support_notified`.
Она не считается коммерческой заявкой и не использует `sales_notified`.

Если `VC_SALES_CHAT_ID` не задан, бот не падает: сохраняет лид, пишет event `sales_notification_skipped_no_sales_chat` и сообщает пользователю, что заявка сохранена. Можно указать один chat id или несколько через запятую.

Дубли sales notification не отправляются.

Для private sales chat каждый продажник должен сначала открыть бота и нажать Start. Для group chat бот должен быть добавлен в группу, а в `VC_SALES_CHAT_ID` должен быть указан chat id этой группы. Если Telegram отклонит отправку, бот сохранит event `sales_notification_failed` с безопасным описанием причины.

## Storage

SQLite база по умолчанию:

```text
vc_funnel_bot/data/vc_funnel.db
```

Таблицы:

```text
vc_funnel_leads
vc_funnel_events
vc_funnel_materials
vc_funnel_payload_materials
vc_funnel_webinar_registrations
```

Один `telegram_id` = одна активная карточка.

Новые поля для UX attribution и чистого rendering: `source`, `entry_surface`, `entry_mode`, `post_id`, `post_slug`, `post_topic`, `application_context`, `last_bot_screen_message_id`, `bot_screen_message_ids`.

После `call_requested` или `sales_notified` повторный `/start` не затирает оригинальный источник, а пишет новый payload в `latest_start_payload` и event.

Регистрация уникальна по `(event_id, telegram_user_id)`. В той же строке
хранятся snapshot атрибуции, три reminder timestamps и первые клики на
эфир/запись. Таблица создаётся аддитивно при старте; существующие данные не
перезаписываются.

Reminder worker работает внутри того же polling-процесса. После рестарта он
читает persisted timestamps и отправляет только текущее актуальное
напоминание, не всю пропущенную цепочку.

## Проверка

```bash
cd vc_funnel_bot
python -m compileall bot
python -m unittest discover -s tests -v
```

Из корня проекта:

```bash
pnpm lint
pnpm build
```

## Безопасность

Бот не просит паспорт, карту, реквизиты, SMS-коды, банковские данные или личные финансовые документы.

В текстах нет обещаний гарантированного дохода, гарантированных заявок, банковского одобрения, открытия счёта или обхода проверок.

Секреты из env не логируются.

## P1 TODO

- Google Sheets export только через отдельные `VC_GOOGLE_*` env.
- Отдельный dashboard поверх webinar-аналитики, если Telegram admin станет
  недостаточно.
