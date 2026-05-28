import { Bot, CalendarDays, LayoutDashboard, Rocket, Send, WalletCards } from "lucide-react";
import { buildsSection } from "@/lib/content";
import { BuildPreview } from "./PreviewWidgets";
import { SectionReveal } from "./SectionReveal";
import { GlassCard, SectionHeading, TechPanel } from "./SectionPrimitives";

const icons = [Rocket, Send, LayoutDashboard, Bot, CalendarDays, Rocket, WalletCards, LayoutDashboard] as const;

export function BentoBuilds() {
  return (
    <SectionReveal id="builds" className="relative px-4 py-20 sm:px-6">
      <div aria-hidden="true" className="absolute inset-x-0 top-8 h-40 skew-y-[-3deg] bg-signal-strong/[0.035]" />
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 grid gap-4 lg:grid-cols-[0.9fr_0.55fr] lg:items-end">
          <SectionHeading {...buildsSection.heading} titleClassName="leading-[0.98]" />
          <TechPanel label={buildsSection.stats.label} value={buildsSection.stats.value} />
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {buildsSection.items.map((item, index) => {
            const Icon = icons[index];
            const wide = index === 0 || index === 2 || index === 6;
            return (
              <div
                key={item.title}
                data-reveal
                data-hover-glow
                className={`${wide ? "lg:col-span-2 " : ""}motion-safe:transition motion-safe:duration-300 motion-safe:hover:-translate-y-1`}
              >
                <GlassCard className="group motion-tilt-card min-h-[270px] bg-[var(--surface-2)]/86" interactive>
                  <div className="motion-cursor-glow absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100" />
                  <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                    <div>
                      <div className="mb-4 grid size-11 place-items-center rounded-lg border border-signal/20 bg-signal/10 text-signal">
                        <Icon className="size-5" />
                      </div>
                      <h3 className="text-xl font-semibold leading-tight text-white">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                    </div>
                    <BuildPreview type={item.preview} />
                  </div>
                </GlassCard>
              </div>
            );
          })}
        </div>
      </div>
    </SectionReveal>
  );
}
