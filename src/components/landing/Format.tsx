import { CircleDot } from "lucide-react";
import { formatSection } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";
import { GlassCard, SectionHeading } from "./SectionPrimitives";

export function Format() {
  return (
    <SectionReveal id="format" className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading {...formatSection.heading} className="mb-10" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {formatSection.cards.map((item) => (
            <GlassCard key={item.title}>
              <CircleDot className="mb-5 size-5 text-cyan-200" aria-hidden="true" />
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}
