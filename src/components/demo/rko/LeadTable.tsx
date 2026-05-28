"use client";

import { memo, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { entityLabels, needLabels, sourceLabels, urgencyLabels } from "@/lib/rko/constants";
import type { Lead } from "@/lib/rko/types";
import { cn } from "@/lib/utils";
import { LeadClassBadge } from "./LeadClassBadge";
import { RiskFlags } from "./RiskFlags";

const PAGE_SIZE = 40;
const heads = ["ID", "source", "contact", "entityType", "business", "city", "turnover", "needs", "urgency", "score", "class", "risk", "status", "nextAction"];

const LeadRow = memo(function LeadRow({ lead, selected, highlighted, onSelect }: { lead: Lead; selected: boolean; highlighted: boolean; onSelect: (lead: Lead) => void }) {
  return (
    <tr
      onClick={() => onSelect(lead)}
      className={cn(
        "cursor-pointer border-b border-white/[0.07] text-slate-200 transition hover:bg-signal/8",
        selected && "bg-signal/10",
        highlighted && "new-lead-row",
        lead.leadClass === "A" && "shadow-[inset_3px_0_0_rgba(45,212,191,0.85)]",
        lead.leadClass === "F" && "shadow-[inset_3px_0_0_rgba(244,63,94,0.85)]",
      )}
    >
      <td className="px-3 py-3 font-mono text-xs text-signal-bright">{lead.id}</td>
      <td className="px-3 py-3">{sourceLabels[lead.source]}</td>
      <td className="px-3 py-3 font-mono text-xs">{lead.telegram || lead.phone || "—"}</td>
      <td className="px-3 py-3">{entityLabels[lead.entityType]}</td>
      <td className="max-w-44 truncate px-3 py-3">{lead.businessType || "—"}</td>
      <td className="px-3 py-3">{lead.city || "—"}</td>
      <td className="px-3 py-3">{lead.monthlyTurnover || "—"}</td>
      <td className="max-w-52 truncate px-3 py-3">{lead.needs.map((need) => needLabels[need]).join(", ") || "—"}</td>
      <td className="px-3 py-3">{urgencyLabels[lead.urgency]}</td>
      <td className="px-3 py-3 font-semibold text-white">{lead.score}</td>
      <td className="px-3 py-3"><LeadClassBadge value={lead.leadClass} pulse={highlighted} /></td>
      <td className="px-3 py-3"><RiskFlags flags={lead.riskFlags.slice(0, 2)} /></td>
      <td className="px-3 py-3">{lead.status}</td>
      <td className="max-w-72 truncate px-3 py-3 text-slate-300">{lead.nextAction}</td>
    </tr>
  );
});

export const LeadTable = memo(function LeadTable({ leads, selectedId, newLeadId, onSelect }: { leads: Lead[]; selectedId?: string; newLeadId?: string; onSelect: (lead: Lead) => void }) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(leads.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visibleLeads = useMemo(() => leads.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [leads, safePage]);

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] md:backdrop-blur-md">
      <div className="flex flex-col gap-2 border-b border-white/10 p-3 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        <span>Показано {visibleLeads.length} из {leads.length}</span>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" className="border-white/10 bg-white/[0.055] text-white hover:bg-white/10" disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            Назад
          </Button>
          <span className="font-mono text-xs text-slate-400">{safePage}/{pageCount}</span>
          <Button type="button" size="sm" variant="outline" className="border-white/10 bg-white/[0.055] text-white hover:bg-white/10" disabled={safePage >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>
            Ещё
          </Button>
        </div>
      </div>
      <div className="max-h-[560px] overflow-auto">
        <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[var(--surface-2)]/95 text-xs uppercase tracking-[0.12em] text-slate-400 backdrop-blur">
            <tr>
              {heads.map((head) => (
                <th key={head} className="border-b border-white/10 px-3 py-3 font-medium">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleLeads.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                selected={selectedId === lead.id}
                highlighted={newLeadId === lead.id}
                onSelect={onSelect}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
