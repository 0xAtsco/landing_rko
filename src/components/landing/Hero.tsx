import { APPLICATION_URL, hero } from "@/lib/content";
import { MagneticButton } from "./MagneticButton";
import { TrafficSystemHeroAnimation } from "./TrafficSystemHeroAnimation";

export function Hero() {
  const titleParts = hero.title.split("вайбкодинга");

  return (
    <section className="relative isolate overflow-hidden px-4 pb-12 pt-24 sm:px-6 sm:pb-16 lg:pt-28">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_12%,rgb(var(--signal-rgb)/0.20),transparent_25rem),linear-gradient(180deg,var(--surface-base)_0%,var(--surface-2)_52%,var(--surface-base)_100%)]" />
        <div className="tiffany-dot-field absolute inset-0 opacity-50" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[var(--surface-base)] to-transparent" />
      </div>

      <div className="mx-auto grid min-h-[calc(100svh-6rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="relative z-10 min-w-0 max-w-full text-center lg:text-left">
          <h1 className="mx-auto max-w-[calc(100vw-2rem)] text-balance text-[2.45rem] font-semibold leading-[1] tracking-normal text-[#f4ffff] drop-shadow-[0_0_22px_rgb(var(--signal-rgb)/0.12)] sm:max-w-4xl sm:text-5xl lg:mx-0 lg:text-[4.05rem] xl:text-[4.45rem]">
            {titleParts.length > 1 ? (
              <>
                {titleParts[0]}
                <span className="text-signal-bright">вайбкодинга</span>
                {titleParts.slice(1).join("вайбкодинга")}
              </>
            ) : (
              hero.title
            )}
          </h1>
          {hero.subtitle ? (
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-[#d9eeee]/90 lg:mx-0 lg:text-xl">
              {hero.subtitle}
            </p>
          ) : null}

          <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <MagneticButton href={APPLICATION_URL} analytics="hero_apply">
              {hero.primaryCta}
            </MagneticButton>
          </div>
        </div>

        <div data-reveal className="relative mx-auto w-full max-w-[650px]">
          <TrafficSystemHeroAnimation />
        </div>
      </div>
    </section>
  );
}
