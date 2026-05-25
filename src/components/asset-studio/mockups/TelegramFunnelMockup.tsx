import { AssetFrame, GlassPanel, StatusPill, WindowDots } from "../AssetFrame";

export function TelegramFunnelMockup() {
  return (
    <AssetFrame kind="case" label="Telegram funnel">
      <div className="absolute inset-16">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="text-6xl font-semibold text-white">Канал → прогрев → бот → заявка</h1>
            <p className="mt-4 text-2xl text-slate-300">Демо-связка для Telegram-трафика и заявок</p>
          </div>
          <StatusPill>demo mockup</StatusPill>
        </div>
        <div className="grid grid-cols-[1fr_1.05fr_1.1fr] gap-7">
          <GlassPanel className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <WindowDots />
              <span className="font-mono text-sm text-cyan-100">@channel</span>
            </div>
            {["Пост прогрева", "Разбор оффера", "Переход в заявку"].map((post, index) => (
              <div key={post} className="mb-5 rounded-3xl border border-white/10 bg-white/[0.055] p-5">
                <div className="mb-3 flex items-center gap-3">
                  <span className="size-11 rounded-full bg-cyan-200/20 shadow-[0_0_30px_rgba(34,211,238,0.24)]" />
                  <div>
                    <div className="text-xl font-semibold text-white">{post}</div>
                    <div className="text-sm text-slate-500">Тестовый оффер · день {index + 1}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 rounded bg-white/16" />
                  <div className="h-3 w-5/6 rounded bg-white/10" />
                  <div className="h-3 w-2/3 rounded bg-cyan-200/30" />
                </div>
              </div>
            ))}
          </GlassPanel>

          <GlassPanel className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <WindowDots />
              <span className="font-mono text-sm text-cyan-100">bot active</span>
            </div>
            {[
              ["bot", "Какая задача?"],
              ["user", "Хочу собрать воронку"],
              ["bot", "Принял. Передал заявку."],
            ].map(([side, text]) => (
              <div key={text} className={`mb-5 max-w-[82%] rounded-3xl px-6 py-4 text-2xl ${side === "user" ? "ml-auto bg-cyan-300 text-slate-950" : "bg-white/[0.08] text-white"}`}>
                {text}
              </div>
            ))}
            <div className="mt-10 rounded-3xl border border-violet-200/20 bg-violet-300/10 p-5">
              <div className="text-sm uppercase tracking-[0.18em] text-violet-100">payload</div>
              <div className="mt-3 font-mono text-xl text-slate-200">lead_id: #184 · source: channel</div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <WindowDots />
              <span className="font-mono text-sm text-cyan-100">mini CRM</span>
            </div>
            {[
              ["Лид #184", "источник: канал", "новый"],
              ["Лид #185", "источник: пост", "в работе"],
              ["Лид #186", "источник: бот", "следующий шаг"],
            ].map(([lead, source, status]) => (
              <div key={lead} className="mb-4 grid grid-cols-[1fr_auto] items-center gap-4 rounded-2xl border border-white/10 bg-black/24 p-5">
                <div>
                  <div className="text-2xl font-semibold text-white">{lead}</div>
                  <div className="mt-1 text-lg text-slate-400">{source}</div>
                </div>
                <StatusPill tone={status === "новый" ? "cyan" : "violet"}>{status}</StatusPill>
              </div>
            ))}
          </GlassPanel>
        </div>
      </div>
    </AssetFrame>
  );
}
