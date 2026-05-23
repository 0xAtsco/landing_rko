# VibeCamp Landing

Production-ready landing page for VibeCamp / AI Build Sprint.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- lucide-react

## Run

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Checks

```bash
pnpm lint
pnpm build
```

## Content

Landing copy, CTA URLs, pricing plan text, FAQ, cases, and section data live in
`src/lib/content.ts`.

Replace before launch:

- `APPLICATION_URL`
- `TELEGRAM_URL`
- real prices, if needed
- real screenshots or case visuals, if available

The original implementation brief is preserved in `PROJECT_BRIEF.md`.
