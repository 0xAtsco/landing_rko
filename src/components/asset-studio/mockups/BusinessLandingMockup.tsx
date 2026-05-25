import { AssetFrame, GlassPanel, StatusPill, WindowDots } from "../AssetFrame";

export function BusinessLandingMockup() {
  return (
    <AssetFrame kind="case" label="Business landing">
      <div className="absolute inset-16">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="text-6xl font-semibold text-white">Сайт-визитка для доверия</h1>
            <p className="mt-4 text-2xl text-slate-300">Ссылка, которую можно отправить клиенту или партнёру</p>
          </div>
          <StatusPill tone="green">responsive preview</StatusPill>
        </div>
        <div className="grid grid-cols-[1.25fr_0.75fr] gap-8">
          <GlassPanel className="p-7">
            <div className="mb-6 flex items-center justify-between">
              <WindowDots />
              <span className="font-mono text-sm text-cyan-100">landing.preview</span>
            </div>
            <div className="rounded-[32px] border border-white/10 bg-black/24 p-7">
              <div className="mb-8 flex items-center justify-between">
                <div className="text-3xl font-semibold text-white">Тестовый оффер</div>
                <StatusPill>заявка</StatusPill>
              </div>
              <div className="grid grid-cols-[1fr_0.8fr] gap-7">
                <div>
                  <div className="text-6xl font-semibold leading-[0.98] text-white">Понятная страница для клиента</div>
                  <div className="mt-6 h-4 w-4/5 rounded bg-white/16" />
                  <div className="mt-3 h-4 w-2/3 rounded bg-cyan-200/30" />
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    {["Услуги", "Контакты", "Форма заявки", "Почему нам доверяют"].map((block) => (
                      <div key={block} className="rounded-2xl border border-white/10 bg-white/[0.055] p-5 text-xl text-white">{block}</div>
                    ))}
                  </div>
                </div>
                <div className="rounded-3xl border border-cyan-200/16 bg-cyan-200/[0.06] p-6">
                  <div className="mb-5 text-2xl font-semibold text-white">Форма заявки</div>
                  {["Имя", "Контакт", "Задача"].map((field) => (
                    <div key={field} className="mb-4 rounded-2xl bg-black/28 px-5 py-4 text-lg text-slate-400">{field}</div>
                  ))}
                  <div className="mt-6 rounded-2xl bg-cyan-300 px-5 py-4 text-center text-xl font-semibold text-slate-950">Отправить</div>
                </div>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-7">
            <div className="mx-auto h-[690px] w-[330px] rounded-[48px] border border-cyan-200/22 bg-[#051326] p-5 shadow-[0_0_80px_rgba(34,211,238,0.18)]">
              <div className="mx-auto mb-6 h-2 w-24 rounded-full bg-white/18" />
              <div className="rounded-[36px] border border-white/10 bg-black/22 p-5">
                <div className="mb-5 h-28 rounded-3xl bg-[radial-gradient(circle,rgba(103,232,249,0.36),rgba(124,58,237,0.16),transparent_70%)]" />
                <div className="text-3xl font-semibold text-white">Тестовый оффер</div>
                <div className="mt-4 h-3 rounded bg-white/18" />
                <div className="mt-2 h-3 w-2/3 rounded bg-cyan-200/35" />
                {["Услуги", "Контакты", "Форма"].map((item) => (
                  <div key={item} className="mt-4 rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-lg text-white">{item}</div>
                ))}
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </AssetFrame>
  );
}
