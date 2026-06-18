import { APPLICATION_URL, cases, casesSection } from "@/lib/content";
import { MagneticButton } from "./MagneticButton";
import { SectionReveal } from "./SectionReveal";
import { SectionHeading } from "./SectionPrimitives";

export function StudentCases() {
  return (
    <SectionReveal id="cases" className="relative px-4 py-16 sm:px-6 sm:py-20">
      <div aria-hidden="true" className="absolute left-0 top-24 h-72 w-full bg-[radial-gradient(circle_at_72%_30%,rgb(var(--signal-rgb)/0.14),transparent_34rem)]" />
      <div className="mx-auto max-w-6xl">
        <SectionHeading {...casesSection.heading} className="mb-8 max-w-4xl" />

        <div className="space-y-6 sm:space-y-8">
          {cases.map((item) => (
            <article
              key={item.person}
              data-reveal
              data-hover-glow
              className="group relative overflow-hidden rounded-xl border border-signal/16 bg-[var(--surface-2)]/86 p-4 shadow-[0_22px_86px_rgba(0,0,0,0.30),inset_0_1px_0_rgb(var(--signal-rgb)/0.06)] transition hover:border-signal/36 hover:shadow-[0_28px_96px_rgb(var(--signal-rgb)/0.08)] sm:p-6 lg:p-8"
            >
              <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgb(var(--signal-rgb)/0.14),transparent_24rem),linear-gradient(135deg,rgb(var(--signal-rgb)/0.07),transparent_34%)]" />
              <div className="motion-cursor-glow absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100" />

              <div className="relative z-10 flex flex-col gap-7">
                <div>
                  <div className="mb-5 flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-signal/25 bg-signal/10 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.16em] text-signal-bright">
                      кейс {item.number}
                    </span>
                    <span className="rounded-md border border-signal/14 bg-black/20 px-3 py-1.5 text-xs text-[#93a3a3]">
                      {item.person}
                    </span>
                  </div>

                  <h3 className="text-balance text-5xl font-semibold leading-[0.9] tracking-normal text-[#f4ffff] sm:text-7xl lg:text-8xl">
                    {item.person}
                  </h3>
                  <p className="mt-5 max-w-5xl text-pretty text-2xl font-semibold leading-tight text-[#d9eeee] sm:text-3xl lg:text-4xl">
                    {item.achievement}
                  </p>
                </div>

                <blockquote className="max-w-5xl whitespace-pre-line rounded-lg border border-dashed border-signal/24 bg-black/24 p-4 text-lg font-medium leading-7 text-[#d9eeee] sm:p-6 sm:text-2xl sm:leading-9">
                  {item.quote}
                </blockquote>

                <MagneticButton href={APPLICATION_URL} analytics="case_apply" className="w-full sm:w-fit">
                  Хочу собрать похожее
                </MagneticButton>
              </div>
            </article>
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}

export const Cases = StudentCases;
