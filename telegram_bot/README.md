# Telegram-бот заявок ИИ + РКО

Минимальный бот для сбора заявок из Telegram-поста.

Он сразу сохраняет пользователя после `/start`, ведет по одному вопросу, собирает контакт и отправляет заявку админу.

## ENV

Скопируй пример:

```bash
cp .env.example .env
```

Заполни:

```bash
BOT_TOKEN=123:xxx
ADMIN_CHAT_ID=123456789
DATABASE_URL=sqlite+aiosqlite:///./data/rko_leads.db
TIMEZONE=Europe/Moscow
GOOGLE_SHEET_ID=1OI11J4W2b-yQus-_Z-kqXhPT51esDEBdDDX5Lsj9ZBk
GOOGLE_SERVICE_ACCOUNT_FILE=/opt/rko-ai-bot/google-service-account.json
GOOGLE_WORKSHEET_INDEX=0
```

`ADMIN_CHAT_ID` может быть личным чатом или группой, куда бот умеет писать.

Если `DATABASE_URL` не указан, бот использует SQLite в `./data/rko_leads.db`.
Для PostgreSQL можно задать строку вида:

```bash
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname
```

## Локальный запуск

```bash
cd telegram_bot
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m bot.main
```

Ссылка для поста:

```text
https://t.me/<bot_username>?start=rko_ai_test_01
```

## Команды

Показать ID текущего чата:

```text
/chat_id
```

Ответ пользователю через бота:

```text
/reply <telegram_id> <текст>
```

Пример:

```text
/reply 123456789 Привет, это по тестовой группе ИИ + РКО. Удобно коротко созвониться сегодня?
```

Команду нужно отправлять из `ADMIN_CHAT_ID`.

Синхронизировать все текущие лиды в Google Sheet:

```text
/sync_sheet
```

Команду нужно отправлять из `ADMIN_CHAT_ID`.

## Google Sheet онлайн

Текущая таблица:

```text
https://docs.google.com/spreadsheets/d/1OI11J4W2b-yQus-_Z-kqXhPT51esDEBdDDX5Lsj9ZBk/edit
```

Бот обновляет одну строку на один `telegram_id`.

Колонки:

```text
lead_id, created_at, updated_at, telegram_id, chat_id, name, telegram_username,
manual_username, phone, source, status, q1_business_status, last_seen_at, last_event
```

Что нужно сделать один раз:

1. Открой Google Cloud Console.
2. Создай или выбери проект.
3. Включи Google Sheets API и Google Drive API.
4. Открой `IAM & Admin` -> `Service Accounts`.
5. Нажми `Create service account`.
6. После создания открой service account -> `Keys`.
7. Нажми `Add key` -> `Create new key` -> `JSON`.
8. Сохрани скачанный JSON.
9. В JSON найди поле `client_email`.
10. Открой Google Sheet и нажми `Share`.
11. Добавь `client_email` с ролью `Editor`.

Загрузить JSON на сервер:

```bash
scp ~/Downloads/<file>.json root@206.81.17.31:/opt/rko-ai-bot/google-service-account.json
ssh root@206.81.17.31
chmod 600 /opt/rko-ai-bot/google-service-account.json
```

Проверить env:

```bash
grep '^GOOGLE_' /opt/rko-ai-bot/.env
```

Должно быть:

```bash
GOOGLE_SHEET_ID=1OI11J4W2b-yQus-_Z-kqXhPT51esDEBdDDX5Lsj9ZBk
GOOGLE_SERVICE_ACCOUNT_FILE=/opt/rko-ai-bot/google-service-account.json
GOOGLE_WORKSHEET_INDEX=0
```

Перезапустить бота:

```bash
systemctl restart rko-ai-bot
systemctl status rko-ai-bot
```

После этого отправь боту из админ-чата:

```text
/sync_sheet
```

Новые лиды и изменения будут попадать в таблицу автоматически.

## Посмотреть базу

На сервере база лежит здесь:

```text
/opt/rko-ai-bot/data/rko_leads.db
```

Открыть SQLite:

```bash
ssh root@206.81.17.31
sqlite3 /opt/rko-ai-bot/data/rko_leads.db
```

Полезные команды внутри `sqlite3`:

```sql
.tables
.headers on
.mode column
select id, telegram_id, username, manual_username, phone, status, source, started_at, updated_at from leads order by id desc limit 20;
select id, lead_id, action, details_json, created_at from events order by id desc limit 30;
```

## Деплой на сервер

Пример для `/opt/rko-ai-bot`:

```bash
mkdir -p /opt/rko-ai-bot
rsync -az telegram_bot/ root@SERVER:/opt/rko-ai-bot/
ssh root@SERVER
cd /opt/rko-ai-bot
python3.11 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
nano .env
```

Systemd service:

```ini
[Unit]
Description=RKO AI Telegram Lead Bot
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/opt/rko-ai-bot
EnvironmentFile=/opt/rko-ai-bot/.env
ExecStart=/opt/rko-ai-bot/.venv/bin/python -m bot.main
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Запуск:

```bash
systemctl daemon-reload
systemctl enable --now rko-ai-bot
systemctl status rko-ai-bot
```
