import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqSection } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";
import { SectionHeading } from "./SectionPrimitives";

export function FAQ() {
  return (
    <SectionReveal id="faq" className="px-4 py-20 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading {...faqSection.heading} />
        <Accordion type="single" collapsible defaultValue="item-0" className="space-y-3">
          {faqSection.items.map((faq, index) => (
            <AccordionItem
              key={faq.question}
              value={`item-${index}`}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-4 backdrop-blur-xl"
            >
              <AccordionTrigger className="text-left text-base font-semibold text-white hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-6 text-slate-300">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </SectionReveal>
  );
}
