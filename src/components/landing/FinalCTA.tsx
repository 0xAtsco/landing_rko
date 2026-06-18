import { APPLICATION_URL, finalCta } from "@/lib/content";
import { MagneticButton } from "./MagneticButton";
import { SectionReveal } from "./SectionReveal";

export function FinalCTA() {
  return (
    <SectionReveal className="px-4 pb-24 pt-10 sm:px-6">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-lg border border-signal/18 bg-[var(--surface-2)]/88 p-6 text-center shadow-[0_0_100px_rgb(var(--signal-rgb)/0.14),inset_0_1px_0_rgb(var(--signal-rgb)/0.08)] backdrop-blur-xl sm:p-10">
        <div className="tiffany-dot-field absolute inset-0 opacity-30" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgb(var(--signal-rgb)/0.08),transparent)]" />
        <div className="relative mx-auto mb-6 h-24 max-w-lg rounded-full bg-[radial-gradient(circle,rgb(var(--signal-rgb)/0.30),rgb(var(--signal-rgb)/0.16),transparent_70%)] blur-xl" />
        <h2 className="relative mx-auto max-w-4xl text-balance text-3xl font-semibold leading-[1.04] text-[#f4ffff] sm:text-5xl">
          {finalCta.title}
        </h2>
        <div className="relative mt-8">
          <MagneticButton href={APPLICATION_URL} analytics="pricing_apply">{finalCta.cta}</MagneticButton>
        </div>
      </div>
    </SectionReveal>
  );
}
