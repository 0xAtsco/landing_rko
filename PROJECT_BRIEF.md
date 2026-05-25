Ты — elite frontend designer, motion designer, conversion copywriter и senior Next.js engineer. Работай автономно до готового результата.

У меня в Codex подключён 21st.dev Magic MCP. Твоя задача — создать максимально красивый, дорогой, нестандартный и конверсионный лендинг для VibeCamp / AI Build Sprint. Упор на дизайн, анимации, mobile-first и понятную коммуникацию. Сайт должен выглядеть так, чтобы человек из Telegram увидел первый экран и подумал: “вот эти ребята реально шарят в AI, продуктах и дизайне”.

Главная цель:
Сделать production-ready landing page для запуска VibeCamp на аудиторию РКО / фин. офферов / Telegram-трафика / продюсеров / людей, которые хотят собирать AI-инструменты себе или клиентам.

ВАЖНО:
Используй 21st.dev Magic MCP не символически, а реально. Сначала проверь, какие инструменты 21st.dev доступны. Затем через 21st.dev Magic сгенерируй сильные варианты ключевых UI-компонентов:
1. Hero section
2. Animated background / shader-like background
3. Interactive bento grid
4. Case cards
5. Sticky timeline
6. Pricing / CTA
7. FAQ

После генерации НЕ оставляй дефолтный UI. Глубоко кастомизируй всё под VibeCamp: dark blue, electric cyan, violet, AI-lab, Telegram traffic command center, glassmorphism, glow, нестандартные анимации. Никаких скучных SaaS-шаблонов.

Если 21st.dev Magic MCP по какой-то причине не сработает, всё равно сделай вручную на том же уровне качества, но сначала обязательно попытайся использовать MCP.

Контекст продукта:
VibeCamp — практический интенсив по вайбкодингу и AI-сборке рабочих инструментов. Участник за 14 дней собирает не конспект, а рабочий артефакт:
- лендинг;
- Telegram-бот;
- CRM / мини-админку;
- автоматическую обработку лидов;
- автоконтент для Telegram;
- YouTube Shorts / Reels-систему;
- AI-агента;
- MVP под свою задачу.

Главный смысл:
Не продаём “курс по нейросетям”.
Не продаём “программирование”.
Не продаём “магическую кнопку дохода”.
Продаём: “за 14 дней соберёшь свою AI-связку, которую можно открыть, показать, использовать в работе или продать клиенту”.

Целевая аудитория:
- РКО / банковские партнёрки / фин. офферы;
- Telegram-трафик;
- лидогенерация;
- продюсеры и владельцы каналов;
- начинающие AI-билдеры;
- люди, которые хотят делать сайты, ботов, CRM, заявочники и автоматизации себе или клиентам;
- не обязательно программисты.

Язык:
Пиши по-русски.
Просто, понятно, без сложного языка.
Ближе к коммуникации Boost Замесина: коротко, конкретно, человечески.
Не использовать сложные технические термины без необходимости.
Не использовать инфобизную воду.
Не обещать гарантированный доход.
Не писать “заработаешь 100к/мес гарантированно”.
Можно писать: “собранный артефакт можно использовать в своём процессе, показать клиенту или упаковать как кейс”.

Визуальный стиль:
- Главный вайб: как у VibeCamp Тимы — синий, технологичный, AI, но ещё дороже, чище и сильнее.
- Deep navy / almost black background.
- Electric blue, cyan, violet, indigo glow.
- Glassmorphism.
- Chrome borders.
- Animated gradients.
- Cursor glow.
- Floating UI cards.
- AI command center.
- Telegram traffic system.
- Никаких стоковых фото.
- Никаких шаблонных SaaS-блоков.
- На мобилке сайт должен выглядеть особенно сильно, потому что основной трафик будет из Telegram.

Технический стек:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion или motion
- lucide-react
- mobile-first
- performance-friendly animations
- semantic HTML
- accessible buttons/links
- no horizontal overflow

Если проект уже существует:
- Сначала проанализируй структуру проекта.
- Не ломай существующую конфигурацию.
- Если это Next.js проект — работай в нём.
- Если проекта нет или он пустой — создай Next.js App Router проект сам.
- После реализации запусти lint/build и исправь ошибки.

Если нужно создать проект с нуля, используй:
pnpm create next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
pnpm add framer-motion lucide-react clsx tailwind-merge class-variance-authority
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button accordion card badge tabs

Желаемая структура файлов:
src/app/page.tsx
src/app/layout.tsx
src/app/globals.css
src/components/landing/Header.tsx
src/components/landing/Hero.tsx
src/components/landing/DemandProof.tsx
src/components/landing/BentoBuilds.tsx
src/components/landing/Cases.tsx
src/components/landing/WhyNow.tsx
src/components/landing/Timeline.tsx
src/components/landing/Format.tsx
src/components/landing/ForWhom.tsx
src/components/landing/Pricing.tsx
src/components/landing/FAQ.tsx
src/components/landing/FinalCTA.tsx
src/components/landing/MagneticButton.tsx
src/components/landing/SectionReveal.tsx
src/components/landing/CursorGlow.tsx
src/lib/content.ts
src/lib/utils.ts

Весь текст лендинга вынеси в src/lib/content.ts, чтобы его было легко править.

Главный первый экран:

Badge:
“Старт 21 числа · 2 недели с кураторами · записи навсегда”

H1:
“Собери свою AI-связку за 14 дней”

Subheadline:
“Лендинг, Telegram-бот, CRM, автоконтент, обработка лидов или AI-агент — даже если ты ни разу не писал код руками.”

Supporting text:
“Работаешь на своей задаче. Кураторы помогают не застрять на настройках, промптах, деплое и ошибках.”

CTA primary:
“Забронировать место”

CTA secondary:
“Посмотреть, что можно собрать”

Hero proof chips:
- “без кода руками”
- “с кураторами”
- “на своей задаче”
- “записи навсегда”
- “результат: рабочая ссылка / бот / CRM / агент”

Hero visual:
Сделай вау-первый экран:
- animated dark gradient / shader-like background;
- floating glass cards вокруг заголовка:
  “Landing”
  “Telegram Bot”
  “CRM”
  “AI Agent”
  “Shorts Factory”
  “RKO Leads”
- центральный glowing command-center orb / node graph;
- typewriter command line:
  “/build lead-funnel”
  “/deploy telegram-bot”
  “/generate shorts-system”
  “/create crm”
- карточки должны визуально собираться в единую AI-связку;
- CTA-кнопки magnetic с glow/ripple;
- cursor spotlight;
- на mobile hero должен быть компактным, но очень красивым.

Структура лендинга:

1. Sticky glass navigation
Лого: VibeCamp.
Ссылки: “Что соберёшь”, “Кейсы”, “Программа”, “Формат”, “FAQ”.
Справа CTA: “Войти в поток”.
Glass nav с blur, border glow.
При скролле появляется subtle progress bar сверху.

2. Hero section
Сделай максимально сильный первый экран по требованиям выше.
Первый экран должен быть screenshot-worthy.

3. Demand proof / Telegram messages strip
Сделай блок, который показывает, что спрос уже есть.
Не используй реальные имена, телефоны и аватарки.
Сделай анимированную ленту Telegram-сообщений / glass cards:
- “можешь помочь сгенерить сайт?”
- “нужен сайт-заявочник с админкой”
- “нашёл клиента на лендос + автоматизацию + бота”
- “хочу понять, как это собрать самому”
- “а можно сделать бота под заявки?”
- “можно CRM-ку под мой процесс?”

Подпись:
“После первых демонстраций люди начали писать не ‘расскажи про AI’, а ‘помоги собрать сайт, бота, админку и автоматизацию’.”

4. Bento grid: “Что ты можешь собрать”
Сделай большой интерактивный bento grid. Каждая карточка — отдельный тип проекта. У карточек должны быть hover-анимации, glow, cursor tracking, moving gradients и маленькие UI-превью внутри.

Карточки:

A. “Лендинг под оффер”
Описание: “Страница, которую можно кинуть в канал, рекламу или клиенту.”
Mini UI: hero + форма заявки.

B. “Telegram-бот для заявок”
Описание: “Собирает ответы, квалифицирует лида и отправляет заявку менеджеру.”
Mini UI: Telegram chat mockup.

C. “CRM / мини-админка”
Описание: “Лиды, статусы, комментарии, уведомления и выгрузка.”
Mini UI: dashboard table.

D. “AI-агент для отдела продаж”
Описание: “Помогает с обработкой, напоминаниями, ответами и статусами.”
Mini UI: agent nodes connected to lead cards.

E. “Автоконтент для Telegram”
Описание: “Идеи, посты, прогрев, контент-план и черновики публикаций.”
Mini UI: content calendar.

F. “YouTube Shorts / Reels factory”
Описание: “Сценарии, хуки, описания и система для потока коротких видео.”
Mini UI: vertical videos + scheduler.

G. “RKO lead processing”
Описание: “Заявка → бот → CRM → менеджер → статусы.”
Mini UI: bank cards + lead pipeline.

H. “Свой MVP”
Описание: “Мини-продукт, который можно показать, продать или докрутить.”
Mini UI: app preview.

5. Cases section
Заголовок:
“Что уже можно собрать на таком подходе”

ВАЖНО: Не выдумывай точные цифры и доходы. Кейсы показывай через артефакты.

Сделай 5 case cards как живые окна приложений. При наведении карточка раскрывает мини-анимацию.

Кейс 1:
Название: “Продюсер автоматизировал контент-канал”
Описание: “AI помогает собирать идеи, посты, прогревы, контент-план и черновики публикаций.”
Артефакт: “контент-система для Telegram”

Кейс 2:
Название: “AI-агенты для отдела продаж”
Описание: “Несколько агентов помогают менеджерить лидов: квалификация, статусы, напоминания, ответы.”
Артефакт: “мини-операционная система продаж”

Кейс 3:
Название: “YouTube Shorts / Reels генерация”
Описание: “Система генерирует идеи, хуки, сценарии и описания для потока коротких видео.”
Артефакт: “shorts factory”

Кейс 4:
Название: “Автоматическая обработка РКО-лидов”
Описание: “Лид проходит через бот, попадает в таблицу/CRM, менеджер видит статус и следующий шаг.”
Артефакт: “RKO lead pipeline”

Кейс 5:
Название: “Своя CRM без разработчиков”
Описание: “Простая CRM под свой процесс: заявки, статусы, комментарии, фильтры, уведомления.”
Артефакт: “custom CRM”

6. Why now / FOMO section
Заголовок:
“Пока одни смотрят ролики про AI, другие уже собирают инструменты под клиентов и свои процессы”

Текст:
“Вайбкодинг — это не про то, чтобы стать программистом. Это про то, чтобы научиться объяснять задачу AI, проверять результат, править ошибки и доводить до работающей ссылки.”

Три карточки:
- “Скорость”
  “То, что раньше отдавали разработчику на недели, теперь можно собрать в черновик за вечер.”
- “Контроль”
  “Ты понимаешь, что происходит внутри, и можешь докручивать без новой сметы.”
- “Деньги”
  “Собранный артефакт можно использовать в своём процессе, показать клиенту или упаковать как кейс.”

7. Program / 14-day timeline
Сделай sticky scroll timeline. Каждый шаг — не “урок”, а “артефакт”.

Заголовок:
“Как проходит спринт”

Step 0:
“Подготовка”
“Настраиваем инструменты, выбираем задачу, приводим идею к понятному результату.”

Step 1:
“Формулируем задачу”
“Из ‘хочу автоматизацию’ делаем конкретное ТЗ: что должно открываться, куда падает заявка, кто пользуется.”

Step 2:
“Собираем первый интерфейс”
“Лендинг, форма, бот, CRM или dashboard — первый рабочий черновик.”

Step 3:
“Подключаем логику”
“Заявки, таблицы, уведомления, статусы, AI-ответы и интеграции.”

Step 4:
“Доводим до рабочего состояния”
“Правим ошибки, улучшаем UX, добавляем мобильную версию и деплой.”

Step 5:
“Упаковываем кейс”
“Фиксируем, что ты собрал, кому это нужно и как показать клиенту или использовать в своём процессе.”

Step 6:
“Демо-день”
“Показываешь рабочую ссылку, бота, CRM, контент-систему или агента.”

8. Format section
Заголовок:
“Ты не остаёшься один на один с кодом”

Карточки:
- “2 недели с кураторами”
  “Помогаем с настройкой, ошибками, промптами, деплоем и логикой проекта.”
- “Работа на своей задаче”
  “Можно прийти с идеей, оффером, каналом, клиентской задачей или рабочим процессом.”
- “Записи навсегда”
  “Все эфиры остаются в личном кабинете.”
- “Telegram-чат”
  “Вопросы, разборы, правки, быстрые подсказки.”
- “Шаблоны”
  “Стартовые шаблоны под лендинг, бота, CRM, автоконтент и заявки.”

9. Who it is for / not for
Сделай split section.

Подходит:
- “У тебя есть канал, оффер, клиентская задача или бизнес-процесс”
- “Хочешь собрать сайт, бота, CRM или агента без найма разработчика”
- “Хочешь научиться делать такие штуки себе или клиентам”
- “Готов работать руками, а не просто смотреть лекции”

Не подходит:
- “Хочешь пассивно посмотреть записи и ничего не делать”
- “Ждёшь кнопку ‘сделать бизнес за меня’”
- “Не готов ставить задачи, тестировать и править результат”
- “Ищешь гарантированный доход без действий”

10. Pricing / CTA
Если цена неизвестна, сделай блок без конкретной цены.

Заголовок:
“Закрытый поток стартует 21 числа”

Тарифы:
- “Базовый”
  “Записи, шаблоны, чат, самостоятельное прохождение”
- “С куратором”
  “Эфиры, чат, помощь кураторов, работа над своей задачей”
- “С личным разбором”
  “Дополнительные созвоны, помощь с выбором проекта, больше внимания к твоему кейсу”

CTA:
“Оставить заявку”
“Задать вопрос в Telegram”

Badge:
“Количество мест с кураторами ограничено, потому что каждый участник собирает свой проект.”

Ссылки CTA пока сделай переменными/константами в content:
APPLICATION_URL = "#apply"
TELEGRAM_URL = "https://t.me/lv3rson"
TODO: verify username spelling before launch: lv3rson vs Iv3rson.

11. FAQ
Сделай красивый accordion.

Вопросы и ответы:

“Я не программист. Мне можно?”
“Да. Здесь важнее научиться ставить задачу AI, проверять результат и доводить до рабочего состояния. Код руками писать не нужно, но думать и править придётся.”

“Что я точно соберу?”
“Зависит от задачи. Обычно это лендинг, бот, CRM, автоконтент, обработка лидов, AI-агент или MVP. На старте поможем выбрать реалистичный артефакт на 14 дней.”

“Если у меня нет идеи?”
“Дадим библиотеку идей: лендинг под оффер, бот для заявок, CRM, автоконтент, Shorts-система, RKO lead pipeline, AI-помощник.”

“Записи останутся?”
“Да, записи остаются в личном кабинете навсегда.”

“Кураторы правда помогают?”
“Да. Главная задача кураторов — чтобы ты не застрял на установке, ошибках, промптах, деплое и логике проекта.”

“Можно прийти с клиентской задачей?”
“Да. Это даже лучше: на выходе можно получить кейс, который проще показать и продать.”

“Будет ли гарантированный доход?”
“Нет. Мы не обещаем доход. Мы помогаем собрать рабочий инструмент и упаковать результат, а деньги зависят от твоего оффера, рынка, трафика и действий.”

12. Final CTA
Большой эффектный финальный экран:
“Через 14 дней у тебя может быть не папка с записями, а рабочая ссылка, бот, CRM или AI-система.”

CTA:
“Забронировать место в потоке”

Motion requirements:
- Framer Motion.
- Smooth scroll where appropriate.
- Scroll-triggered reveals.
- Hero assembly animation.
- Floating hero cards.
- Cursor glow.
- Magnetic buttons.
- Bento hover interactions.
- Scroll-pinned/sticky timeline.
- Case card microinteractions.
- Glowing connector lines.
- Animated gradients.
- Respect prefers-reduced-motion.
- Mobile FPS must stay good.
- Avoid huge videos and heavy 3D if performance suffers.

Specific 21st.dev Magic prompts to use internally:
Use these through the MCP if possible and adapt the output.

1. Hero:
“Create a cinematic dark navy and electric blue hero section for an AI build sprint landing page. It should include animated floating glass cards labeled Landing, Telegram Bot, CRM, AI Agent, Shorts Factory, RKO Leads. Add a glowing command-center orb, cursor spotlight, magnetic CTA buttons, typewriter command line, and responsive mobile-first layout. Style: premium, futuristic, non-template, 21st.dev-level polish.”

2. Bento:
“Create an interactive bento grid section for a Russian AI/vibecoding intensive. Cards: Landing, Telegram Bot, CRM, AI Sales Agent, Telegram Content System, YouTube Shorts Factory, RKO Lead Pipeline, MVP. Use dark glassmorphism, neon blue/violet glow, animated mini UI previews inside each card, hover expansion, cursor-follow gradients, and smooth Framer Motion transitions.”

3. Cases:
“Create a case studies section with five animated product cards. Each card looks like a live app window with mini UI animation: content automation, sales agents, YouTube Shorts factory, RKO lead processing, custom CRM. Style: premium AI lab, dark navy, glass cards, neon borders, scroll reveal, no stock photos.”

4. Timeline:
“Create a sticky scroll timeline for a 14-day AI build sprint. Each step unlocks an artifact: setup, task/PRD, first interface, logic/integrations, deploy, case packaging, demo day. Dark blue futuristic design, glowing connector line, animated nodes, cards that pin while scrolling, mobile-friendly vertical version.”

5. Pricing:
“Create a pricing and CTA section for a premium cohort-based AI build sprint. Three plans: Basic, With Curators, Personal Review. Dark glass cards, blue/violet glow, limited seats badge, start date badge, Telegram CTA, responsive mobile layout, high-converting but clean copy.”

6. FAQ:
“Create an FAQ accordion section for a vibecoding intensive. Questions about no coding background, what participants will build, recordings forever, curator support, client tasks, no guaranteed income. Design: dark, elegant, accessible, smooth accordion animation, subtle neon divider lines.”

Quality bar:
- Не делай скучный шаблон.
- Не делай generic SaaS.
- Не делай обычный “курсный” лендос.
- Главный экран должен быть сильнее большинства инфобиз-лендингов.
- Дизайн должен быть нестандартным, но не хаотичным.
- Текст должен быть простым и продающим.
- Все анимации должны помогать восприятию, а не мешать.
- На iPhone сайт должен выглядеть лучше, чем на desktop, потому что трафик из Telegram.
- Никаких фейковых метрик, фейковых отзывов, фейковых доходов.
- Никаких реальных имён/телефонов из скринов.

Performance requirements:
- Lighthouse target: 85+ performance.
- No huge video backgrounds.
- Lazy-load heavy visual components if needed.
- No horizontal overflow.
- Avoid layout shift.
- Use CSS/SVG/lightweight motion where possible.
- Respect prefers-reduced-motion.

SEO / meta:
Title:
“VibeCamp — собери свою AI-связку за 14 дней”

Description:
“Практический интенсив по вайбкодингу: лендинг, Telegram-бот, CRM, автоконтент, обработка лидов или AI-агент — с кураторами и записями навсегда.”

OpenGraph:
Сделай аккуратные meta tags. Если нет OG-картинки, оставь placeholder или сгенерируй красивый CSS-based preview section, но не ломай билд.

Дополнительная задача:
Создай AGENTS.md в корне проекта с краткими правилами:
- VibeCamp = AI Build Sprint, не абстрактный курс.
- Писать просто по-русски.
- Не обещать гарантированный доход.
- Дизайн dark blue / electric cyan / violet / glass / AI-lab.
- Использовать 21st.dev Magic MCP для UI-компонентов.
- Mobile-first.
- Перед финалом запускать lint/build.

После реализации обязательно:
1. Запусти pnpm lint.
2. Запусти pnpm build.
3. Если есть ошибки — исправь.
4. Проверь mobile layout.
5. Проверь, что нет horizontal overflow.
6. Проверь, что CTA есть на первом экране.
7. Проверь, что “Старт 21 числа”, “2 недели с кураторами”, “записи навсегда” видны вверху.
8. Проверь, что тексты в src/lib/content.ts.
9. В финальном ответе дай:
   - список созданных/изменённых файлов;
   - команды запуска;
   - что именно было использовано из 21st.dev Magic MCP;
   - какие части нужно будет руками заменить: Telegram URL, application URL, реальные скрины/кейсы, цена.

Работай до готового результата. Не останавливайся после плана. Не спрашивай уточнений, принимай разумные решения сам. Если есть несколько вариантов, выбирай тот, который даст самый сильный визуальный результат и быстрее приведёт к рабочему лендингу.
