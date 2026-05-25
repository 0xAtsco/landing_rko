import { AssetFrame, GlassPanel, StatusPill, WindowDots } from "../AssetFrame";

export function ShortsFactoryMockup() {
  return (
    <AssetFrame kind="case" label="Shorts / Reels factory">
      <div className="absolute inset-16">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="text-6xl font-semibold text-white">Идея → хук → сценарий → публикация → анализ</h1>
            <p className="mt-4 text-2xl text-slate-300">Контент-поток без реальных людей и стоковых кадров</p>
          </div>
          <StatusPill tone="violet">content queue</StatusPill>
        </div>
        <div className="grid grid-cols-[0.9fr_1.1fr] gap-8">
          <GlassPanel className="p-7">
            <div className="mb-6 flex items-center justify-between">
              <WindowDots />
              <span className="font-mono text-sm text-cyan-100">vertical ideas</span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {["Hook", "Offer", "Proof", "CTA"].map((label, index) => (
                <div key={label} className="relative h-[500px] overflow-hidden rounded-[34px] border border-white/12 bg-gradient-to-b from-cyan-300/18 via-[#071a33] to-violet-300/18 p-5">
                  <div className="absolute inset-x-6 top-6 h-40 rounded-3xl bg-[radial-gradient(circle,rgba(103,232,249,0.46),rgba(124,58,237,0.18),transparent_70%)]" />
                  <div className="relative mt-52 rounded-2xl bg-black/28 p-4">
                    <div className="text-2xl font-semibold text-white">{label}</div>
                    <div className="mt-3 h-2 rounded bg-white/20" />
                    <div className="mt-2 h-2 w-2/3 rounded bg-cyan-200/35" />
                  </div>
                  <div className="absolute bottom-5 left-5 right-5 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-center text-sm text-slate-300">
                    ролик #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>

          <div className="grid gap-8">
            <GlassPanel className="p-7">
              <div className="mb-6 flex items-center justify-between">
                <WindowDots />
                <span className="font-mono text-sm text-cyan-100">content table</span>
              </div>
              <div className="grid grid-cols-[1fr_1fr_1.2fr_150px] gap-3 rounded-2xl bg-white/[0.06] p-4 text-sm uppercase tracking-[0.16em] text-slate-400">
                <span>Идея</span><span>Хук</span><span>Сценарий</span><span>Статус</span>
              </div>
              {["Тестовый оффер", "Контент-план", "Заявка РКО"].map((row, index) => (
                <div key={row} className="mt-3 grid grid-cols-[1fr_1fr_1.2fr_150px] gap-3 rounded-2xl border border-white/8 bg-black/22 p-4 text-lg text-white">
                  <span>{row}</span><span>первые 3 сек</span><span>черновик #{index + 1}</span><StatusPill tone={index === 0 ? "cyan" : "slate"}>{index === 0 ? "готово" : "draft"}</StatusPill>
                </div>
              ))}
            </GlassPanel>
            <GlassPanel className="p-7">
              <div className="mb-6 flex items-center justify-between">
                <WindowDots />
                <span className="font-mono text-sm text-cyan-100">scheduler</span>
              </div>
              <div className="grid grid-cols-3 gap-5">
                {["Пн", "Ср", "Пт"].map((day) => (
                  <div key={day} className="rounded-3xl border border-cyan-200/18 bg-cyan-200/10 p-8 text-center">
                    <div className="text-5xl font-semibold text-white">{day}</div>
                    <div className="mt-4 text-lg text-cyan-100">публикация</div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>
    </AssetFrame>
  );
}
