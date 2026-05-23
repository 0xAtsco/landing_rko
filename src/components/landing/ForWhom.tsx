import { Check, X } from "lucide-react";
import { audience } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";

export function ForWhom() {
  return (
    <SectionReveal className="px-4 py-20 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-2">
        <AudienceCard title="Подходит" items={audience.good} positive />
        <AudienceCard title="Не подходит" items={audience.bad} />
      </div>
    </SectionReveal>
  );
}

function AudienceCard({
  title,
  items,
  positive = false,
}: {
  title: string;
  items: string[];
  positive?: boolean;
}) {
  const Icon = positive ? Check : X;
  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:p-7">
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item} className="flex gap-3 rounded-lg bg-[#06172e]/70 p-3 text-sm leading-6 text-slate-200">
            <Icon className={`mt-1 size-4 shrink-0 ${positive ? "text-cyan-200" : "text-violet-200"}`} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
