import type { PreviewKind } from "@/lib/content";
import { cn } from "@/lib/utils";

const botLines = ["Привет. Какая задача?", "Нужен РКО + заявка", "Принял. Передал менеджеру."] as const;
const pipelineLabels = ["лид", "статус", "шаг"] as const;
const pipelineStatuses = ["Новый", "В работе", "Документы", "Готово"] as const;

export function BuildPreview({ type }: { type: PreviewKind }) {
  if (type === "bot") return <BotPreview />;
  if (type === "crm" || type === "rko") return <PipelinePreview />;
  return <MatrixPreview />;
}

export function CasePreview({ index, code }: { index: number; code: string }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-white/8 bg-white/[0.035] p-2 font-mono text-[10px] text-slate-400">
        <span>{code}</span>
        <span className="text-cyan-200">active</span>
      </div>
      {Array.from({ length: 4 }, (_, row) => (
        <div key={row} className="flex items-center gap-2">
          <span
            className={cn(
              "size-7 rounded-lg",
              row === index % 4 ? "bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.45)]" : "bg-white/10",
            )}
          />
          <span className="h-2 flex-1 rounded bg-white/12" />
          <span className="h-2 w-10 rounded bg-violet-300/25" />
        </div>
      ))}
      <div className="grid grid-cols-5 gap-1.5 pt-2" aria-hidden="true">
        {Array.from({ length: 15 }, (_, cellIndex) => (
          <span
            key={cellIndex}
            className={cn("case-cell h-8 rounded", cellIndex % (index + 2) === 0 ? "bg-cyan-300/55" : "bg-white/8")}
            style={{ animationDelay: `${cellIndex * 0.05}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function BotPreview() {
  return (
    <div className="space-y-2 rounded-lg border border-white/10 bg-black/28 p-3 shadow-[inset_0_0_28px_rgba(34,211,238,0.04)]">
      {botLines.map((line, index) => (
        <div
          key={line}
          className={cn(
            "chat-pop w-fit max-w-[88%] rounded-lg px-3 py-2 text-xs",
            index === 1 ? "ml-auto bg-cyan-300 text-slate-950" : "bg-white/10 text-slate-200",
          )}
          style={{ animationDelay: `${index * 0.18}s` }}
        >
          {line}
        </div>
      ))}
    </div>
  );
}

function PipelinePreview() {
  return (
    <div className="rounded-lg border border-white/10 bg-black/28 p-3">
      <div className="mb-3 grid grid-cols-3 gap-1.5">
        {pipelineLabels.map((item, index) => (
          <span
            key={item}
            className={cn(
              "rounded px-2 py-1 text-center font-mono text-[9px] uppercase tracking-[0.12em]",
              index === 1 ? "bg-cyan-300/80 text-slate-950" : "bg-white/8 text-slate-300",
            )}
          >
            {item}
          </span>
        ))}
      </div>
      {pipelineStatuses.map((status, index) => (
        <div
          key={status}
          className="pipeline-row mb-2 grid grid-cols-[1fr_54px] gap-2 text-xs last:mb-0"
          style={{ animationDelay: `${index * 0.12}s` }}
        >
          <span className="rounded bg-white/8 px-2 py-1.5 text-slate-200">{status}</span>
          <span className={cn("rounded px-2 py-1.5 text-center", index === 0 ? "bg-cyan-300/80 text-slate-950" : "bg-violet-300/16 text-violet-100")}>
            {index + 2}
          </span>
        </div>
      ))}
    </div>
  );
}

function MatrixPreview() {
  return (
    <div className="rounded-lg border border-white/10 bg-black/28 p-3">
      <div className="mb-3 grid h-20 grid-cols-5 gap-1.5 rounded-lg bg-gradient-to-br from-cyan-300/12 via-blue-400/8 to-violet-400/16 p-2" aria-hidden="true">
        {Array.from({ length: 15 }, (_, index) => (
          <span
            key={index}
            className={cn("matrix-cell rounded-sm", index % 4 === 0 ? "bg-cyan-300/80" : index % 3 === 0 ? "bg-violet-300/45" : "bg-white/10")}
            style={{ animationDelay: `${index * 0.04}s` }}
          />
        ))}
      </div>
      <div className="space-y-2" aria-hidden="true">
        <div className="h-2 rounded bg-white/18" />
        <div className="h-2 w-2/3 rounded bg-cyan-200/35" />
      </div>
    </div>
  );
}
