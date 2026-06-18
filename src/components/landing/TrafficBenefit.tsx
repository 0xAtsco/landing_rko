import { Bot, CheckCircle2, Laptop, Sparkles, Sprout } from "lucide-react";
import { trafficBenefitSection } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";

const benefitIcons = [Laptop, Bot, Sprout] as const;

export function TrafficBenefit() {
  const [beforeHighlight, afterHighlight = ""] = trafficBenefitSection.title.split(trafficBenefitSection.highlight);

  return (
    <SectionReveal id="traffic" className="relative isolate overflow-hidden px-4 py-16 sm:px-6 sm:py-20">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_74%_24%,rgb(var(--signal-rgb)/0.14),transparent_32rem)]" />
      <div className="mx-auto flex max-w-6xl flex-col gap-9 lg:gap-11">
        <div
          data-hover-glow
          className="relative overflow-hidden rounded-xl border border-signal/18 bg-[var(--surface-2)]/78 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.26),inset_0_1px_0_rgb(var(--signal-rgb)/0.08)] sm:p-6 lg:p-8"
        >
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_82%_16%,rgb(var(--signal-rgb)/0.12),transparent_24rem)]" />
          <div className="relative z-10 max-w-5xl">
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-signal-bright">traffic / связки</p>
            <h2 className="text-balance text-[2.75rem] font-semibold leading-[0.94] text-[#f4ffff] sm:text-6xl lg:text-[4.6rem] xl:text-[5.1rem]">
              {beforeHighlight}
              <span className="relative inline-block text-signal-bright drop-shadow-[0_0_24px_rgb(var(--signal-rgb)/0.28)]">
                {trafficBenefitSection.highlight}
                {afterHighlight}
                <span aria-hidden="true" className="absolute inset-x-0 -bottom-2 h-1 rounded-full bg-gradient-to-r from-transparent via-signal to-transparent" />
              </span>
            </h2>
            <div className="mt-7 border-t border-signal/14 pt-6">
              <p className="text-pretty text-2xl font-semibold leading-[1.2] text-[#f4ffff] sm:text-3xl lg:text-[2.35rem]">
                {trafficBenefitSection.offer}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-7 lg:grid-cols-[1.02fr_0.88fr] lg:items-start lg:gap-10">
          <article
            data-hover-glow
            className="relative overflow-hidden rounded-xl border border-signal/24 bg-signal/10 p-5 shadow-[0_24px_90px_rgb(var(--signal-rgb)/0.10),inset_0_1px_0_rgb(var(--signal-rgb)/0.08)] sm:p-6 lg:flex lg:min-h-[500px] lg:flex-col lg:justify-between lg:p-8"
          >
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgb(var(--signal-rgb)/0.18),transparent_22rem)]" />
            <div className="relative z-10">
              <div className="mb-10 flex items-center justify-between gap-4">
                <span className="grid size-12 place-items-center rounded-lg border border-signal/22 bg-black/20 text-signal-bright">
                  <Laptop className="size-6" aria-hidden="true" />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal/70">01</span>
              </div>
              <p className="text-balance text-3xl font-semibold leading-tight text-[#f4ffff] sm:text-4xl lg:text-5xl">
                {trafficBenefitSection.benefitCards[0]}
              </p>
            </div>
            <div className="relative z-10 mt-10 rounded-lg border border-signal/14 bg-black/20 p-4 lg:mt-16">
              <div className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-signal-bright">
                <Sparkles className="size-4" aria-hidden="true" />
                понятная польза
              </div>
              <p className="text-sm leading-6 text-[#d9eeee]/88">
                Быстро показываешь человеку рабочий инструмент, а не абстрактную просьбу открыть счет.
              </p>
            </div>
          </article>

          <div className="grid gap-8 lg:py-8">
            {trafficBenefitSection.benefitCards.slice(1).map((text, index) => {
              const Icon = benefitIcons[index + 1];
              const number = String(index + 2).padStart(2, "0");

              return (
                <article
                  key={text}
                  data-hover-glow
                  className={`relative overflow-hidden rounded-xl border border-signal/18 bg-[var(--surface-2)]/72 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.22),inset_0_1px_0_rgb(var(--signal-rgb)/0.06)] sm:p-6 lg:min-h-[205px] ${
                    index === 1 ? "lg:ml-10" : "lg:mr-10"
                  }`}
                >
                  <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_88%_12%,rgb(var(--signal-rgb)/0.13),transparent_16rem)]" />
                  <div className="relative z-10">
                    <div className="mb-8 flex items-center justify-between gap-4">
                      <span className="grid size-11 place-items-center rounded-lg border border-signal/20 bg-signal/10 text-signal-bright">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal/70">{number}</span>
                    </div>
                    <p className="text-balance text-2xl font-semibold leading-tight text-[#f4ffff] sm:text-3xl">{text}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-signal/18 bg-[var(--surface-2)]/78 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.22),inset_0_1px_0_rgb(var(--signal-rgb)/0.06)] sm:p-6 lg:mx-8 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <p className="text-pretty text-xl leading-8 text-[#d9eeee] sm:text-2xl sm:leading-9">
            {trafficBenefitSection.community}
          </p>
          <div className="mt-6 border-t border-signal/14 pt-6 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-signal-bright">
              {trafficBenefitSection.useCasesTitle}
            </p>
            <div className="space-y-3">
              {trafficBenefitSection.useCases.map((item) => (
                <div key={item} className="flex items-start gap-3 text-base leading-6 text-[#f4ffff]">
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-signal" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
