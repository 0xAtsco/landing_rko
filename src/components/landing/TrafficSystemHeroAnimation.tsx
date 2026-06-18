import {
  Bot,
  CheckCircle2,
  LayoutDashboard,
  MessageCircle,
  PanelsTopLeft,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";

const flowCards = [
  { title: "Запрос", meta: "чат / бизнес", icon: MessageCircle },
  { title: "Лендинг", meta: "оффер + форма", icon: PanelsTopLeft },
  { title: "Telegram-бот", meta: "вопросы + заявка", icon: Bot },
  { title: "AI-выжимка", meta: "суть лида", icon: Sparkles },
  { title: "CRM", meta: "карточка создана", icon: LayoutDashboard },
  { title: "Лид", meta: "следующий шаг", icon: Users },
] as const;

const metrics = [
  { label: "подписчики", value: 5540 },
  { label: "заявки", value: 23 },
  { label: "лиды", value: 8 },
  { label: "CRM CARD", value: 23 },
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

        <div className="relative overflow-hidden rounded-lg border border-signal/16 bg-[var(--surface-2)]/76 p-4 sm:p-5">
          <svg
            className="pointer-events-none absolute left-5 right-5 top-5 z-0 hidden h-[29rem] w-[calc(100%-2.5rem)] text-signal/60 md:block"
            viewBox="0 0 470 464"
            preserveAspectRatio="none"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M38 38 C118 38 164 38 204 38 C284 38 330 38 370 38 C438 38 438 164 370 164 C290 164 244 164 204 164 C124 164 78 164 38 164 C20 230 38 346 58 424 C152 424 260 424 412 424"
              stroke="currentColor"
              strokeOpacity="0.28"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="7 11"
            />
            <path
              className="signal-flow"
              d="M38 38 C118 38 164 38 204 38 C284 38 330 38 370 38 C438 38 438 164 370 164 C290 164 244 164 204 164 C124 164 78 164 38 164 C20 230 38 346 58 424 C152 424 260 424 412 424"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="7 11"
            />
            {[
              [38, 38],
              [204, 38],
              [370, 38],
              [370, 164],
              [204, 164],
              [38, 164],
              [58, 424],
              [181, 424],
              [305, 424],
              [412, 424],
            ].map(([x, y], index) => (
              <circle key={`${x}-${y}-${index}`} cx={x} cy={y} r="2.8" fill="currentColor" opacity="0.5" />
            ))}
          </svg>

          <div className="relative z-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {flowCards.map((card, index) => {
              const Icon = card.icon;

              return (
                <article
                  key={card.title}
                  className="traffic-node min-h-[104px] rounded-lg border border-signal/18 bg-black/34 p-3 shadow-[0_16px_42px_rgba(0,0,0,0.26),inset_0_0_28px_rgb(var(--signal-rgb)/0.035)]"
                  style={{ animationDelay: `${index * 95}ms, ${900 + index * 95}ms` }}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="grid size-9 place-items-center rounded-md border border-signal/22 bg-signal/10 text-signal-bright">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-[10px] text-signal/70">0{index + 1}</span>
                  </div>
                  <h3 className="text-base font-semibold leading-tight text-[#f4ffff]">{card.title}</h3>
                  <p className="mt-1 text-[11px] leading-4 text-[#93a3a3]">{card.meta}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-32 grid gap-2 sm:mt-36 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, index) => (
              <div
                key={metric.label}
                className="traffic-card-pulse rounded-lg border border-signal/18 bg-black/30 p-3 shadow-[inset_0_1px_0_rgb(var(--signal-rgb)/0.08)]"
                style={{ animationDelay: `${index * 140}ms` }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#93a3a3]">{metric.label}</p>
                <strong className="mt-2 block text-3xl font-semibold leading-none text-[#f4ffff] tabular-nums">
                  <AnimatedNumber value={metric.value} durationMs={4700 + index * 320} />
                </strong>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-lg border border-signal/24 bg-signal/10 p-3">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-signal text-[var(--surface-base)]">
                <CheckCircle2 className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#f4ffff]">Запрос не теряется</p>
                <p className="mt-1 text-xs leading-5 text-[#93a3a3]">
                  AI собирает контекст, режет хаос и передает менеджеру понятный следующий шаг.
                </p>
              </div>
              <Send className="ml-auto hidden size-4 shrink-0 text-signal-bright sm:block" aria-hidden="true" />
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-dashed border-signal/20 bg-black/24 px-3 py-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal/80">
              Request → Bot → CRM → Lead
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
