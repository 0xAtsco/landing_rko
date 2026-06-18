import type { PreviewKind } from "@/lib/content";
import { cn } from "@/lib/utils";

const botLines = ["Привет. Какая задача?", "Нужен РКО + заявка", "Принял. Передал менеджеру."] as const;
const pipelineStatuses = ["Новый", "В работе", "Документы", "Готово"] as const;

export function BuildPreview({ type }: { type: PreviewKind }) {
  if (type === "bot") return <BotPreview />;
  if (type === "crm" || type === "rko") return <PipelinePreview />;
  return <MatrixPreview />;
}

export function CasePreview({ index }: { index: number; code: string }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_42px] gap-3 rounded-md border border-signal/12 bg-[var(--surface-1)]/72 p-2" aria-hidden="true">
        <span className="h-2 rounded bg-signal/12" />
        <span className="h-2 rounded bg-signal/35" />
      </div>
      {Array.from({ length: 4 }, (_, row) => (
        <div key={row} className="flex items-center gap-2">
          <span
            className={cn(
              "size-7 rounded-lg",
              row === index % 4 ? "bg-signal-strong shadow-[0_0_20px_rgb(var(--signal-rgb)/0.30)]" : "bg-signal/10",
            )}
          />
          <span className="h-2 flex-1 rounded bg-signal/12" />
          <span className="h-2 w-10 rounded bg-signal-strong/25" />
        </div>
      ))}
      <div className="grid grid-cols-5 gap-1.5 pt-2" aria-hidden="true">
        {Array.from({ length: 15 }, (_, cellIndex) => (
          <span
            key={cellIndex}
            className={cn("case-cell h-8 rounded", cellIndex % (index + 2) === 0 ? "bg-signal-strong/55" : "bg-signal/10")}
            style={{ animationDelay: `${cellIndex * 0.05}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function BotPreview() {
  return (
    <div className="space-y-2 rounded-lg border border-signal/14 bg-black/28 p-3 shadow-[inset_0_0_28px_rgb(var(--signal-rgb)/0.05)]">
      {botLines.map((line, index) => (
        <div
          key={line}
          className={cn(
            "chat-pop w-fit max-w-[88%] rounded-lg px-3 py-2 text-xs",
            index === 1 ? "ml-auto bg-signal-strong text-[var(--surface-base)]" : "border border-signal/10 bg-[var(--surface-1)]/72 text-[#d9eeee]",
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
    <div className="rounded-lg border border-signal/14 bg-black/28 p-3">
      {pipelineStatuses.map((status, index) => (
        <div
          key={status}
          className="pipeline-row mb-2 grid grid-cols-[1fr_54px] gap-2 last:mb-0"
          style={{ animationDelay: `${index * 0.12}s` }}
          aria-hidden="true"
        >
          <span className="h-7 rounded bg-signal/10" />
          <span className={cn("h-7 rounded", index === 0 ? "bg-signal-strong/80" : "bg-signal-strong/16")} />
        </div>
      ))}
    </div>
  );
}

function MatrixPreview() {
  return (
    <div className="rounded-lg border border-signal/14 bg-black/28 p-3">
      <div className="mb-3 grid h-20 grid-cols-5 gap-1.5 rounded-lg bg-gradient-to-br from-signal-strong/12 via-signal/8 to-signal-strong/16 p-2" aria-hidden="true">
        {Array.from({ length: 15 }, (_, index) => (
          <span
            key={index}
            className={cn("matrix-cell rounded-sm", index % 4 === 0 ? "bg-signal-strong/80" : index % 3 === 0 ? "bg-signal-strong/45" : "bg-signal/12")}
            style={{ animationDelay: `${index * 0.04}s` }}
          />
        ))}
      </div>
      <div className="space-y-2" aria-hidden="true">
        <div className="h-2 rounded bg-signal/16" />
        <div className="h-2 w-2/3 rounded bg-signal/35" />
      </div>
    </div>
  );
}
