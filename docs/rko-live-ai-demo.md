# RKO Live AI Demo

## Что это

Live AI Chat показывает, как свободный вопрос по РКО превращается в CRM-карточку:

- пользователь пишет обычным языком;
- AI отвечает коротко и задаёт один следующий вопрос;
- extractor обновляет поля лида после каждого сообщения;
- deterministic scoring считает score и class;
- Processing Theater показывает этапы обработки;
- CRM-card создаётся через существующий API;
- dashboard видит нового лида через polling.

Это demo/MVP, не production banking system. Мы не обещаем approve, выплаты CPA или обход банка. Банки в demo называются только Банк A, Банк B, Банк C.

## Как запустить

```bash
pnpm dev
```

Если `pnpm` недоступен в окружении Codex, можно запускать локальным Node runtime:

```bash
PATH="/Users/absq/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" ./node_modules/.bin/next dev
```

Production check:

```bash
PATH="/Users/absq/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" ./node_modules/.bin/next build
PATH="/Users/absq/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" ./node_modules/.bin/next start -p 3001
```

## Маршруты

- `/demo/rko/chat` — presenter demo: live AI chat, processing theater, создание CRM-card.
- `/demo/rko/dashboard` — общий command center, видит созданных лидов.
- `/demo/rko/traffic` — качество источников и CSV export.
- `/demo/rko/playground` — публичная песочница для аудитории без общей таблицы лидов.

## Env для LLM

Без ключей работает mock streaming mode.

Для LLM-compatible provider:

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini
```

Опционально:

```bash
RKO_LLM_API_KEY=...
RKO_LLM_MODEL=...
RKO_LLM_BASE_URL=https://api.openai.com/v1
```

LLM используется только для ответа, summary/explanation/suggestedMessage. Scoring остаётся deterministic.

## Mock streaming

Если ключей нет, `/api/rko/assistant/stream` стримит mock-ответ чанками через SSE. Ответ строится из текущего draft, missing fields и score preview.

## Demo script на 5 минут

1. Открыть `/demo/rko/dashboard` и показать, что CRM уже содержит разные классы лидов.
2. Во втором окне открыть `/demo/rko/chat`.
3. Нажать “Горячий РКО-лид” или написать: “У меня ИП на маркетплейсах, оборот 800к, нужен счёт и эквайринг”.
4. Показать, как AI отвечает и справа подсвечиваются этапы Processing Theater.
5. Дождаться создания CRM-card или нажать “Создать CRM-карточку сейчас”.
6. Открыть lead в dashboard.
7. Нажать “Мусор/мотив” и показать, что score/risk режут слабый лид.
8. Открыть `/demo/rko/traffic` и сравнить Тёплый Telegram с Мотив-трафиком.
9. Дать аудитории ссылку `/demo/rko/playground`.

## Playground

Playground хранит свой `sessionId` в query/localStorage. Он показывает AI chat, Processing Theater и mini CRM-card, но не показывает общую таблицу всех лидов. Это безопасная ссылка для аудитории после эфира.

Пример ссылки:

```text
/demo/rko/playground?source=warm_telegram&campaign=rko_marketplace
```

## Safety limits

- Не просим паспортные данные, коды, номера карт, реквизиты счёта.
- Не используем реальные банки в UI и summary.
- Не обещаем approve, открытие счёта или CPA-выплату.
- Не обещаем “протащить мотив”.
- При слабом намерении lead идёт в прогрев или мусор/дубль.
