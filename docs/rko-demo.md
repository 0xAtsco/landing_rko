# RKO Lead Command Center

MVP demo для VibeCamp: AI Build Sprint / вайбкодинг-интенсива.

Продукт показывает, как заявка из лендинга или Telegram-бота превращается в CRM-карточку:

- AI задаёт вопросы.
- Собирает нишу, город, оборот, потребности, срочность и контакт.
- Ставит score и class A/B/C/D/F.
- Пишет summary менеджеру.
- Даёт next action.
- Показывает качество источников трафика.

Это demo/MVP, а не production banking system. В интерфейсе нет реальных банков и персональных данных. Банки обозначены как Банк A, Банк B, Банк C.

## Как запустить

```bash
pnpm install
pnpm dev
```

Открыть:

- ` `
- `/demo/rko/chat`
- `/demo/rko/dashboard`
- `/demo/rko/traffic`
- `/demo/rko/script`

Данные хранятся local-first в `localStorage`. Если LLM-ключа нет, работает deterministic mock AI mode.

## Как пройти demo

1. Откройте `/demo/rko/dashboard`.
2. Откройте `/demo/rko/chat?source=warm_telegram&campaign=rko_marketplace` во втором окне.
3. Нажмите “Горячий”.
4. Покажите экран “Заявка принята”.
5. Вернитесь в dashboard: новый лид появляется сверху.
6. Откройте карточку лида: видны score, class, risk flags, summary, raw dialog и next action.
7. В чате создайте “Мусорный” лид.
8. Покажите, что он получает F и не должен идти менеджеру.
9. Откройте `/demo/rko/traffic`.
10. Сравните warm_telegram и bad_motiv.

## Что показать на эфире

- Горячий лид быстро попадает менеджеру.
- Мусор и мотив-трафик фильтруются до ручной обработки.
- CPA/source качество видно по A/B %, duplicate %, risk % и no intent %.
- cpa_partner_2 даёт объём, но требует фильтра дублей.
- warm_telegram даёт меньше лидов, но выше качество.

## Ограничения

- Нет реальной банковской интеграции.
- Нет реальных персональных данных.
- Нет обещаний approve, выплат CPA или обхода банка.
- Storage сделан для demo через `localStorage`.
- AI layer работает в mock mode без внешнего LLM.

## Что делать в v1

- Подключить реальную CRM или Supabase.
- Добавить серверные API routes для lead intake.
- Подключить Telegram-бота.
- Добавить LLM provider в `src/lib/ai`.
- Добавить дедупликацию по нормализованному телефону/Telegram.
- Добавить роли менеджеров и историю действий.
- Добавить экспорт отчёта по источникам.
