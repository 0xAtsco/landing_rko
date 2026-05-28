import { Suspense } from "react";
import { LeadChat } from "@/components/demo/rko/LeadChat";
import { RkoShell } from "@/components/demo/rko/RkoShell";

export default function RkoPlaygroundPage() {
  return (
    <RkoShell
      kicker="public playground"
      title="Попробуйте AI-квалификацию РКО-заявки без доступа к общей CRM"
    >
      <Suspense fallback={<div className="mt-8 rounded-lg border border-white/10 bg-white/[0.055] p-5 text-slate-300">Загружаем playground...</div>}>
        <LeadChat playground />
      </Suspense>
    </RkoShell>
  );
}
