import { Gauge, HandCoins, SlidersHorizontal } from "lucide-react";
import { whyNowSection } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";
import { GlassCard, SectionHeading } from "./SectionPrimitives";

const icons = [Gauge, SlidersHorizontal, HandCoins] as const;

export function WhyNow() {
  return (
    <SectionReveal className="px-4 py-20 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-lg border border-white/10 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-8 lg:p-10">
        <div aria-hidden="true" className="absolute right-[-12rem] top-[-10rem] size-96 rounded-full bg-cyan-300/10 blur-3xl" />
        <SectionHeading {...whyNowSection.heading} className="relative z-10 max-w-4xl" />

        <div className="relative z-10 mt-8 grid gap-3 md:grid-cols-3">
          {whyNowSection.cards.map((card, index) => {
            const Icon = icons[index] ?? Gauge;
            return (
              <GlassCard key={card.title} className="bg-[#06172e]/70">
                <Icon className="mb-5 size-6 text-cyan-200" aria-hidden="true" />
                <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{card.text}</p>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </SectionReveal>
  );
}
