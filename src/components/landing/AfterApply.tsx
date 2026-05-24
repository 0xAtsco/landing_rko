import { CheckCircle2 } from "lucide-react";
import { afterApplySteps } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";

export function AfterApply() {
  return (
    <SectionReveal className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-lg border border-cyan-200/14 bg-[#07172d]/76 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-cyan-200/80">
                после заявки
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-[1.02] text-white sm:text-5xl">
                Что происходит после заявки
              </h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {afterApplySteps.map((step, index) => (
                <div
                  key={step}
                  className="relative overflow-hidden rounded-lg border border-white/10 bg-black/18 p-4"
                >
                  <div aria-hidden="true" className="absolute right-3 top-3 font-mono text-4xl font-semibold text-cyan-200/10">
                    {index + 1}
                  </div>
                  <div className="relative z-10 flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-cyan-200" />
                    <p className="text-sm leading-6 text-slate-200">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
