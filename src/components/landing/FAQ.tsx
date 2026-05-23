import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";

export function FAQ() {
  return (
    <SectionReveal id="faq" className="px-4 py-20 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-cyan-200/80">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-5xl">
            Вопросы, которые обычно задают перед стартом
          </h2>
        </div>
        <Accordion type="single" collapsible defaultValue="item-0" className="space-y-3">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.question}
              value={`item-${index}`}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-4 backdrop-blur-xl"
            >
              <AccordionTrigger className="text-left text-base font-semibold text-white hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-6 text-slate-300">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </SectionReveal>
  );
}
