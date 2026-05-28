import { Suspense } from "react";
import { RkoShell } from "@/components/demo/rko/RkoShell";
import { LeadChat } from "@/components/demo/rko/LeadChat";

export default function RkoChatPage() {
  return (
    <RkoShell kicker="live ai chat" title="AI вживую ведёт диалог и собирает CRM-карточку">
      <Suspense fallback={<div className="mt-8 rounded-lg border border-white/10 bg-white/[0.055] p-5 text-slate-300">Загружаем live chat...</div>}>
        <LeadChat />
      </Suspense>
    </RkoShell>
  );
}
