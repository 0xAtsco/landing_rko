# Performance sprint report

Дата: 2026-05-27

Зона работ:

- основной landing VibeCamp;
- demo RKO Lead Command Center: `/demo/rko`, `/demo/rko/chat`, `/demo/rko/dashboard`, `/demo/rko/traffic`.

## Что тормозило

- Почти все крупные секции лендинга были client components из-за декоративного Framer Motion reveal/hover.
- Header считал scroll progress через Framer Motion.
- Hero был целиком client component с множеством `motion.*` элементов.
- Cursor glow слушал каждый `pointermove`.
- На mobile продолжали жить тяжёлые blur/gradient/infinite CSS animations.
- В demo dashboard таблица рендерила все лиды сразу.
- `selectedLead` менял состояние родителя и мог перерендеривать всю таблицу.
- Store делал лишнее уведомление подписчиков после записи в `localStorage`.
- Generate demo leads синхронно обновлял UI без явного low-priority transition.

## Что изменено

- Убран Framer Motion из landing-кода. Визуал оставлен через CSS hover/transitions.
- `Header`, `Hero`, `BentoBuilds`, `Tracks`, `TeamBuild`, `Timeline`, `Cases`, `DemandProof`, `SectionReveal`, `MagneticButton` переведены в server/static components там, где не нужен интерактив.
- `SectionReveal` получил `content-visibility: auto`, чтобы браузер не тратил лишнюю работу на далёкие секции.
- Cursor glow переписан без Framer Motion: один `requestAnimationFrame` на pointer frame, только для `(hover: hover) and (pointer: fine)`.
- На mobile/coarse pointer отключены бесконечные декоративные animations: shader, radar, signal lines, matrix/case/chat/pipeline pulses, typewriter, marquee.
- На mobile снижены blur/backdrop-filter для тяжёлых glass/gradient слоёв.
- RKO chat больше не импортирует Framer Motion для сообщений.
- RKO table показывает 40 строк на страницу вместо всех 100+ сразу.
- `LeadTable`, `LeadRow`, `LeadDetailPanel`, `SourceQualityTable` мемоизированы.
- Dashboard stats считаются одним проходом по лидам.
- Generate demo leads запускает обновление через отложенный callback и `startTransition`.
- Store больше не триггерит двойной re-render после `writeLeads`.

## Изменённые файлы

- `src/app/globals.css`
- `src/components/landing/CursorGlow.tsx`
- `src/components/landing/Header.tsx`
- `src/components/landing/Hero.tsx`
- `src/components/landing/MagneticButton.tsx`
- `src/components/landing/SectionReveal.tsx`
- `src/components/landing/BentoBuilds.tsx`
- `src/components/landing/Tracks.tsx`
- `src/components/landing/TeamBuild.tsx`
- `src/components/landing/Timeline.tsx`
- `src/components/landing/Cases.tsx`
- `src/components/landing/DemandProof.tsx`
- `src/components/demo/rko/LeadChat.tsx`
- `src/components/demo/rko/LeadDashboard.tsx`
- `src/components/demo/rko/LeadTable.tsx`
- `src/components/demo/rko/LeadDetailPanel.tsx`
- `src/components/demo/rko/SourceQualityTable.tsx`
- `src/components/demo/rko/TrafficDashboard.tsx`
- `src/lib/rko/store.ts`

## Before / after

До:

- `next build` проходил, но лендинг имел много client components и Framer Motion boundaries.
- Demo table рендерила все лиды.
- Cursor glow обновлял motion values на каждый pointer event.

После:

- `rg "framer-motion|motion\\." src/app src/components src/lib` не находит usage.
- `next build` проходит.
- Основной `page_client-reference-manifest.js`: около 12 KB.
- Demo dashboard HTML: около 31 KB.
- Demo table: 40 visible rows per page.
- Browser production smoke-check: root, dashboard, generate, chat submit, traffic без console errors.
- Mobile viewport check: horizontal overflow не найден для root и dashboard.

## Что отключено / упрощено на mobile

- animated gradient shift;
- hero shader spin;
- radar sweep;
- SVG signal-flow animation;
- matrix/case/pipeline/chat pulse animations;
- typewriter caret/typing;
- demand marquee;
- heavy blur/backdrop blur снижены до более лёгкого уровня.

## Проверки

`pnpm` и `npm` в текущем окружении недоступны. Проверял через локальный Node runtime и установленные binaries:

```bash
PATH="/Users/absq/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" ./node_modules/.bin/eslint
PATH="/Users/absq/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" ./node_modules/.bin/next build
PATH="/Users/absq/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" ./node_modules/.bin/next start -p 3001
```

Проверено в production browser smoke:

- `/`
- `/demo/rko/dashboard`
- `/demo/rko/chat?source=warm_telegram&campaign=rko_marketplace`
- `/demo/rko/traffic`

Lighthouse не запускался: `lighthouse` не установлен в `node_modules/.bin`, а глобального package manager в окружении нет.

## Что оптимизировать позже

- Подключить bundle analyzer для точной route-level JS картины.
- Сделать real virtualization для таблицы, если лидов станет больше 500–1000.
- Перевести landing images в AVIF/WebP pipeline с несколькими responsive размерами.
- Вынести RKO store в selector-based external store, если появятся более тяжёлые dashboard widgets.
- Добавить Lighthouse CI или Playwright performance budget.
