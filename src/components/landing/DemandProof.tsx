import { MessageCircle } from "lucide-react";
import { demandSection } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";
import { SectionHeading } from "./SectionPrimitives";

export function DemandProof() {
  return (
    <SectionReveal className="relative overflow-hidden px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 grid gap-5 lg:grid-cols-[0.9fr_0.45fr] lg:items-end">
          <SectionHeading {...demandSection.heading} />
          <RequestMeter />
        </div>

        <div className="relative overflow-hidden rounded-lg border border-cyan-200/14 bg-white/[0.04] py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:backdrop-blur-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#031225] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#031225] to-transparent" />
          <div className="messages-marquee hidden w-max gap-3 px-3 md:flex">
            {[...demandSection.messages, ...demandSection.messages].map((message, index) => (
              <div
                key={`${message}-${index}`}
                className="flex w-[260px] shrink-0 items-start gap-3 rounded-lg border border-cyan-200/14 bg-[#071a33]/85 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.24)]"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-cyan-300/12 text-cyan-200">
                  <MessageCircle className="size-4" aria-hidden="true" />
                </span>
                <span className="text-sm leading-5 text-slate-100">{message}</span>
              </div>
            ))}
          </div>
          <div className="grid gap-3 px-3 md:hidden">
            {demandSection.messages.slice(0, 3).map((message) => (
              <div
                key={message}
                className="flex items-start gap-3 rounded-lg border border-cyan-200/14 bg-[#071a33]/85 p-4 shadow-[0_12px_34px_rgba(0,0,0,0.2)]"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-cyan-300/12 text-cyan-200">
                  <MessageCircle className="size-4" aria-hidden="true" />
                </span>
                <span className="text-sm leading-5 text-slate-100">{message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}

function RequestMeter() {
  return (
    <div className="rounded-lg border border-cyan-200/14 bg-[#071a33]/70 p-4 font-mono text-xs text-slate-300 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-cyan-100">запросы</span>
        <span className="rounded bg-cyan-300 px-1.5 py-0.5 text-[10px] text-slate-950">live</span>
      </div>
      <div className="space-y-2" aria-hidden="true">
        {[82, 56, 74].map((value, index) => (
          <div key={value} className="grid grid-cols-[52px_1fr] items-center gap-2">
            <span className="text-slate-500">ch.0{index + 1}</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <span className="block h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-300" style={{ width: `${value}%` }} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
