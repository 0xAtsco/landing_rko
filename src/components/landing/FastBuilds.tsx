import { Bot, Clock3, DatabaseZap, Lightbulb, PanelsTopLeft, Sparkles } from "lucide-react";
import { fastBuildsSection } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";

const icons = [PanelsTopLeft, Bot, DatabaseZap, Sparkles, Lightbulb] as const;

export function FastBuilds() {
  return (
    <SectionReveal className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20">
      <div aria-hidden="true" className="absolute inset-x-0 top-16 h-60 bg-[radial-gradient(circle_at_34%_20%,rgb(var(--signal-rgb)/0.12),transparent_30rem)]" />
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 grid gap-5 lg:grid-cols-[0.95fr_0.55fr] lg:items-end">
          <div>
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.22em] text-signal-bright">быстрая сборка</p>
            <h2 className="text-balance text-4xl font-semibold leading-[0.98] text-[#f4ffff] sm:text-6xl">
              {fastBuildsSection.title}
            </h2>
          </div>
          <div className="rounded-lg border border-signal/16 bg-[var(--surface-2)]/78 p-4">
            <div className="mb-3 flex items-center gap-2 text-signal-bright">
              <Clock3 className="size-4" aria-hidden="true" />
              <span className="font-mono text-[11px] uppercase tracking-[0.16em]">30 min build skill</span>
            </div>
            <p className="text-sm leading-6 text-[#93a3a3]">
              Это не “теория про ИИ”, а набор понятных артефактов, которые можно быстро показать человеку или бизнесу.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {fastBuildsSection.items.map((item, index) => {
            const Icon = icons[index] ?? Sparkles;

            return (
              <article
                key={item.title}
                data-reveal
                data-hover-glow
                className="group relative overflow-hidden rounded-xl border border-signal/16 bg-[var(--surface-2)]/84 p-4 shadow-[0_18px_70px_rgba(0,0,0,0.22),inset_0_1px_0_rgb(var(--signal-rgb)/0.06)] transition hover:-translate-y-0.5 hover:border-signal/34 hover:bg-[var(--surface-1)]"
              >
                <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_78%_16%,rgb(var(--signal-rgb)/0.12),transparent_15rem)] opacity-0 transition group-hover:opacity-100" />
                <div className="relative z-10">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="grid size-11 place-items-center rounded-lg border border-signal/20 bg-signal/10 text-signal-bright">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-[11px] text-signal/75">0{index + 1}</span>
                  </div>
                  <h3 className="text-xl font-semibold leading-tight text-[#f4ffff]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#93a3a3]">{item.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </SectionReveal>
  );
}
