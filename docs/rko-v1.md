# RKO Lead Command Center V1

V1 переводит demo из browser `localStorage` в серверную архитектуру с локальным JSON storage, API routes, дедупликацией, manager actions и CSV export.

Это всё ещё MVP/prototype, а не production banking system. Нельзя обещать approve, выплаты CPA или обход банка. Банки в demo остаются placeholder: Банк A, Банк B, Банк C.

## Архитектура

- UI: Next.js App Router, TypeScript, Tailwind, shadcn/ui.
- Storage: `.rko-data/db.json` на сервере.
- API: `src/app/api/rko/*`.
- Scoring: deterministic в `src/lib/rko/scoring.ts`.
- AI: provider abstraction в `src/lib/ai/provider.ts`.
- Mock AI: включён по умолчанию.
- Dashboard polling: лёгкий client polling, без heavy realtime.

## API routes

- `POST /api/rko/leads` — создать лида.
- `GET /api/rko/leads` — список лидов.
- `GET /api/rko/leads/:id` — карточка, действия, события.
- `PATCH /api/rko/leads/:id/status` — изменить статус.
- `POST /api/rko/leads/:id/action` — записать действие менеджера.
- `POST /api/rko/demo/seed` — пересоздать demo leads.
- `GET /api/rko/traffic` — source quality report.
- `GET /api/rko/export` — CSV export.
- `POST /api/rko/intake/telegram` — intake endpoint для будущего Telegram-бота.

## Env variables

Локально ничего не обязательно.

Опционально для LLM:

```bash
OPENAI_API_KEY=
OPENAI_MODEL=
OPENAI_BASE_URL=
```

Или provider-compatible:

```bash
RKO_LLM_API_KEY=
RKO_LLM_MODEL=
RKO_LLM_BASE_URL=
```

Если ключа или модели нет, используется mock AI mode.

## Как запустить local

```bash
pnpm install
pnpm dev
```

В текущем окружении Codex package managers могут быть недоступны. Тогда:

```bash
PATH="/Users/absq/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" ./node_modules/.bin/next dev
```

## Как seed demo data

Через UI:

- открыть `/demo/rko/dashboard`;
- нажать `Generate demo leads`.

Через API:

```bash
curl -X POST http://localhost:3000/api/rko/demo/seed \
  -H "content-type: application/json" \
  -d '{"count":100}'
```

## Как работает mock AI

Mock AI генерирует:

- managerSummary;
- scoreExplanation;
- recommendedRoute;
- nextAction;
- suggestedMessage;
- copilot prompts.

Scoring не зависит от LLM. Он deterministic и проверяемый:

- есть ИП/ООО;
- срочность;
- оборот;
- потребность;
- контакт;
- ниша + город;
- дубль;
- мусор/мотив.

## Dedup

При создании lead нормализуются:

- Telegram: lowercase, `@username`;
- phone: только цифры, `8` приводится к `7`.

Если найден дубль:

- добавляется `riskFlag: duplicate`;
- score capped до 55;
- class capped до `C`;
- статус становится `duplicate`;
- событие пишется в LeadEvent.

## Manager actions

Кнопки в dashboard пишут `LeadAction`:

- Передать менеджеру;
- Дожать;
- В прогрев;
- Мусор/дубль;
- Закрыт.

Каждое действие меняет статус и сохраняет timestamp.

## Supabase / SQLite upgrade path

Текущий JSON store находится в `src/lib/rko/server-store.ts`.

Для SQLite/Prisma:

- заменить `readRkoDb/writeRkoDb`;
- оставить API routes без изменений;
- вынести миграции для `Lead`, `LeadAction`, `LeadEvent`.

Для Supabase:

- заменить store на Supabase client;
- добавить env `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`;
- сохранить deterministic scoring на сервере перед insert.

## Telegram later

Telegram bot должен отправлять собранные ответы в:

```text
POST /api/rko/intake/telegram
```

Payload совместим с `LeadDraft`.

## Ограничения V1

- JSON file storage подходит для local demo, не для multi-instance production.
- Нет auth/roles.
- Нет real Telegram webhook verification.
- LLM provider optional и используется только для текстовых подсказок.
- Нет production PII-политик и банковских интеграций.
