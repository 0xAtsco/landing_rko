Ты — senior full-stack engineer, product designer и AI automation architect. Нужно собрать MVP-прототип для демонстрации VibeCamp: RKO Lead Command Center.

Работай автономно до готового результата. Не задавай уточняющих вопросов. Принимай разумные решения сам. Не пересобирай весь проект с нуля, если проект уже существует. Сначала проанализируй структуру, затем реализуй.

Контекст продукта:
VibeCamp — это AI Build Sprint / вайбкодинг-интенсив. Мы учим людей собирать рабочие AI-связки: лендинг, Telegram-бот, CRM, обработку лидов, контент-систему, AI-агентов и MVP под свою задачу.

Сейчас фокус на аудитории РКО, фин. офферов, банковских партнёрских программ, Telegram-трафика, CPA/лидогена и продюсеров.

Главная цель MVP:
Собрать demo-продукт, который можно показать в realtime на эфире/созвоне. Человек оставляет РКО-заявку → AI задаёт вопросы → квалифицирует лида → ставит score → создаёт карточку в CRM → пишет summary менеджеру → показывает следующий шаг → на отдельном экране видно качество источников трафика.

Важно:
- Не обещать гарантированный approve.
- Не обещать гарантированную выплату CPA.
- Не использовать реальные банки.
- Не использовать реальные персональные данные.
- Использовать placeholder: Банк A, Банк B, Банк C.
- Рамка продукта: повысить качество обработки заявок, не терять горячих лидов, фильтровать мусор, видеть качество источников.
- Это demo/MVP, а не production banking system.

Название:
RKO Lead Command Center

Технический стек:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- lucide-react
- local-first storage на первом этапе: SQLite, JSON file или in-memory store с seed data — выбери самый быстрый и стабильный вариант для demo
- если уже есть Supabase в проекте и он подключён — можно использовать Supabase, но не тормози разработку из-за инфраструктуры
- AI layer должен быть абстрагирован: lib/ai/*
- Если OPENAI_API_KEY или другой LLM key отсутствует, система должна работать в mock AI mode

Дизайн:
- dark navy / almost black
- electric blue / cyan / violet glow
- glassmorphism
- AI command center
- realtime dashboard
- premium visual style
- mobile-friendly, но основной demo-screen — desktop dashboard
- стиль должен сочетаться с лендингом /landing-rko

Маршруты, которые нужно создать:

1. /demo/rko
Мини-лендинг для заявки.
Содержит:
- заголовок: “Подберите РКО и не потеряйте заявку после первого клика”
- короткое описание: “AI задаст вопросы, соберёт данные и передаст менеджеру понятную карточку лида.”
- CTA: “Оставить тестовую заявку”
- source/campaign simulator для демонстратора:
  source:
    warm_telegram
    google_ads
    cpa_partner_1
    cpa_partner_2
    bad_motiv
    referral
  campaign:
    rko_marketplace
    fast_ip
    acquiring
    accounting
    generic_rko
- кнопка ведёт на /demo/rko/chat с query params source/campaign

2. /demo/rko/chat
Web-chat simulator.
Это имитация Telegram-бота, но в web-интерфейсе.
AI-агент должен задавать вопросы:
- ИП/ООО уже есть или только планируете открыть?
- Чем занимается бизнес?
- В каком городе?
- Примерный оборот в месяц?
- Что нужно: РКО, регистрация ИП/ООО, эквайринг, бухгалтерия, зарплатный проект, кредитование, валютный контроль?
- Есть ли текущий банк?
- Когда хотите открыть счёт или решить задачу?
- Можно передать заявку менеджеру?
- Какой контакт для связи: Telegram или телефон?

После сбора данных:
- сохранить лида
- рассчитать score
- определить class A/B/C/D/F
- определить riskFlags
- сформировать managerSummary
- сформировать nextAction
- показать пользователю экран “Заявка принята”
- дать кнопку “Открыть dashboard”

Добавь fast demo buttons:
- “Заполнить как горячий лид”
- “Заполнить как средний лид”
- “Заполнить как мусорный лид”
Они должны быстро прогонять сценарий для live demo.

3. /demo/rko/dashboard
Главный экран.
Сделать command center / CRM dashboard.

Блоки:
A. Summary cards:
- всего лидов
- A/B лидов
- новые сегодня
- high risk
- ждут менеджера
- средний score

B. Realtime lead feed:
- последние лиды
- toast при новом лиде:
  “Новый A-лид: ИП / маркетплейсы / РКО + эквайринг”

C. Lead table:
Колонки:
- ID
- source
- contact
- entityType
- businessType
- city
- turnover
- needs
- urgency
- score
- class
- risk
- status
- nextAction

D. Selected lead panel:
При клике на лида показать:
- managerSummary
- score explanation
- risk flags
- raw dialog
- recommendedRoute
- nextAction
- suggested message to client
- buttons:
  “Передать менеджеру”
  “Дожать”
  “В прогрев”
  “Мусор/дубль”

E. Manager copilot:
- “Что сказать лиду”
- “Что уточнить”
- “Какой следующий шаг”

F. Generate demo leads button:
Создаёт 80–120 демо-лидов с разными источниками и качеством.

4. /demo/rko/traffic
Мини-dashboard качества трафика.

Блоки:
A. Summary:
- total leads
- A/B lead %
- duplicate rate
- high risk rate
- no reply / low intent rate
- best source
- worst source

B. Source table:
Колонки:
- source
- leads
- A/B %
- duplicate %
- risk %
- no intent %
- avg score
- recommendation

Источники должны показывать понятную картину:
- warm_telegram: меньше лидов, но много A/B, низкий риск
- bad_motiv: много лидов, но много D/F, no intent, высокий риск
- cpa_partner_2: много дублей и средний риск
- google_ads: среднее качество
- referral: меньше лидов, хорошее качество
- cpa_partner_1: смешанное качество

C. Source detail panel:
При клике на source:
- AI explanation: почему источник хороший/плохой
- какие паттерны найдены
- что улучшить
- recommendation:
  “увеличить бюджет”
  “добавить квалификационный вопрос”
  “изменить креатив”
  “поставить источник на паузу”
  “отдавать только A/B менеджеру”

5. /demo/rko/script
Demo script page для команды.
Там текстовая инструкция:
- открыть dashboard
- открыть chat во втором окне
- пройти горячего лида
- показать появление карточки
- пройти мусорного лида
- показать фильтрацию
- открыть traffic dashboard
- показать warm_telegram vs bad_motiv
- финальная фраза для эфира

Data model:
Создай тип Lead:

type Lead = {
  id: string;
  createdAt: string;
  source: "warm_telegram" | "google_ads" | "cpa_partner_1" | "cpa_partner_2" | "bad_motiv" | "referral";
  campaign: string;
  creative?: string;
  name?: string;
  telegram?: string;
  phone?: string;
  entityType: "ip_exists" | "ooo_exists" | "planning_ip" | "planning_ooo" | "self_employed" | "unknown";
  businessType?: string;
  city?: string;
  monthlyTurnover?: string;
  currentBank?: string;
  needs: Array<"rko" | "ip_registration" | "ooo_registration" | "acquiring" | "accounting" | "salary_project" | "credit" | "currency_control">;
  urgency: "today" | "week" | "month" | "later" | "unknown";
  rawDialog: Array<{ role: "user" | "assistant"; content: string; createdAt: string }>;
  score: number;
  leadClass: "A" | "B" | "C" | "D" | "F";
  riskFlags: string[];
  recommendedRoute: string;
  nextAction: string;
  managerSummary: string;
  status: "new" | "qualified" | "sent_to_manager" | "nurture" | "junk" | "duplicate" | "closed";
};

Scoring:
+20 есть ИП/ООО
+15 срок today/week
+15 указал оборот
+10 конкретная потребность
+10 оставил контакт
+10 нормальная ниша + город
+10 нет дубля
+10 нет признаков мусора/мотива

Lead classes:
A 80–100: горячий, передать менеджеру
B 60–79: хороший, дожать вопросами
C 40–59: прогрев
D 20–39: низкий приоритет
F: мусор / дубль / фрод / мотив

Risk flags:
- no_contact
- no_business_intent
- no_entity
- not_ready
- duplicate
- motivated_traffic
- contradictory_answers
- empty_answers
- bad_source

AI mock mode:
Если нет LLM API key, сделать deterministic mock AI:
- managerSummary генерируется из полей лида
- scoreExplanation генерируется из scoring factors
- nextAction выбирается по leadClass
- suggestedMessage генерируется шаблоном

LLM mode:
Если есть env key, можно использовать LLM для:
- managerSummary
- scoreExplanation
- nextAction
- suggestedMessage
Но вся система должна работать без LLM.

Файловая структура:
src/app/demo/rko/page.tsx
src/app/demo/rko/chat/page.tsx
src/app/demo/rko/dashboard/page.tsx
src/app/demo/rko/traffic/page.tsx
src/app/demo/rko/script/page.tsx

src/components/demo/rko/RkoShell.tsx
src/components/demo/rko/LeadChat.tsx
src/components/demo/rko/LeadDashboard.tsx
src/components/demo/rko/LeadTable.tsx
src/components/demo/rko/LeadDetailPanel.tsx
src/components/demo/rko/TrafficDashboard.tsx
src/components/demo/rko/SourceQualityTable.tsx
src/components/demo/rko/MetricCard.tsx
src/components/demo/rko/LeadClassBadge.tsx
src/components/demo/rko/RiskFlags.tsx
src/components/demo/rko/CommandCenterBackground.tsx

src/lib/rko/types.ts
src/lib/rko/scoring.ts
src/lib/rko/mock-ai.ts
src/lib/rko/store.ts
src/lib/rko/seed.ts
src/lib/rko/traffic.ts
src/lib/rko/demo-scenarios.ts
src/lib/rko/constants.ts

Если в проекте другая структура — адаптируй, но сохрани чистую архитектуру.

Seed data:
Создай realistic demo data:
- 100 лидов
- разные источники
- разные классы A/B/C/D/F
- bad_motiv должен давать много лидов, но плохое качество
- warm_telegram должен давать меньше, но более качественных
- cpa_partner_2 должен иметь больше дублей
- google_ads должен быть средним
- referral должен быть качественным, но малым по объёму

Примеры хороших лидов:
- ИП, маркетплейсы, Казань, оборот 800к, РКО + эквайринг, срок неделя
- ООО, услуги, Москва, оборот 2м, РКО + зарплатный проект, срок сегодня
- planning_ip, доставка, СПб, оборот 300к, регистрация ИП + РКО, срок неделя

Примеры плохих лидов:
- “просто посмотреть”
- нет ИП/ООО и не планирует
- не оставил контакт
- source bad_motiv
- одинаковые контакты
- непонятный бизнес
- urgency later/unknown

UI details:
- A leads: green/cyan highlight
- B: blue
- C: yellow
- D: muted
- F/high risk: red/pink
- Use dark glass cards
- Animated glow
- Smooth transitions
- Tables must be readable
- Dashboard should look good on 1440px desktop
- Mobile must not break

Demo copy:
Везде писать по-русски.
Простой язык:
- “горячий лид”
- “передать менеджеру”
- “в прогрев”
- “мусор / дубль”
- “источник даёт много заявок, но мало профильных”
- “лучше отдавать менеджеру только A/B”

No fake claims:
Не писать:
- “гарантируем открытие счёта”
- “гарантируем выплату”
- “обойдём банк”
- “протащим мотив”

Можно писать:
- “помогает быстрее обрабатывать заявки”
- “помогает не терять горячих лидов”
- “помогает фильтровать мусор”
- “помогает видеть качество источников”

Analytics hooks:
Добавить data-analytics:
- demo_start_chat
- demo_submit_lead
- demo_generate_leads
- demo_open_dashboard
- demo_open_traffic
- demo_lead_action

README:
Создать docs/rko-demo.md с:
- что это за MVP
- как запустить
- как пройти demo
- что показать на эфире
- какие ограничения
- что делать в следующей версии

Acceptance criteria:
1. /demo/rko открывается
2. /demo/rko/chat позволяет создать лида
3. /demo/rko/dashboard показывает лидов
4. Новый лид появляется в dashboard после создания
5. Лид получает score/class/summary/nextAction
6. Generate demo leads работает
7. /demo/rko/traffic показывает различие качества источников
8. /demo/rko/script содержит сценарий демонстрации
9. UI выглядит premium и соответствует dark-blue лендингу
10. pnpm lint проходит
11. pnpm build проходит
12. Если pnpm недоступен — использовать npm/yarn и явно написать, чем проверял

После реализации:
- запусти lint
- запусти build
- исправь ошибки
- проверь основные маршруты
- в финальном ответе дай:
  - список созданных/изменённых файлов
  - команды запуска
  - как пройти live demo
  - что осталось сделать в v1
