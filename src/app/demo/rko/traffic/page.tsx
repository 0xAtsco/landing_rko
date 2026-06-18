import { RkoShell } from "@/components/demo/rko/RkoShell";
import { TrafficDashboard } from "@/components/demo/rko/TrafficDashboard";

export default function RkoTrafficPage() {
  return (
    <RkoShell kicker="traffic quality" title="Качество источников видно до того, как менеджер тратит время">
      <TrafficDashboard />
    </RkoShell>
  );
}
