# VC Funnel Bot

Отдельный Telegram-бот для воронки постов Андрея в канал «ИИ-связки | Андрей Фадеев» и явную заявку на созвон.

Он не встроен в старый `telegram_bot`, не использует SWOP/RKO API, старую SQLite базу, старый Google Sheets sync и старые env.

## Что делает

Бот принимает трафик по индивидуальным deep links, сохраняет атрибуцию каждого поста, сразу выдаёт обещанный материал или запускает нужный сценарий. После материала пользователь одним нажатием переходит в канал или проходит двухвопросный подбор. Продажники получают заявку только после текстового контекста.

P0 работает без LLM, voice, STT, Google Sheets и follow-up scheduler.

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

## Deep Links

Боевые ссылки для основного канала Андрея:

```text
https://t.me/viberko_bot?start=am_hermes_video_route
https://t.me/viberko_bot?start=am_p01_video
https://t.me/viberko_bot?start=am_p02_map
https://t.me/viberko_bot?start=am_p03_demo
https://t.me/viberko_bot?start=am_p04_route
https://t.me/viberko_bot?start=am_p05_apply
```

| Payload | Первый экран | Material key |
|---|---|---|
| `am_hermes_video_route` | Hermes Bottleneck Router: два вопроса | bundle по результату |
| `am_p01_video` | основное видео | `am_p01_video` |
| `am_p02_map` | схема связки | `am_p02_map` |
| `am_p03_demo` | демонстрация | `am_p03_demo` |
| `am_p04_route` | первый вопрос персонального маршрута | `am_p04_route` |
| `am_p05_apply` | запрос текстового контекста | `am_p05_apply` |

Все ссылки сохраняют `source=andrey_main`, собственные `post_id`, `post_topic`, `campaign` и CTA.

### Hermes Bottleneck Router

```text
am_hermes_video_route
  -> где застряли
  -> что уже есть / где сломалась установка
  -> один из пяти результатов
  -> bundle материалов
  -> канал или явный запрос разбора
```

Business-ветки: `find_business`, `offer`, `build`, `deal`. Setup-ветка
различает Windows, macOS, подключение модели и другую ошибку. Пока три
setup-видео не загружены, бот честно предлагает support-фолбэк и принимает
текст или скриншот только после кнопки `Разобрать мою ситуацию`.

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
`material_packs/hermes_first_audit/`. В Telegram регистрируются восемь
готовых файлов из `material_upload_manifest.csv`; playbook и служебные файлы
не загружаются в пользовательские bundles.

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
`/hermes_readiness`: ожидаемая первая итерация — `8/11`.

Рекомендация: использовать `/admin_materials` и `/material_add`, потому что так можно хранить разные материалы под разные deep links.

## Где смотреть пользователей

Sales chat показывает только горячих hand-raisers.

Все пользователи хранятся в SQLite:

```text
vc_funnel_bot/data/vc_funnel.db
```

Через Telegram admin:
- `/leads` — последние пользователи;
- `/lead <telegram_id>` — карточка пользователя;
- `/events <telegram_id>` — путь пользователя;
- `/stats` — статистика;
- `/hermes_readiness` — готовность Hermes material keys и bundles;
- `/export_leads` — CSV выгрузка.

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

Admin commands не добавляй в public menu, если команды не scoped to admins:

```text
admin - Админ-панель
links - Deep links
preview - Предпросмотр payload
testlink - Ссылка для payload
admin_materials - Материалы
hermes_readiness - Готовность Hermes bundles
leads - Пользователи
lead - Карточка пользователя
events - События пользователя
stats - Статистика
export_leads - CSV лидов
admin_reset - Сбросить пользователя
```

## CJM

Посты Андрея:

```text
пост -> индивидуальный deep link -> обещанный материал -> канал «ИИ-связки»
                                                   -> 2 вопроса -> контекст -> Игорь и созвон
```

Hermes:

```text
видео -> am_hermes_video_route -> 2 вопроса -> result -> bundle
                                                -> канал
                                                -> context / support -> команда
```

Прямой вход:

```text
/start -> Как работает связка / Перейти в канал / Хочу собрать свою связку
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

Пустой `/start` показывает универсальный VC-экран.

## User Journey / Bot UX

Private channel is a warm-up layer.

Bot has two roles:
1. before channel — materials, access and mini-diagnostic gate;
2. after channel — conversion layer for contextual CTA clicks from posts.

Пост Андрея -> конкретный материал или маршрут -> канал / явная заявка -> Игорь.

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

Hermes добавляет события:

```text
hermes_route_started
hermes_bottleneck_selected
hermes_context_selected
hermes_bundle_started
hermes_material_delivered
hermes_route_completed
hermes_channel_clicked
hermes_apply_clicked
```

Обычная URL-кнопка в канал открывается напрямую. Telegram не присылает боту событие о клике или фактическом вступлении, поэтому событие `channel_joined` не создаётся.

## Правила Передачи Продажнику

Продажнику не отправляются:

- просто стартовавшие;
- просто забравшие материалы;
- выбравшие CTA, но не отправившие текстовый контекст;
- получившие канал без запроса разбора.

Продажнику отправляются:

- пользователь прошёл персональный маршрут и написал контекст;
- пользователь пришёл через `am_p05_apply` и написал контекст;
- пользователь пришёл через legacy CTA `call` / `want_vc` и написал контекст.
- пользователь завершил Hermes apply и написал контекст;
- setup-support после явного клика и текста или скриншота ошибки.

Setup-support получает отдельный заголовок и `intent=setup_support`; он не
помечается как готовый sales lead и не устанавливает `call_requested`.

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
```

Один `telegram_id` = одна активная карточка.

Новые поля для UX attribution и чистого rendering: `source`, `entry_surface`, `entry_mode`, `post_id`, `post_slug`, `post_topic`, `application_context`, `last_bot_screen_message_id`, `bot_screen_message_ids`.

После `call_requested` или `sales_notified` повторный `/start` не затирает оригинальный источник, а пишет новый payload в `latest_start_payload` и event.

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

- Follow-up reminders через отдельный VC scheduler.
- Google Sheets export только через отдельные `VC_GOOGLE_*` env.
- Calendar booking.
