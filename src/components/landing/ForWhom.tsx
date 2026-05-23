import { Check, X } from "lucide-react";
import { audienceSection } from "@/lib/content";
import { GlassCard } from "./SectionPrimitives";
import { SectionReveal } from "./SectionReveal";

export function ForWhom() {
  return (
    <SectionReveal className="px-4 py-20 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-2">
        <AudienceCard title={audienceSection.goodTitle} items={audienceSection.good} positive />
        <AudienceCard title={audienceSection.badTitle} items={audienceSection.bad} />
      </div>
    </SectionReveal>
  );
}

function AudienceCard({ title, items, positive = false }: { title: string; items: readonly string[]; positive?: boolean }) {
  const Icon = positive ? Check : X;
  return (
    <GlassCard className="bg-white/[0.04] p-5 sm:p-7">
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item} className="flex gap-3 rounded-lg bg-[#06172e]/70 p-3 text-sm leading-6 text-slate-200">
            <Icon className={positive ? "mt-1 size-4 shrink-0 text-cyan-200" : "mt-1 size-4 shrink-0 text-violet-200"} aria-hidden="true" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
