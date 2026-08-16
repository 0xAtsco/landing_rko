import { Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5">
      <nav aria-label="VibeCamp" className="mx-auto flex h-14 max-w-6xl items-center justify-center rounded-lg border border-signal/18 bg-[var(--surface-1)]/78 px-3 shadow-[0_8px_40px_rgba(0,0,0,0.42),inset_0_1px_0_rgb(var(--signal-rgb)/0.08)] backdrop-blur-xl sm:h-16 sm:px-5">
        <a href="#" className="flex items-center gap-2 rounded text-sm font-semibold text-[#f4ffff] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-strong" aria-label="VibeCamp — наверх страницы">
          <span className="grid size-8 place-items-center rounded-md border border-signal/30 bg-signal/10 text-signal shadow-[0_0_22px_rgb(var(--signal-rgb)/0.16)]">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          VibeCamp
        </a>
      </nav>
    </header>
  );
}
