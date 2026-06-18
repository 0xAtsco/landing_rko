import { buildsSection } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";

export function WhatIsVibecoding() {
  return (
    <SectionReveal
      id="vibecoding"
      className="relative overflow-hidden px-4 py-0 sm:px-6"
    >
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,var(--surface-base),var(--surface-1)_52%,var(--surface-base))]" />
      <div aria-hidden="true" className="tiffany-dot-field absolute inset-0 opacity-35" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--surface-base)] to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="grid min-h-[100svh] content-center gap-7 py-20 sm:py-24">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-signal/22 bg-signal/10 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-signal-bright">
              {buildsSection.heading.title}
            </span>
            <span className="rounded-md border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs text-[#93a3a3]">
              AI Build Sprint
            </span>
          </div>

          <h2 className="max-w-[12ch] break-words text-balance font-heading text-5xl font-semibold uppercase leading-[1.02] tracking-normal text-[#f4ffff] sm:text-7xl md:text-8xl lg:text-[8.75rem] xl:text-[9.75rem]">
            {buildsSection.heading.title}
          </h2>

          {buildsSection.heading.description ? (
            <p className="max-w-2xl text-pretty text-lg leading-8 text-[#d9eeee]/90 sm:text-xl">
              {buildsSection.heading.description}
            </p>
          ) : null}

          <div className="relative max-w-5xl overflow-hidden rounded-lg border border-signal/28 bg-[var(--surface-2)]/88 p-5 shadow-[0_22px_90px_rgba(0,0,0,0.34),0_0_50px_rgb(var(--signal-rgb)/0.12),inset_0_1px_0_rgb(var(--signal-rgb)/0.1)] sm:p-7 lg:p-8">
            <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-signal/75" />
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_85%_12%,rgb(var(--signal-rgb)/0.14),transparent_16rem)]" />
            <div className="relative z-10 space-y-5 pl-2">
              <p className="text-pretty text-xl font-semibold leading-8 text-[#f4ffff] sm:text-2xl sm:leading-10 lg:text-[1.7rem] lg:leading-[1.45]">
                {buildsSection.plainDefinition}
              </p>
              <p className="max-w-3xl border-t border-signal/14 pt-4 text-base leading-7 text-[#d9eeee]/82 sm:text-lg sm:leading-8">
                {buildsSection.mobileNote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}

export const BentoBuilds = WhatIsVibecoding;
