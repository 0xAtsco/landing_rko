# Задача для Codex: Hermes Bottleneck Router в VC Funnel Bot

Работай в существующем репозитории `vc_funnel_bot`.

Сначала прочитай `ARCHITECTURE.md`, `README.md`, текущие `handlers.py`, `messages.py`, `keyboards.py`, `source_parser.py`, `models.py`, `storage.py`, `materials.py`, `notifier.py`, `catalog/payloads.py`, `catalog/materials.py` и тесты.

Не переписывай приложение с нуля. Сохрани SQLite, long polling, текущий renderer, admin material flow, dedup, attribution lock и правило: sales notification только после явного текстового контекста.

## Цель

После видео Андрея пользователь переходит по:

`https://t.me/viberko_bot?start=am_hermes_video_route`

Бот за два вопроса определяет узкое звено и выдаёт релевантный набор материалов:

- найти бизнес;
- сформировать оффер;
- собрать решение;
- довести результат до сделки / РКО;
- исправить установку Hermes.

Источник правды по текстам, callback и bundles: файл `bot_flow_spec.json` из пакета.

## 1. Payload

Добавить точный payload:

- payload: `am_hermes_video_route`
- group/source: `andrey_main`
- entry_mode: `hermes_bottleneck`
- campaign: `hermes_video`
- cta_type: `bottleneck_route`
- post_topic: `hermes_install_and_demo`

Известный payload должен сразу открывать новый маршрут. Не показывать универсальное меню перед первым вопросом.

## 2. Состояние

Переиспользовать существующие поля:

- `pain` — выбранное узкое звено: `find_business | offer | build | deal | setup`;
- `segment` — текущий актив пользователя или OS/setup context;
- `intent` — выбранный результат / apply / setup_support;
- `application_context` — свободный текст перед передачей команде.

Не добавлять новую БД и не менять основной lifecycle лида без необходимости.

Если для callback-flow нужен временный шаг, используй существующий state/FSM-подход проекта или минимальное новое поле только при реальной необходимости.

## 3. Вопросы и callbacks

Реализовать точные тексты и callbacks из `bot_flow_spec.json`.

Первый вопрос:

`Где вы сейчас застряли?`

Callbacks:

- `hb:stage:find`
- `hb:stage:offer`
- `hb:stage:build`
- `hb:stage:deal`
- `hb:stage:setup`

Для первых четырёх веток второй вопрос:

`Что у вас уже есть?`

Callbacks:

- `hb:asset:warm`
- `hb:asset:rko`
- `hb:asset:channel`
- `hb:asset:none`

Для setup второй вопрос:

`На каком этапе возникла проблема?`

Callbacks:

- `hb:setup:windows`
- `hb:setup:mac`
- `hb:setup:model`
- `hb:setup:other`

Каждый callback обязательно подтверждать через `answerCallbackQuery`. Сохранить in-memory lock от двойного нажатия.

## 4. Результат

После второго ответа показать короткий результат:

### find_business
`Ваш следующий шаг — выбрать первые 10 компаний, где продажи уже идут в переписках. Начните не с масштаба, а с тёплого доступа и наблюдаемой проблемы.`

### offer
`Ваш следующий шаг — предложить узкий бесплатный тест: аудит 10 обезличенных диалогов с конкретным отчётом, без доступа к аккаунтам и без обещаний роста продаж.`

### build
`Ваш следующий шаг — провести один полный аудит: подготовить данные, запустить проверку по критериям, верифицировать выводы и собрать управленческую сводку.`

### deal
`Ваш следующий шаг — показать три подтверждённых факта, согласовать одну приоритетную проблему и предложить измеримый пилот на 7 дней.`

### setup
Показать релевантный материал по Windows/macOS/model. Для `other` попросить скриншот или текст ошибки после отдельного явного нажатия.

## 5. Material bundles

Текущая архитектура разрешает один material per request. Добавить минимальный слой bundles без изменения таблиц материалов.

Создать каталог, например `bot/catalog/material_bundles.py`:

- `find_business` → `hermes_find_business_guide`, `hermes_audit_workbook`
- `offer` → `hermes_offer_pack`, `hermes_outreach_templates`
- `build` → `hermes_audit_kit`, `hermes_audit_prompt`, `hermes_audit_workbook`
- `deal` → `hermes_result_to_deal`, `hermes_presentation_script`
- `setup_windows` → `hermes_setup_windows_video`
- `setup_macos` → `hermes_setup_macos_video`
- `setup_model` → `hermes_model_connection_video`

Реализовать helper `send_material_bundle(...)`, который:

1. Разрешает каждый material key через существующий material/storage resolver.
2. Отправляет материалы последовательно в заданном порядке.
3. Не падает целиком, если отсутствует один материал.
4. Для отсутствующего материала пишет admin/event, но не показывает техническую ошибку пользователю.
5. Пишет отдельное событие `hermes_material_delivered` с material key и delivery status.
6. Не меняет attribution и не создаёт sales notification.

Не хранить Telegram file IDs в коде. Материалы загружаются через существующий `/material_add`.

## 6. Кнопки после результата

Показывать:

- `📲 Смотреть примеры в канале` → существующий private channel invite URL;
- `🎯 Разобрать мою ситуацию` → запросить свободный текст.

Callbacks:

- `hb:channel`
- `hb:apply`

`hb:channel`:

- записывает `hermes_channel_clicked`;
- не создаёт заявку;
- не называет событие `channel_joined`.

`hb:apply`:

- записывает `hermes_apply_clicked`;
- ставит `intent=apply`;
- переводит в существующий `review_context_requested`;
- просит:

`Опишите в 3 пунктах: 1) кому хотите предложить решение; 2) где сейчас проблема; 3) что уже установлено или собрано. Не отправляйте паспортные, банковские или платёжные данные.`

Только после свободного текстового сообщения:

- сохранить `application_context`;
- отправить карточку команде;
- применить существующую dedup-защиту;
- подтвердить пользователю сохранение заявки.

Для setup support карточку помечать как `intent=setup_support`, а не как готовый sales lead.

## 7. Карточка команде

В notifier добавить видимые поля:

- `Hermes bottleneck` / pain;
- `Current asset / OS` / segment;
- исходный payload;
- post topic;
- application/support context;
- intent.

Сохранить маскирование чувствительных данных.

## 8. События

Добавить:

- `hermes_route_started`
- `hermes_bottleneck_selected`
- `hermes_context_selected`
- `hermes_route_completed`
- `hermes_bundle_started`
- `hermes_material_delivered`
- `hermes_channel_clicked`
- `hermes_apply_clicked`

Существующие `application_context_submitted` и `sales_notified` переиспользовать.

## 9. Admin UX

Обновить `/links`, чтобы новый payload отображался отдельно.

Добавить admin-проверку bundle readiness:

- список material keys;
- loaded / missing;
- active / inactive.

`/preview am_hermes_video_route` не должен создавать lead, менять state или уведомлять команду.

## 10. Тесты

Добавить тесты минимум на:

1. Known payload открывает новый маршрут.
2. После вопроса 1 sales notification не отправляется.
3. Второй вопрос зависит от setup vs general branch.
4. После вопроса 2 показывается правильный result track.
5. Bundle отправляется в правильном порядке.
6. Отсутствие одного material не ломает остальные.
7. Клик по каналу не создаёт заявку.
8. Apply просит текстовый контекст.
9. Sales/support notification уходит только после текста.
10. Повторный apply не создаёт duplicate notification.
11. Исходная attribution не затирается повторным start.
12. `/preview` не создаёт lead.
13. Неизвестные callbacks обрабатываются безопасно.

## 11. Проверки

В конце выполнить:

```bash
python -m compileall bot
python -m unittest discover -s tests -v
```

Если web-часть репозитория затронута, дополнительно:

```bash
pnpm lint
pnpm build
```

Обновить `ARCHITECTURE.md` по фактической реализации.

## 12. Финальный отчёт

Показать:

- изменённые файлы;
- итоговые пользовательские маршруты;
- deep link;
- готовность каждого material key;
- результаты тестов;
- ручные действия: загрузка файлов через `/material_add`, добавление трёх видео и контрольная заявка.
