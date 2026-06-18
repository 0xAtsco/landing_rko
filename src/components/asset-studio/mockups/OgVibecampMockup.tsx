import { AssetFrame, GlassPanel, StatusPill } from "../AssetFrame";

export function OgVibecampMockup() {
  return (
    <AssetFrame kind="og">
      <div className="absolute inset-14 grid grid-cols-[1.08fr_0.92fr] gap-10">
        <div className="flex flex-col justify-center">
          <div className="mb-7 w-fit rounded-2xl border border-cyan-200/22 bg-cyan-200/10 px-6 py-3 text-3xl font-semibold text-cyan-100">
            VibeCamp
          </div>
          <h1 className="text-[64px] font-semibold leading-[0.96] text-white">
            AI-воронка под РКО, Telegram и заявки за 14 дней
          </h1>
          <p className="mt-8 text-3xl text-slate-300">Сайт · бот · CRM · контент · лиды</p>
        </div>

        <GlassPanel className="p-7">
          <div className="mb-8 grid grid-cols-5 items-center gap-3">
            {["Post", "Landing", "Bot", "CRM", "Manager"].map((node, index) => (
              <div key={node} className="flex items-center gap-3">
                <div className="grid min-h-16 flex-1 place-items-center rounded-2xl border border-cyan-200/18 bg-cyan-200/10 text-sm font-semibold text-white">
                  {node}
                </div>
                {index < 4 ? <span className="text-2xl text-cyan-200">→</span> : null}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {["lead queue", "bot active", "crm synced", "content draft"].map((item, index) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-black/24 p-5">
                <div className="text-xl font-semibold text-white">{item}</div>
                <div className="mt-4 h-2 rounded bg-white/16" />
                <div className={`mt-3 h-2 rounded ${index % 2 === 0 ? "w-4/5 bg-cyan-200/45" : "w-3/5 bg-violet-300/45"}`} />
              </div>
            ))}
          </div>
          <div className="mt-8 flex gap-4">
            <StatusPill>14 days</StatusPill>
            <StatusPill tone="violet">AI Build Sprint</StatusPill>
          </div>
        </GlassPanel>
      </div>
    </AssetFrame>
  );
}
