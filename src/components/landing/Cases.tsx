import { Play } from "lucide-react";
import { APPLICATION_URL, casesSection, videoTestimonials } from "@/lib/content";
import { MagneticButton } from "./MagneticButton";
import { SectionReveal } from "./SectionReveal";
import { SectionHeading } from "./SectionPrimitives";

export function StudentCases() {
  return (
    <SectionReveal id="cases" className="relative px-4 py-16 sm:px-6 sm:py-20">
      <div
        aria-hidden="true"
        className="absolute left-0 top-24 h-72 w-full bg-[radial-gradient(circle_at_72%_30%,rgb(var(--signal-rgb)/0.14),transparent_34rem)]"
      />
      <div className="mx-auto max-w-6xl">
        <SectionHeading {...casesSection.heading} className="mb-8 max-w-4xl" />

        <div className="grid gap-4 lg:grid-cols-2">
          {videoTestimonials.map((item, index) => (
            <article
              key={item.person}
              data-reveal
              data-hover-glow
              className={`group relative overflow-hidden rounded-xl border border-signal/16 bg-[var(--surface-2)]/86 shadow-[0_22px_86px_rgba(0,0,0,0.30),inset_0_1px_0_rgb(var(--signal-rgb)/0.06)] transition hover:border-signal/36 hover:shadow-[0_28px_96px_rgb(var(--signal-rgb)/0.08)] ${
                index === 0 ? "lg:col-span-2 lg:grid lg:grid-cols-[1.15fr_0.85fr]" : ""
              }`}
            >
              <div aria-hidden="true" className="absolute inset-x-0 top-0 z-20 h-px bg-signal/70" />
              <div
                className={`relative overflow-hidden border-b border-signal/14 bg-black/50 ${
                  index === 0 ? "lg:border-b-0 lg:border-r" : ""
                }`}
              >
                <video
                  className={`aspect-video w-full bg-black object-cover ${index === 0 ? "lg:h-full lg:aspect-auto" : ""}`}
                  src={item.video.src}
                  poster={item.video.poster}
                  controls
                  playsInline
                  preload="metadata"
                  aria-label={item.video.ariaLabel}
                />
                <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-md border border-white/12 bg-black/72 px-2.5 py-1.5 backdrop-blur-sm">
                  <Play className="size-3.5 fill-signal text-signal" aria-hidden="true" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#d9eeee]">
                    {item.video.duration}
                  </span>
                </div>
              </div>

              <div className={`relative z-10 flex flex-col ${index === 0 ? "p-5 sm:p-7" : "p-5 sm:p-6"}`}>
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-signal/25 bg-signal/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-signal-bright">
                    отзыв {item.number}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#7f9292]">
                    {item.format}
                  </span>
                </div>

                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-signal-bright">{item.person}</p>
                  <h3
                    className={`mt-3 text-balance font-semibold leading-[1.02] text-[#f4ffff] ${
                      index === 0 ? "text-3xl sm:text-5xl" : "text-2xl sm:text-3xl"
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-4 text-base leading-7 text-[#b9cccc]">{item.summary}</p>
                </div>

                <div className="mt-5 border-l-2 border-signal/55 bg-black/22 px-4 py-3">
                  <p className="text-sm leading-6 text-[#d9eeee]">{item.outcome}</p>
                </div>

                {index === 0 ? (
                  <div className="mt-auto hidden pt-7 lg:block">
                    <MagneticButton href={APPLICATION_URL} analytics="case_apply" className="w-full sm:w-fit">
                      Хочу собрать свой инструмент
                    </MagneticButton>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 flex justify-center lg:hidden">
          <MagneticButton href={APPLICATION_URL} analytics="case_apply_mobile" className="w-full sm:w-fit">
            Хочу собрать свой инструмент
          </MagneticButton>
        </div>
      </div>
    </SectionReveal>
  );
}

export const Cases = StudentCases;
