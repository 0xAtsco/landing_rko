import { CheckCircle2, CreditCard } from "lucide-react";
import { TELEGRAM_URL, pricingSection } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";
import { ApplicationButton } from "./ApplicationButton";

export function Pricing() {
  return (
    <SectionReveal id="pricing" className="px-4 pb-4 pt-16 sm:px-6 sm:pb-6 sm:pt-20">
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
        </div>

        <div className="relative z-10 grid gap-4 lg:grid-cols-2">
          {pricingSection.plans.map((plan) => (
            <article
              key={plan.title}
              className={`relative flex min-h-[420px] flex-col rounded-lg border p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)] ${
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
                <ApplicationButton tariff={plan.title} className="w-full" />
              </div>
            </article>
          ))}
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

export function Installment() {
  return (
    <SectionReveal id="apply" className="px-4 py-14 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl rounded-xl border border-signal/28 bg-[var(--surface-2)]/92 p-6 shadow-[0_24px_88px_rgba(0,0,0,0.28),inset_0_1px_0_rgb(var(--signal-rgb)/0.1)] sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="flex items-start gap-5">
            <span className="grid size-14 shrink-0 place-items-center rounded-lg border border-signal/28 bg-signal/10 text-signal-bright">
              <CreditCard className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-signal-bright">
                {pricingSection.installment.label}
              </p>
              <h2 className="mt-2 max-w-xl text-balance text-3xl font-semibold leading-[1.08] text-[#f4ffff] sm:text-5xl">
                {pricingSection.installment.title}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#d9eeee] sm:text-lg">
                {pricingSection.installment.text}
              </p>
              <a
                href={TELEGRAM_URL}
                data-analytics="installment_question"
                className="mt-5 inline-flex min-h-11 items-center rounded-lg border border-signal/22 bg-signal/10 px-4 py-2.5 text-sm font-semibold text-[#f4ffff] transition hover:bg-signal/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-strong"
              >
                Возникли какие-то вопросы? — Напиши Андрею в личку
              </a>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {pricingSection.plans.map((plan) => (
              <ApplicationButton
                key={plan.title}
                tariff={plan.title}
                label={`${plan.title} в рассрочку`}
                compact
              />
            ))}
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
