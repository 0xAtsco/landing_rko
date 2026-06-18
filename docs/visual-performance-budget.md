# Visual performance budget

Дата: 2026-05-27

Цель: вернуть premium wow после performance sprint без возврата лагов, микрофризов и перегрева.

## Motion modes

Режим выставляет `MotionBudgetController` через `document.documentElement.dataset.motionMode`.

- `full`: desktop, pointer fine, no reduced motion.
- `lite`: mobile/coarse pointer или компактный viewport.
- `reduced`: `prefers-reduced-motion: reduce`.

Правило: тяжёлый wow работает только в `full`, лёгкие one-shot/fade эффекты могут работать в `lite`, почти всё выключается в `reduced`.

## Что вернули

Hero:

- isolated `HeroWowLayer`;
- floating glass cards: Landing, Telegram Bot, CRM, AI Agent, RKO Leads;
- command-center orb;
- animated flow line;
- typewriter command line;
- throttled rAF pointer parallax только в `full`.

Bento / Cases:

- hover lift/tilt только на pointer fine;
- cursor-tracking glow через CSS variables и один global rAF listener;
- scroll reveal через IntersectionObserver + CSS classes;
- mini UI overlay поверх case preview images.

DemandProof:

- desktop CSS marquee;
- pause on hover/focus;
- mobile static message cards;
- no heavy blur.

Demo RKO:

- toast для нового лида;
- one-shot row highlight;
- score/class pulse только у нового лида;
- source quality bars animate once on render;
- pagination/memo сохранены.

## Запрещённые эффекты без отдельного решения

- Возвращать Framer Motion во все секции.
- Делать каждую landing-секцию client component.
- Анимировать `width`, `height`, `top`, `left`, layout или большие SVG geometry.
- Вешать `mousemove/pointermove` на каждую карточку отдельно.
- Использовать `will-change` на всей странице или больших контейнерах.
- Бесконечно анимировать `filter`, `backdrop-filter`, большие blur layers.
- Включать desktop-level effects на mobile/coarse pointer.
- Рендерить 100+ лидов в таблице без pagination/virtualization.

## Как проверять

1. Production build:

```bash
PATH="/Users/absq/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" ./node_modules/.bin/eslint
PATH="/Users/absq/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" ./node_modules/.bin/next build
PATH="/Users/absq/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" ./node_modules/.bin/next start -p 3001
```

2. Browser smoke:

- `/` или landing route;
- `/demo/rko/dashboard`;
- `/demo/rko/chat?source=warm_telegram&campaign=rko_marketplace`;
- `/demo/rko/traffic`.

3. Mobile viewport:

- 390x844;
- no horizontal overflow;
- first viewport is not empty;
- hero effects stay light.

4. Reduced motion:

- emulate `prefers-reduced-motion: reduce`;
- animations should be effectively disabled;
- content remains visible.

5. FPS/lag check:

- Chrome Performance panel, 4x CPU throttle;
- scroll landing from hero to cases;
- click Generate demo leads;
- create hot lead in chat and watch dashboard.

## What not to bring back casually

- Framer Motion page-wide reveal.
- Large animated conic gradients on every section.
- Huge `blur-3xl` + `backdrop-blur-xl` stacks on mobile.
- Per-card React pointer state.
- Tables without page/virtual boundaries.
