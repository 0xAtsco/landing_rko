import { AssetFrame, GlassPanel, StatusPill, WindowDots } from "../AssetFrame";

const rows = [
  ["Лид #184", "Telegram", "Новый", "Менеджер", "созвон"],
  ["Лид #185", "Пост", "В работе", "Менеджер", "документы"],
  ["Лид #186", "Сайт", "Без ответа", "Менеджер", "напомнить"],
  ["Лид #187", "Реклама", "Документы", "Менеджер", "проверить"],
  ["Лид #188", "Бот", "Готово", "Менеджер", "закрыть"],
];

export function CustomCrmMockup() {
  return (
    <AssetFrame kind="case" label="Custom mini CRM">
      <div className="absolute inset-16">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="text-6xl font-semibold text-white">Своя мини-CRM под процесс</h1>
            <p className="mt-4 text-2xl text-slate-300">Один экран для заявок, статусов и следующего шага</p>
          </div>
          <StatusPill>dashboard live</StatusPill>
        </div>
        <div className="grid grid-cols-[1.35fr_0.65fr] gap-8">
          <GlassPanel className="p-7">
            <div className="mb-6 flex items-center justify-between">
              <WindowDots />
              <span className="font-mono text-sm text-cyan-100">crm.core</span>
            </div>
            <div className="mb-6 flex gap-4">
              {["Все", "Новые", "Без ответа", "Документы"].map((filter, index) => (
                <StatusPill key={filter} tone={index === 1 ? "cyan" : "slate"}>{filter}</StatusPill>
              ))}
            </div>
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1.2fr] gap-3 rounded-2xl bg-white/[0.06] p-4 text-sm uppercase tracking-[0.16em] text-slate-400">
              <span>Лид</span><span>Источник</span><span>Статус</span><span>Ответственный</span><span>Следующий шаг</span>
            </div>
            {rows.map((row) => (
              <div key={row[0]} className="mt-3 grid grid-cols-[1fr_1fr_1fr_1fr_1.2fr] gap-3 rounded-2xl border border-white/8 bg-black/22 p-4 text-lg text-white">
                {row.map((cell, index) => (
                  <span key={cell} className={index === 2 ? "text-cyan-100" : ""}>{cell}</span>
                ))}
              </div>
            ))}
          </GlassPanel>
          <GlassPanel className="p-7">
            <div className="mb-6 flex items-center justify-between">
              <WindowDots />
              <span className="font-mono text-sm text-violet-100">stats</span>
            </div>
            {[
              ["12 новых", "за сегодня"],
              ["7 в работе", "у менеджера"],
              ["3 ждут ответа", "нужен шаг"],
            ].map(([value, label], index) => (
              <div key={value} className="mb-6 rounded-3xl border border-cyan-200/16 bg-cyan-200/[0.07] p-7">
                <div className="text-5xl font-semibold text-white">{value}</div>
                <div className="mt-3 text-xl text-slate-400">{label}</div>
                <div className={`mt-6 h-3 rounded-full ${index === 0 ? "w-4/5 bg-cyan-300" : index === 1 ? "w-3/5 bg-violet-300" : "w-2/5 bg-white/35"}`} />
              </div>
            ))}
          </GlassPanel>
        </div>
      </div>
    </AssetFrame>
  );
}
