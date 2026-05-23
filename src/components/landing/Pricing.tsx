import { CheckCircle2, Send } from "lucide-react";
import { APPLICATION_URL, TELEGRAM_URL, pricingSection } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";
import { MagneticButton } from "./MagneticButton";
import { GlassCard } from "./SectionPrimitives";

export function Pricing() {
  return (
    <SectionReveal id="apply" className="px-4 py-20 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-lg border border-cyan-200/15 bg-[linear-gradient(135deg,rgba(8,47,73,0.72),rgba(17,24,39,0.82),rgba(76,29,149,0.34))] p-5 shadow-[0_0_100px_rgba(34,211,238,0.18)] backdrop-blur-xl sm:p-8 lg:p-10">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/60 to-transparent" />
        <div aria-hidden="true" className="absolute right-[-7rem] top-[-8rem] size-72 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="relative z-10 mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="rounded-md border border-cyan-200/25 bg-cyan-200/10 px-3 py-1.5 text-xs font-semibold text-cyan-100">
              {pricingSection.badge}
            </span>
            <h2 className="mt-5 text-3xl font-semibold leading-[1.02] text-white sm:text-5xl">{pricingSection.title}</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <MagneticButton href={APPLICATION_URL}>{pricingSection.primaryCta}</MagneticButton>
            <MagneticButton href={TELEGRAM_URL} variant="secondary">
              {pricingSection.secondaryCta}
            </MagneticButton>
          </div>
        </div>

        <div className="relative z-10 grid gap-4 lg:grid-cols-3">
          {pricingSection.plans.map((plan) => (
            <GlassCard
              key={plan.title}
              className={plan.featured ? "border-cyan-200/40 bg-cyan-200/10 shadow-[0_0_44px_rgba(34,211,238,0.14)]" : "bg-black/16"}
            >
              {plan.featured ? (
                <span className="absolute right-4 top-4 rounded-md bg-cyan-300 px-2.5 py-1 text-[11px] font-semibold text-slate-950">
                  чаще выбирают
                </span>
              ) : null}
              <h3 className="text-2xl font-semibold text-white">{plan.title}</h3>
              <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-300">{plan.text}</p>
              <div className="mt-6 space-y-2">
                {pricingSection.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-slate-200">
                    <CheckCircle2 className="size-4 text-cyan-200" aria-hidden="true" />
                    {feature}
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
        <p className="relative z-10 mt-5 flex items-center gap-2 text-sm text-slate-300">
          <Send className="size-4 shrink-0 text-cyan-200" aria-hidden="true" />
          {pricingSection.note}
        </p>
      </div>
    </SectionReveal>
  );
}
