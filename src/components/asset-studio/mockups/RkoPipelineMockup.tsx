import { AssetFrame, GlassPanel, StatusPill, WindowDots } from "../AssetFrame";

const flow = ["Пост / реклама", "Сайт", "Telegram-бот", "CRM", "Менеджер"];
const statuses = ["Новый", "В работе", "Документы", "Готово"];

export function RkoPipelineMockup() {
  return (
    <AssetFrame kind="case" label="RKO lead pipeline">
      <div className="absolute inset-16">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h1 className="text-6xl font-semibold text-white">РКО-заявка без хаоса</h1>
            <p className="mt-4 text-2xl text-slate-300">Путь от клика до менеджера и статуса</p>
          </div>
          <StatusPill tone="green">Новая заявка отправлена менеджеру</StatusPill>
        </div>

        <GlassPanel className="mb-8 p-8">
          <div className="relative grid grid-cols-5 gap-5">
            <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
              <line x1="8%" y1="50%" x2="92%" y2="50%" stroke="#67e8f9" strokeOpacity=".44" strokeWidth="4" strokeDasharray="16 18" />
            </svg>
            {flow.map((item, index) => (
              <div key={item} className="relative z-10 grid min-h-32 place-items-center rounded-3xl border border-cyan-200/18 bg-[#071a33]/95 p-5 text-center text-2xl font-semibold text-white shadow-[0_0_40px_rgba(34,211,238,0.12)]">
                {item}
                <span className={`mt-4 size-4 rounded-full ${index === 2 ? "bg-cyan-200 shadow-[0_0_26px_rgba(103,232,249,0.9)]" : "bg-white/28"}`} />
              </div>
            ))}
          </div>
        </GlassPanel>

        <div className="grid grid-cols-[0.8fr_1.2fr] gap-8">
          <GlassPanel className="p-7">
            <div className="mb-6 flex items-center justify-between">
              <WindowDots />
              <span className="font-mono text-sm text-cyan-100">lead card</span>
            </div>
            <h2 className="text-5xl font-semibold text-white">Заявка РКО</h2>
            {[
              ["Форма", "ИП"],
              ["Интерес", "открыть счёт"],
              ["Статус", "документы"],
              ["Ответственный", "Менеджер"],
            ].map(([label, value]) => (
              <div key={label} className="mt-5 grid grid-cols-[170px_1fr] rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-2xl">
                <span className="text-slate-400">{label}</span>
                <span className="font-semibold text-white">{value}</span>
              </div>
            ))}
          </GlassPanel>

          <GlassPanel className="p-7">
            <div className="mb-6 flex items-center justify-between">
              <WindowDots />
              <span className="font-mono text-sm text-cyan-100">statuses</span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {statuses.map((status, index) => (
                <div key={status} className="rounded-3xl border border-white/10 bg-black/24 p-5">
                  <div className="mb-5 text-xl font-semibold text-white">{status}</div>
                  {Array.from({ length: index === 0 ? 3 : 2 }, (_, row) => (
                    <div key={row} className="mb-3 rounded-2xl bg-white/[0.07] p-4">
                      <div className="text-lg text-white">Лид #{184 + index + row}</div>
                      <div className="mt-1 text-sm text-slate-500">Тестовый оффер</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </AssetFrame>
  );
}
