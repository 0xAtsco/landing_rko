import { AssetFrame, GlassPanel, StatusPill, WindowDots } from "../AssetFrame";

const columns = ["Новые", "В работе", "Дожим", "Готово"];
const actions = ["Предложить ответ", "Напомнить завтра", "Запросить документы", "Обновить статус"];

export function SalesAgentsMockup() {
  return (
    <AssetFrame kind="case" label="Sales agents">
      <div className="absolute inset-16">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="text-6xl font-semibold text-white">AI-помощники для менеджеров</h1>
            <p className="mt-4 text-2xl text-slate-300">CRM, следующий шаг и подсказки по лидам</p>
          </div>
          <StatusPill>agent nodes online</StatusPill>
        </div>
        <div className="grid grid-cols-[1.35fr_0.65fr] gap-8">
          <GlassPanel className="p-7">
            <div className="mb-6 flex items-center justify-between">
              <WindowDots />
              <span className="font-mono text-sm text-cyan-100">crm.kanban</span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {columns.map((column, colIndex) => (
                <div key={column} className="rounded-3xl border border-white/10 bg-black/22 p-4">
                  <div className="mb-4 text-xl font-semibold text-white">{column}</div>
                  {[0, 1, 2].map((row) => (
                    <div key={row} className="relative mb-4 rounded-2xl border border-white/8 bg-white/[0.06] p-4">
                      <span className="absolute right-4 top-4 size-3 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(103,232,249,0.8)]" />
                      <div className="text-lg font-semibold text-white">Лид #{180 + colIndex * 4 + row}</div>
                      <div className="mt-2 text-sm text-slate-500">источник: Telegram</div>
                      <div className="mt-4 h-2 rounded bg-cyan-200/30" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel className="p-7">
            <div className="mb-6 flex items-center justify-between">
              <WindowDots />
              <span className="font-mono text-sm text-violet-100">AI assistant</span>
            </div>
            <div className="mb-7 grid place-items-center rounded-full border border-cyan-200/25 bg-cyan-200/10 p-10 shadow-[0_0_90px_rgba(34,211,238,0.2)]">
              <div className="grid size-28 place-items-center rounded-full bg-cyan-200 text-4xl font-semibold text-slate-950 shadow-[0_0_70px_rgba(103,232,249,0.95)]">AI</div>
            </div>
            <div className="space-y-4">
              {actions.map((action, index) => (
                <div key={action} className="grid grid-cols-[42px_1fr] items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                  <span className="grid size-10 place-items-center rounded-full bg-violet-300/16 text-violet-100">{index + 1}</span>
                  <span className="text-xl font-semibold text-white">{action}</span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </AssetFrame>
  );
}
