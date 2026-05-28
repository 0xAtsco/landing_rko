import { RkoShell } from "@/components/demo/rko/RkoShell";
import { LeadDashboard } from "@/components/demo/rko/LeadDashboard";

export default function RkoDashboardPage() {
  return (
    <RkoShell kicker="crm command center" title="Заявки превращаются в понятные карточки для менеджера">
      <LeadDashboard />
    </RkoShell>
  );
}
