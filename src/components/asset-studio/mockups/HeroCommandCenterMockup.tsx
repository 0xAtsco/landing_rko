import { AssetFrame, GlassPanel, StatusPill, WindowDots } from "../AssetFrame";

const nodes = [
  { label: "Post / Traffic", x: "19%", y: "42%" },
  { label: "Landing", x: "30%", y: "72%" },
  { label: "Telegram Bot", x: "70%", y: "38%" },
  { label: "CRM", x: "78%", y: "70%" },
  { label: "Manager", x: "50%", y: "84%" },
];

const cards = [
  ["lead queue live", "12 new"],
  ["bot active", "98%"],
  ["crm synced", "live"],
  ["content draft", "ready"],
];

export function HeroCommandCenterMockup() {
  return (
    <AssetFrame kind="hero" label="VibeCamp command center">
      <div className="absolute inset-20">
        <div className="absolute inset-x-0 top-8 flex items-start justify-between gap-10">
          <div>
            <div className="mb-5 flex gap-3">
              <StatusPill>AI Build Sprint</StatusPill>
              <StatusPill tone="violet">14 days</StatusPill>
              <StatusPill tone="green">workflow live</StatusPill>
            </div>
            <GlassPanel className="w-[520px] p-6">
              <div className="font-mono text-sm uppercase tracking-[0.2em] text-cyan-100/80">
                Telegram traffic command center
              </div>
              <div className="mt-4 text-4xl font-semibold leading-tight text-white">
                Пост / реклама → лендинг → бот → CRM → менеджер
              </div>
            </GlassPanel>
          </div>
          <GlassPanel className="w-[470px] p-7">
            <div className="mb-6 flex items-center justify-between">
              <WindowDots />
              <span className="font-mono text-sm text-cyan-100">traffic.ops/live</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {cards.map(([title, value]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-black/24 p-4">
                  <div className="text-sm text-slate-400">{title}</div>
                  <div className="mt-2 text-3xl font-semibold text-cyan-100">{value}</div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>

        <div className="absolute inset-x-0 bottom-8 h-[700px]">
          <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
            <defs>
              <linearGradient id="heroAssetLine" x1="0" x2="1">
                <stop offset="0%" stopColor="#67e8f9" stopOpacity=".16" />
                <stop offset="50%" stopColor="#a78bfa" stopOpacity=".86" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity=".16" />
              </linearGradient>
            </defs>
            {nodes.map((node) => (
              <line key={node.label} x1="50%" y1="48%" x2={node.x} y2={node.y} stroke="url(#heroAssetLine)" strokeWidth="3" strokeDasharray="16 18" />
            ))}
          </svg>

          <div className="absolute left-1/2 top-[52%] grid size-[310px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-cyan-200/35 bg-[#06172f]/84 shadow-[0_0_130px_rgba(34,211,238,0.52)]">
            <div className="absolute inset-5 rounded-full border border-violet-300/25" />
            <div className="absolute inset-16 rounded-full border border-cyan-200/30" />
            <div className="absolute size-[430px] rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(103,232,249,0.34),transparent_26%)]" />
            <div className="relative grid size-28 place-items-center rounded-full bg-cyan-200 shadow-[0_0_70px_rgba(103,232,249,0.96)]">
              <span className="size-4 rounded-full bg-slate-950/80" />
            </div>
          </div>

          {nodes.map((node) => (
            <div key={node.label} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-cyan-200/20 bg-[#071a33]/90 px-7 py-5 text-center text-2xl font-semibold text-white shadow-[0_22px_70px_rgba(0,0,0,0.35)]" style={{ left: node.x, top: node.y }}>
              {node.label}
            </div>
          ))}

          <div className="absolute bottom-0 left-1/2 w-[780px] -translate-x-1/2 rounded-2xl border border-cyan-200/22 bg-black/54 p-5 font-mono text-3xl text-cyan-100 shadow-[0_0_44px_rgba(34,211,238,0.2)]">
            <span className="text-violet-300">vibecamp</span>
            <span className="text-slate-500"> $ </span>
            /build rko-funnel --14-days
          </div>
        </div>
      </div>
    </AssetFrame>
  );
}
