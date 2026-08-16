import { CheckCircle2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatSection } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";
import { SectionHeading } from "./SectionPrimitives";

export function Outcomes() {
  return (
    <SectionReveal id="outcomes" className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading {...formatSection.heading} className="mb-6" />
        <Accordion
          type="multiple"
          defaultValue={formatSection.items.map((_, index) => `outcome-${index}`)}
          className="gap-3"
        >
          {formatSection.items.map((item, index) => (
            <AccordionItem
              key={item.title}
              value={`outcome-${index}`}
              className="overflow-hidden rounded-xl border border-signal/16 bg-[var(--surface-2)]/84 shadow-[0_18px_70px_rgba(0,0,0,0.22),inset_0_1px_0_rgb(var(--signal-rgb)/0.06)]"
            >
              <AccordionTrigger className="gap-4 px-4 py-4 text-left hover:no-underline sm:px-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-signal/20 bg-signal/10 font-mono text-sm text-signal-bright">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-semibold leading-tight text-[#f4ffff] sm:text-2xl">{item.title}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 sm:px-5">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
                  <ul className="grid gap-3">
                    {item.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3 text-sm leading-6 text-[#d9eeee] sm:text-base sm:leading-7">
                        <CheckCircle2 className="mt-1 size-4 shrink-0 text-signal-bright" aria-hidden="true" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="rounded-lg border border-signal/22 bg-signal/10 p-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-signal-bright">результат</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#f4ffff]">{item.result}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </SectionReveal>
  );
}

export const Format = Outcomes;
