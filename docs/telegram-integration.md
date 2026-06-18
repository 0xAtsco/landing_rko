# Telegram integration plan

Цель: подключить Telegram-бота к RKO Lead Command Center без изменения scoring и CRM dashboard.

## Готовый endpoint

```text
POST /api/rko/intake/telegram
```

Endpoint принимает payload, совместимый с `LeadDraft`, создаёт lead через серверный store, запускает deterministic scoring, mock/LLM AI enrichment и dedup.

## Минимальный payload

```json
{
  "source": "warm_telegram",
  "campaign": "rko_marketplace",
  "creative": "telegram_bot",
  "telegram": "@demo_user",
  "entityType": "ip_exists",
  "businessType": "маркетплейсы",
  "city": "Казань",
  "monthlyTurnover": "800к",
  "currentBank": "Банк A",
  "needs": ["rko", "acquiring"],
  "urgency": "week",
  "rawDialog": [
    {
      "role": "assistant",
      "content": "ИП/ООО уже есть?",
      "createdAt": "2026-05-27T18:00:00.000Z"
    },
    {
      "role": "user",
      "content": "ИП есть",
      "createdAt": "2026-05-27T18:00:05.000Z"
    }
  ]
}
```

## Bot flow

1. Задать вопросы по entity, нише, городу, обороту, потребностям, банку, срочности и контакту.
2. Собрать `rawDialog`.
3. Отправить payload в `/api/rko/intake/telegram`.
4. Показать пользователю короткое подтверждение.
5. Менеджер увидит карточку в `/demo/rko/dashboard`.

## Env для будущего bot adapter

```bash
TELEGRAM_BOT_TOKEN=
RKO_PUBLIC_BASE_URL=
```

В этом шаге реальный bot process не запускается. Web demo не зависит от токена.

## Safety

- Не собирать реальные паспортные/банковские данные.
- Не обещать approve, выплаты или обход банка.
- Использовать Банк A/B/C как placeholders.
