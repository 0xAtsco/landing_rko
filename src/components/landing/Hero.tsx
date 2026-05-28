import { Badge } from "@/components/ui/badge";
import { APPLICATION_URL, hero } from "@/lib/content";
import { HeroWowLayer } from "./HeroWowLayer";
import { MagneticButton } from "./MagneticButton";

export function Hero() {
  return (
    <section className="relative isolate min-h-[88svh] overflow-hidden px-4 pb-4 pt-24 sm:px-6 sm:pb-8 lg:pt-28">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_46%_12%,rgb(var(--signal-rgb)/0.28),transparent_26rem),radial-gradient(circle_at_14%_34%,rgb(var(--signal-rgb)/0.24),transparent_22rem),linear-gradient(180deg,var(--surface-base)_0%,var(--surface-2)_48%,var(--surface-base)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:38px_38px] opacity-35 [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />
        <div className="hero-shader absolute left-1/2 top-[-8rem] h-[760px] w-[760px] -translate-x-1/2 rounded-full blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--surface-base)] to-transparent" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[0.96fr_1.04fr]">
        <div className="relative z-10 min-w-0 max-w-full text-center lg:text-left">
          <div>
          <Badge className="mb-5 max-w-full whitespace-normal rounded-md border-signal/25 bg-signal/10 px-3 py-1.5 text-center text-[11px] font-medium leading-5 text-signal-bright shadow-[0_0_24px_rgb(var(--signal-rgb)/0.16)] hover:bg-signal/10 sm:text-xs">
            {hero.badge}
          </Badge>
          </div>
          <h1 className="mx-auto max-w-[calc(100vw-2rem)] text-balance text-[2.45rem] font-semibold leading-[0.94] tracking-normal text-white drop-shadow-[0_0_22px_rgb(var(--signal-rgb)/0.12)] sm:max-w-4xl sm:text-5xl lg:mx-0 lg:text-[4.15rem] xl:text-[4.55rem]">
            <span>
              {hero.title}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-slate-100/90 lg:mx-0 lg:text-xl">
            {hero.subtitle}
          </p>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400 lg:mx-0">
            {hero.support}
          </p>

          <div className="mx-auto mt-5 max-w-2xl rounded-lg border border-signal/18 bg-[var(--surface-2)]/72 p-2 shadow-[inset_0_0_34px_rgb(var(--signal-rgb)/0.08)] md:backdrop-blur-md lg:mx-0">
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-slate-200 sm:text-xs lg:justify-start">
              {hero.miniFlow.map((step, index) => (
                <span key={step} className="flex items-center gap-2">
                  <span className="rounded-md border border-white/10 bg-white/[0.055] px-2.5 py-1.5">
                    {step}
                  </span>
                  {index < hero.miniFlow.length - 1 ? (
                    <span className="text-signal">→</span>
                  ) : null}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <MagneticButton href={APPLICATION_URL} analytics="hero_apply">{hero.primaryCta}</MagneticButton>
            <MagneticButton href="#builds" variant="secondary">
              {hero.secondaryCta}
            </MagneticButton>
          </div>

          <div className="mt-6 flex flex-nowrap justify-start gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible lg:justify-start">
            {hero.proofChips.map((chip) => (
              <span
                key={chip}
                className="shrink-0 rounded-lg border border-white/10 bg-white/[0.055] px-3 py-1.5 text-xs text-slate-200 backdrop-blur"
              >
                {chip}
              </span>
            ))}
          </div>

          <div className="sm:hidden">
            <HeroMobileVisual />
          </div>

        </div>

        <div data-reveal className="relative mx-auto hidden h-[520px] min-w-0 w-full max-w-[640px] sm:block lg:h-[600px]">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[1.6rem] border border-signal/18 bg-[var(--surface-1)]/82 p-5 shadow-[0_34px_120px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgb(var(--signal-rgb)/0.24),transparent_16rem),radial-gradient(circle_at_82%_16%,rgb(var(--signal-rgb)/0.18),transparent_18rem),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_40%)]" />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:26px_26px] opacity-35 [mask-image:radial-gradient(circle_at_center,black,transparent_82%)]" />

      <div className="relative z-10 flex items-center justify-between rounded-lg border border-white/10 bg-black/24 px-4 py-3 font-mono text-[11px] text-slate-300">
        <span className="text-signal-bright">traffic.ops/live</span>
        <span className="text-emerald-300">signal stable</span>
        <span className="text-signal">14d sprint</span>
      </div>

      <div className="relative z-10 mt-5 h-[calc(100%-76px)] min-h-[420px] overflow-hidden rounded-[1.25rem] border border-signal/12 bg-black/16">
        <HeroWowLayer commands={hero.commands} />
      </div>
    </div>
  );
}

function HeroMobileVisual() {
  return (
    <div className="mx-auto mt-5 max-w-sm overflow-hidden rounded-lg border border-signal/18 bg-[var(--surface-2)]/78 p-3 shadow-[0_18px_56px_rgb(var(--signal-rgb)/0.1)] backdrop-blur-md">
      <div className="grid grid-cols-[0.76fr_1fr] gap-3">
        <div className="relative grid min-h-28 place-items-center overflow-hidden rounded-md border border-signal/14 bg-black/20">
          <div className="radar-sweep absolute inset-4 rounded-full opacity-80" />
          <div className="absolute inset-7 rounded-full border border-signal/18" />
          <div className="grid size-14 place-items-center rounded-full border border-signal/30 bg-signal/10 shadow-[0_0_34px_rgb(var(--signal-rgb)/0.32)]">
            <div className="size-5 rounded-full bg-signal shadow-[0_0_24px_rgb(var(--signal-rgb)/0.9)]" />
          </div>
        </div>
        <div className="space-y-1.5 rounded-md border border-white/10 bg-black/20 p-2 text-left font-mono text-[10px] text-signal-bright">
          {hero.queueRows.map((row) => (
            <div
              key={row.name}
              className="grid grid-cols-[1fr_auto] gap-2 rounded bg-white/[0.055] px-2 py-1.5"
            >
              <span>{row.name}</span>
              <span className="text-signal">{row.status}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-medium text-slate-200">
        {hero.miniFlow.map((step, index) => (
          <span key={step} className="flex items-center gap-1.5">
            <span className="rounded border border-white/10 bg-white/[0.055] px-2 py-1">{step}</span>
            {index < hero.miniFlow.length - 1 ? <span className="text-signal">→</span> : null}
          </span>
        ))}
      </div>
    </div>
  );
}
