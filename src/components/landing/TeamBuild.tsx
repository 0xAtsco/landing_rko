import { CircuitBoard, Compass, LifeBuoy } from "lucide-react";
import { teamCards, teamSection } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";
import { SectionHeading } from "./SectionPrimitives";

const icons = [Compass, CircuitBoard, LifeBuoy];

export function TeamBuild() {
  return (
    <SectionReveal className="relative px-4 py-20 sm:px-6">
      <div aria-hidden="true" className="absolute inset-x-0 top-10 h-48 bg-[radial-gradient(circle_at_50%_40%,rgb(var(--signal-rgb)/0.1),transparent_34rem)]" />
      <div className="mx-auto max-w-6xl">
        <SectionHeading {...teamSection} className="mb-8 max-w-4xl" />

        <div className="grid gap-4 lg:grid-cols-3">
          {teamCards.map((card, index) => {
            const Icon = icons[index];

            return (
              <article
                key={card.title}
                className="group relative overflow-hidden rounded-lg border border-white/10 bg-[var(--surface-2)]/82 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.2)] transition motion-safe:hover:-translate-y-1 md:backdrop-blur-md"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgb(var(--signal-rgb)/0.16),transparent_22rem),radial-gradient(circle_at_92%_100%,rgb(var(--signal-rgb)/0.16),transparent_20rem)] opacity-80" />
                <div className="relative z-10">
                  <div className="mb-5 flex justify-end">
                    <span className="grid size-11 place-items-center rounded-lg border border-signal/20 bg-signal-strong/10 text-signal-bright">
                      <Icon className="size-5" />
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{card.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </SectionReveal>
  );
}
