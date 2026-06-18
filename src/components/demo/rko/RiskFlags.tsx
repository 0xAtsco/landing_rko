import { riskLabels } from "@/lib/rko/constants";
import type { RiskFlag } from "@/lib/rko/types";

export function RiskFlags({ flags }: { flags: RiskFlag[] }) {
  if (flags.length === 0) {
    return <span className="inline-flex rounded-md border border-emerald-300/25 bg-emerald-300/10 px-2 py-1 text-xs text-emerald-100">рисков нет</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {flags.map((flag) => (
        <span key={flag} className="inline-flex rounded-md border border-rose-300/25 bg-rose-300/10 px-2 py-1 text-xs text-rose-100">
          {riskLabels[flag]}
        </span>
      ))}
    </div>
  );
}
