import { CalendarDays, CheckCircle2, CreditCard } from "lucide-react";
import { TELEGRAM_URL, pricingSection } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";
import { MagneticButton } from "./MagneticButton";

export function Pricing() {
  const filledSeatsPercent = Math.max(0, Math.min(100, 100 - pricingSection.deadline.remainingPercent));

  return (
    <SectionReveal id="apply" className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-xl border border-signal/20 bg-[var(--surface-1)]/88 p-4 shadow-[0_0_90px_rgb(var(--signal-rgb)/0.12),inset_0_1px_0_rgb(var(--signal-rgb)/0.08)] backdrop-blur-md sm:p-6 lg:p-8">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal/60 to-transparent" />
        <div aria-hidden="true" className="absolute right-[-7rem] top-[-8rem] size-72 rounded-full bg-signal-bright/12 blur-3xl" />

        <div className="relative z-10 mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold leading-[1.02] text-[#f4ffff] sm:text-5xl">
              {pricingSection.title}
            </h2>
            {pricingSection.description ? (
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[#93a3a3]">
                {pricingSection.description}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <MagneticButton href={TELEGRAM_URL} analytics="pricing_apply">
              {pricingSection.primaryCta}
            </MagneticButton>
            <MagneticButton href={TELEGRAM_URL} variant="secondary" analytics="telegram_click">
              {pricingSection.secondaryCta}
            </MagneticButton>
          </div>
        </div>

        <div className="relative z-10 mb-5 overflow-hidden rounded-lg border border-signal/24 bg-signal/10 p-4 shadow-[0_0_42px_rgb(var(--signal-rgb)/0.10)] sm:p-5">
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-md border border-signal/25 bg-black/20 text-signal-bright">
                <CreditCard className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-[#f4ffff]">
                  {pricingSection.installment.title}
                </h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#d9eeee]">
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
            <article
              key={plan.title}
              className={`relative flex min-h-[470px] flex-col rounded-lg border p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)] ${
                plan.featured
                  ? "border-signal/55 bg-signal/10"
                  : "border-signal/16 bg-[var(--surface-2)]/78"
              }`}
            >
              {plan.featured ? (
                <span className="absolute right-4 top-4 rounded-md border border-signal/30 bg-signal/12 px-2.5 py-1 text-xs font-semibold text-signal-bright">
                  частый выбор
                </span>
              ) : null}
              <h3 className="pr-28 text-2xl font-semibold text-[#f4ffff]">{plan.title}</h3>
              <div className="mt-4">
                <span className="text-4xl font-semibold leading-none text-[#f4ffff] sm:text-5xl">
                  {plan.price}
                </span>
              </div>
              <p className="mt-4 min-h-[72px] text-sm leading-6 text-[#93a3a3]">
                {plan.text}
              </p>

              <div className="my-6 border-t border-dashed border-signal/16" />

              <div className="space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-sm leading-6 text-[#d9eeee]">
                    <CheckCircle2 className="mt-1 size-4 shrink-0 text-signal" aria-hidden="true" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-8">
                <MagneticButton href={TELEGRAM_URL} analytics="pricing_apply" className="w-full">
                  {pricingSection.primaryCta}
                </MagneticButton>
              </div>
            </article>
          ))}
        </div>

        <div className="relative z-10 mt-5 overflow-hidden rounded-lg border border-signal/22 bg-[var(--surface-2)]/86 p-4 shadow-[0_18px_70px_rgba(0,0,0,0.24),inset_0_1px_0_rgb(var(--signal-rgb)/0.08)] sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-md border border-signal/24 bg-signal/10 text-signal-bright">
                <CalendarDays className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-signal-bright">
                  {pricingSection.deadline.label}
                </p>
                <h3 className="mt-1 text-2xl font-semibold leading-tight text-[#f4ffff]">
                  {pricingSection.deadline.title}
                </h3>
              </div>
            </div>
            <div className="w-full md:max-w-xs">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[#f4ffff]">
                  {pricingSection.deadline.remainingText}
                </span>
                <span className="font-mono text-[11px] text-signal-bright">
                  {pricingSection.deadline.remainingPercent}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-signal shadow-[0_0_18px_rgb(var(--signal-rgb)/0.45)]"
                  style={{ width: `${filledSeatsPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {pricingSection.note ? (
          <p className="relative z-10 mt-5 rounded-lg border border-signal/14 bg-black/18 p-4 text-sm leading-6 text-[#93a3a3]">
            {pricingSection.note}
          </p>
        ) : null}
      </div>
    </SectionReveal>
  );
}
