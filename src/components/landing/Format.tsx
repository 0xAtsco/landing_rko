import { CircleDot } from "lucide-react";
import { formatCards } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";

export function Format() {
  return (
    <SectionReveal id="format" className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-cyan-200/80">
            support system
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-[1.02] text-white sm:text-5xl">
            Ты не остаешься один на один с кодом
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {formatCards.map((item) => (
            <article key={item.title} className="rounded-lg border border-white/10 bg-[#07172d]/78 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.14)]">
              <CircleDot className="mb-5 size-5 text-cyan-200" />
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}
