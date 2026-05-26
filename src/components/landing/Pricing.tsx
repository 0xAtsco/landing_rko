import { CheckCircle2, Circle, CreditCard, Send } from "lucide-react";
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
            <h2 className="mt-5 text-3xl font-semibold leading-[1.02] text-white sm:text-5xl">
              {pricingSection.title}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
              {pricingSection.description}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <MagneticButton href={APPLICATION_URL} analytics="pricing_apply">
              {pricingSection.primaryCta}
            </MagneticButton>
            <MagneticButton href={TELEGRAM_URL} variant="secondary" analytics="telegram_click">
              {pricingSection.secondaryCta}
            </MagneticButton>
          </div>
        </div>

        <div className="relative z-10 mb-5 overflow-hidden rounded-lg border border-emerald-200/35 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(34,211,238,0.12),rgba(168,85,247,0.12))] p-4 shadow-[0_0_54px_rgba(16,185,129,0.16)] sm:p-5">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200/80 to-transparent" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-md border border-emerald-200/30 bg-emerald-200/14 text-emerald-100">
                <CreditCard className="size-5" aria-hidden="true" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                  {pricingSection.installment.label}
                </span>
                <h3 className="mt-1 text-2xl font-semibold text-white">
                  {pricingSection.installment.title}
                </h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-50/85">
                  {pricingSection.installment.text}
                </p>
              </div>
            </div>
            <MagneticButton href={TELEGRAM_URL} variant="secondary" analytics="installment_click">
              Узнать рассрочку
            </MagneticButton>
          </div>
        </div>

        <div className="relative z-10 grid gap-4 lg:grid-cols-3">
          {pricingSection.plans.map((plan) => (
            <GlassCard
              key={plan.title}
              className={`flex min-h-[520px] flex-col ${
                plan.featured
                  ? "border-cyan-200/55 bg-cyan-200/10 shadow-[0_0_54px_rgba(34,211,238,0.18)]"
                  : "bg-black/16"
              }`}
            >
              {plan.featured ? (
                <span className="absolute right-4 top-0 -translate-y-1/2 rounded-md bg-cyan-300 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-950">
                  популярный
                </span>
              ) : null}

              <h3 className="text-2xl font-semibold text-white">{plan.title}</h3>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-4xl font-semibold leading-none text-white sm:text-5xl">
                  {plan.price}
                </span>
                <span className="pb-1 text-sm text-slate-500">/ {plan.usd}</span>
              </div>
              <p className="mt-4 min-h-[72px] text-sm leading-6 text-slate-300">
                {plan.text}
              </p>

              <div className="my-6 h-px bg-white/10" />

              <div className="space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-sm leading-6 text-slate-100">
                    <CheckCircle2 className="mt-1 size-4 shrink-0 text-cyan-200" aria-hidden="true" />
                    <span>{feature}</span>
                  </div>
                ))}
                {plan.mutedFeatures.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-sm leading-6 text-slate-500">
                    <Circle className="mt-1.5 size-3.5 shrink-0 fill-slate-600 text-slate-600" aria-hidden="true" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-8">
                <MagneticButton href={APPLICATION_URL} analytics="pricing_apply" className="w-full">
                  {pricingSection.primaryCta}
                </MagneticButton>
                <div className="mt-4 flex items-center justify-center gap-2 rounded-md border border-cyan-200/18 bg-cyan-300/10 px-3 py-2 text-center text-xs font-semibold text-cyan-100">
                  <CreditCard className="size-3.5" aria-hidden="true" />
                  Доступна рассрочка от Т-Банка
                </div>
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
