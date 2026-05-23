import { APPLICATION_URL } from "@/lib/content";
import { MagneticButton } from "./MagneticButton";
import { SectionReveal } from "./SectionReveal";

export function FinalCTA() {
  return (
    <SectionReveal className="px-4 pb-24 pt-10 sm:px-6">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-lg border border-white/10 bg-[#07172d]/86 p-6 text-center shadow-[0_0_100px_rgba(34,211,238,0.18)] backdrop-blur-xl sm:p-10">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(34,211,238,0.08),transparent)]" />
        <div className="relative mx-auto mb-6 h-24 max-w-lg rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.34),rgba(124,58,237,0.18),transparent_70%)] blur-xl" />
        <h2 className="relative mx-auto max-w-4xl text-balance text-3xl font-semibold leading-[1.04] text-white sm:text-5xl">
          Через 14 дней у тебя может быть не папка с записями, а рабочая ссылка,
          бот, CRM или AI-система.
        </h2>
        <div className="relative mt-8">
          <MagneticButton href={APPLICATION_URL}>Забронировать место в потоке</MagneticButton>
        </div>
      </div>
    </SectionReveal>
  );
}
