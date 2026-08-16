import {
  Bot,
  LayoutDashboard,
  MessageCircle,
  PanelsTopLeft,
  Sparkles,
  Users,
} from "lucide-react";

const flowCards = [
  { title: "Запрос", meta: "чат / бизнес", icon: MessageCircle },
  { title: "Лендинг", meta: "оффер + форма", icon: PanelsTopLeft },
  { title: "Telegram-бот", meta: "вопросы + заявка", icon: Bot },
  { title: "AI-выжимка", meta: "суть лида", icon: Sparkles },
  { title: "CRM", meta: "карточка создана", icon: LayoutDashboard },
  { title: "Лид", meta: "следующий шаг", icon: Users },
] as const;

export function TrafficSystemHeroAnimation() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-signal/24 bg-[var(--surface-1)]/92 p-4 shadow-[0_34px_120px_rgba(0,0,0,0.54),0_0_80px_rgb(var(--signal-rgb)/0.12),inset_0_1px_0_rgb(var(--signal-rgb)/0.12)] backdrop-blur-md sm:p-5">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_58%_20%,rgb(var(--signal-rgb)/0.2),transparent_18rem),linear-gradient(180deg,rgb(var(--signal-rgb)/0.06),transparent_50%)]"
      />
      <div aria-hidden="true" className="tiffany-dot-field absolute inset-0 opacity-42" />

      <div className="relative z-10 rounded-lg border border-signal/16 bg-black/24 p-3 sm:p-4">
        <div className="mb-4 flex items-center gap-2 border-b border-signal/14 pb-3">
          <span className="size-2.5 rounded-full bg-signal shadow-[0_0_18px_rgb(var(--signal-rgb)/0.82)]" />
          <span className="font-mono text-xs uppercase tracking-[0.22em] text-signal-bright">Vibe Lead Flow</span>
        </div>

        <div className="relative">
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 z-0 hidden size-full text-signal/55 sm:block"
          >
            <path
              d="M 25 16.7 H 75 C 82 16.7 82 50 75 50 H 25 C 18 50 18 83.3 25 83.3 H 75"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.24"
              strokeWidth="0.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              className="traffic-flow"
              d="M 25 16.7 H 75 C 82 16.7 82 50 75 50 H 25 C 18 50 18 83.3 25 83.3 H 75"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.35"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div className="relative z-10 grid gap-3 sm:grid-cols-2">
            {flowCards.map((card, index) => {
              const Icon = card.icon;

              return (
                <article
                  key={card.title}
                  className="traffic-node min-h-[136px] rounded-lg border border-signal/18 bg-black/34 p-4 shadow-[0_16px_42px_rgba(0,0,0,0.2)]"
                  style={{ animationDelay: `${index * 95}ms` }}
                >
                  <div className="mb-4">
                    <span className="grid size-9 place-items-center rounded-md border border-signal/22 bg-signal/10 text-signal-bright">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                  </div>
                  <h3 className="text-base font-semibold leading-tight text-[#f4ffff]">{card.title}</h3>
                  <p className="mt-1 text-sm leading-5 text-[#93a3a3]">{card.meta}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
