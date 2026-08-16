import { TELEGRAM_URL, finalCta } from "@/lib/content";
import { MagneticButton } from "./MagneticButton";
import { SectionReveal } from "./SectionReveal";

export function FinalCTA() {
  return (
    <SectionReveal className="px-4 pb-16 pt-2 sm:px-6 sm:pb-20 sm:pt-4">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-lg border border-signal/18 bg-[var(--surface-2)]/88 p-6 text-center shadow-[0_0_100px_rgb(var(--signal-rgb)/0.14),inset_0_1px_0_rgb(var(--signal-rgb)/0.08)] backdrop-blur-xl sm:p-8">
        <div className="tiffany-dot-field absolute inset-0 opacity-30" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgb(var(--signal-rgb)/0.08),transparent)]" />
        <div className="relative mx-auto mb-4 h-12 max-w-md rounded-full bg-[radial-gradient(circle,rgb(var(--signal-rgb)/0.30),rgb(var(--signal-rgb)/0.16),transparent_70%)] blur-xl" />
        <h2 className="relative mx-auto max-w-3xl text-balance text-3xl font-semibold leading-[1.08] text-[#f4ffff] sm:text-4xl">
          {finalCta.title}
        </h2>
        <div className="relative mt-6">
          <MagneticButton href={TELEGRAM_URL} analytics="final_apply">{finalCta.cta}</MagneticButton>
        </div>
      </div>
    </SectionReveal>
  );
}
