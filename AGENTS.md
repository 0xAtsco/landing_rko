# Project Rules

- Git workflow:
  - `server-prod` is the stable branch that mirrors the deployed server version.
  - Do all local work in `work/server-prod-next`.
  - Merge into `server-prod` only after explicit approval and after `pnpm lint` + `pnpm build` pass.
- VibeCamp = AI Build Sprint, not an abstract AI course.
- Write simply in Russian: short, specific, human.
- Do not promise guaranteed income or fixed revenue.
- Visual direction: operational intelligence-terminal — one dark surface, one signal accent (amber). See `DESIGN.md` (source of truth). No cyan+violet glassmorphism rainbow.
- Use 21st.dev Magic MCP for UI component inspiration/generation when changing key UI sections.
- Build mobile-first. Telegram traffic is the main context.
- Keep landing copy in `src/lib/content.ts`.
- Before final delivery, run `pnpm lint` and `pnpm build`.
- This project uses a recent Next.js version. Check local Next docs if framework behavior is unclear.
