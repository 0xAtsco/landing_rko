# Production Smoke — Baseline (T0.3)

Дата: 2026-05-28 · Ветка: `feature/vibecamp-launch` · после T0.1 + T0.2.
Назначение: зафиксировать стартовое «зелёное» состояние, чтобы ловить регрессии в последующих задачах.

## Условия прогона
- Сборка: `pnpm build` (Next.js 16.2.6, Turbopack) — production.
- Сервер: `next start -p 3100` (production, не dev).
- Браузер: gstack `browse` (headless Chromium).
- Вьюпорты: desktop **1280×720**, mobile **390×844**.

## Гейт сборки
| Проверка | Результат |
|---|---|
| `pnpm lint` (eslint) | ✅ чисто, 0 ошибок / 0 ворнингов |
| `pnpm build` | ✅ успех, 17/17 роутов сгенерированы |

## Smoke по 4 DoD-роутам

| Роут | Console (errors/warn) | Overflow @1280 | Overflow @390 |
|---|---|---|---|
| `/` | ✅ нет | ✅ нет (1280=1280) | ✅ нет (390=390) |
| `/demo/rko/dashboard` | ✅ нет | ✅ нет | ✅ нет |
| `/demo/rko/chat` | ✅ нет | ✅ нет | ✅ нет |
| `/demo/rko/traffic` | ✅ нет | ✅ нет | ✅ нет |

`hasOverflow` считался как `documentElement.scrollWidth > clientWidth`. На всех роутах `scrollWidth == clientWidth`.
Таблица лидов в дашборде скроллится **внутри своего контейнера** (overflow-x на обёртке), поэтому горизонтального оверфлоу страницы нет.

## Скриншоты
`/tmp/rko-smoke/`: `desktop_{root,dashboard,chat,traffic}.png`, `mobile_{root,dashboard,chat,traffic}.png`.
Визуально проверены mobile hero и mobile dashboard — раскладка корректная, без сломов.

## Вывод
**Baseline зелёный.** lint + build проходят; ни console errors, ни горизонтального оверфлоу на 4 DoD-роутах ни на desktop, ни на 390px. Это точка отсчёта для регрессий в P1–P5.

> Замечание (не баг, не в скоупе T0.3): полностраничный скриншот лендинга показывает «пустые» зоны ниже первого экрана — это ожидаемо из-за `content-visibility:auto` на дальних секциях (контент не красится, пока не доскроллено). На живом скролле секции проявляются нормально.
