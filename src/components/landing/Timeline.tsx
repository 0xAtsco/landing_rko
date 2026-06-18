import { timelineSection } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";
import { SectionHeading } from "./SectionPrimitives";

export function Timeline() {
  return (
    <SectionReveal id="timeline" className="relative px-4 py-20 sm:px-6">
      <div aria-hidden="true" className="absolute inset-x-0 top-1/2 h-48 -translate-y-1/2 skew-y-3 bg-signal-strong/[0.035]" />
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="top-24 h-fit rounded-lg border border-white/10 bg-black/16 p-5 backdrop-blur-xl lg:sticky">
          <SectionHeading {...timelineSection.heading} />
          <div className="mt-7 rounded-lg border border-signal/12 bg-[var(--surface-2)]/75 p-4" aria-hidden="true">
            <div className="grid grid-cols-8 gap-1.5" aria-hidden="true">
              {Array.from({ length: 8 }, (_, index) => (
                <span key={index} className={index > 4 ? "h-10 rounded-sm border border-signal/50 bg-signal-strong/45" : "h-10 rounded-sm border border-white/8 bg-white/[0.06]"} />
              ))}
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-5 top-0 h-full w-px bg-white/10 md:left-1/2" />
          <div
            aria-hidden="true"
            className="absolute left-5 top-0 h-full w-px origin-top bg-gradient-to-b from-signal via-signal-strong to-transparent shadow-[0_0_16px_rgb(var(--signal-rgb)/0.38)] md:left-1/2"
          />
          <div className="space-y-5">
            {timelineSection.items.map((item, index) => (
              <article
                key={item.title}
                className={index % 2 === 0 ? "relative pl-14 md:w-1/2 md:pr-10" : "relative pl-14 md:ml-auto md:w-1/2 md:pl-10"}
              >
                <span className={index % 2 === 0 ? "absolute left-0 top-5 size-10 rounded-full border border-signal/35 bg-signal-strong/20 shadow-[0_0_22px_rgb(var(--signal-rgb)/0.24)] md:left-auto md:right-[-1.25rem]" : "absolute left-0 top-5 size-10 rounded-full border border-signal/35 bg-signal-strong/20 shadow-[0_0_22px_rgb(var(--signal-rgb)/0.24)] md:left-[-1.25rem]"} aria-hidden="true" />
                <div className="group rounded-lg border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl transition duration-300 hover:border-signal/25 hover:bg-white/[0.06] hover:shadow-[0_24px_80px_rgb(var(--signal-rgb)/0.08)]">
                  <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
