"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  Activity,
  BadgeCheck,
  BarChart3,
  Bot,
  Database,
  FileText,
  Link2,
  MessageSquareText,
  Radar,
  ShieldCheck,
  SlidersHorizontal,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { demoNotice, vcCommandTabs } from "./vc-command-content";
import type { VcCommandTabId, VcShowcaseMode } from "./vc-command-content";

const tabIcons = {
  home: BarChart3,
  chats: MessageSquareText,
  crm: Database,
  studio: Bot,
  traffic: Radar,
  tools: Wrench,
  referrals: Link2,
  settings: SlidersHorizontal,
} as const;

const commandTheme = {
  "--signal-rgb": "245 158 11",
  "--signal": "rgb(245 158 11)",
  "--signal-bright": "#fbbf24",
  "--signal-strong": "#f59e0b",
  "--signal-hover": "#fcd34d",
  "--surface-base": "#050506",
  "--surface-1": "#0b0b0c",
  "--surface-2": "#12110f",
  "--surface-line": "rgb(245 158 11 / 0.16)",
} as CSSProperties;

type VcCommandShellProps = {
  activeTab: VcCommandTabId;
  onPresenterOpen: () => void;
  onScriptOpen: () => void;
  onTabChange: (tab: VcCommandTabId) => void;
  showcaseMode: VcShowcaseMode | null;
  children: ReactNode;
};

const showcaseLabels: Record<VcShowcaseMode, string> = {
  dialog: "dialog",
  dashboard: "dashboard",
  chat: "chat",
  crm: "crm",
  agent: "agent",
  radar: "radar",
};

export function VcCommandShell({
  activeTab,
  onPresenterOpen,
  onScriptOpen,
  onTabChange,
  showcaseMode,
  children,
}: VcCommandShellProps) {
  return (
    <main
      style={commandTheme}
      className="min-h-screen overflow-x-clip bg-[var(--surface-base)] text-white"
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[var(--surface-base)]">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#050506_0%,#090807_48%,#020202_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgb(var(--signal-rgb)/0.045)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--signal-rgb)/0.032)_1px,transparent_1px)] bg-[size:44px_44px] opacity-45 [mask-image:linear-gradient(180deg,black,transparent_92%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-signal/35" />
      </div>

      <div className="mx-auto grid min-h-screen w-full max-w-[1680px] gap-0 lg:grid-cols-[286px_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-black/28 px-3 py-3 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:px-4 lg:py-5">
          <div className="flex items-center justify-between gap-3 lg:block">
            <div className="flex min-w-0 items-center gap-3 rounded-lg border border-signal/18 bg-white/[0.045] p-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-signal/35 bg-signal/12 text-signal-bright shadow-[0_0_28px_rgb(var(--signal-rgb)/0.16)]">
                <Activity className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-mono text-[10px] uppercase tracking-[0.22em] text-signal/80">
                  VibeCamp demo
                </p>
                <h1 className="truncate text-base font-semibold text-white">VC Command Center</h1>
              </div>
            </div>
            <div className="hidden rounded-lg border border-signal/14 bg-signal/8 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-signal-bright sm:block lg:mt-3">
              AI Dialog OS
            </div>
          </div>

          <nav aria-label="VC Command Center" className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:mt-6 lg:grid lg:gap-2 lg:overflow-visible lg:pb-0">
            {vcCommandTabs.map((tab) => {
              const Icon = tabIcons[tab.id];
              const selected = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  data-vc-tab={tab.id}
                  aria-current={selected ? "page" : undefined}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "group inline-flex min-h-11 w-fit shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-strong lg:w-full",
                    selected
                      ? "border-signal/42 bg-signal/14 text-white shadow-[0_0_34px_rgb(var(--signal-rgb)/0.12)]"
                      : "border-white/8 bg-white/[0.035] text-slate-300 hover:border-signal/24 hover:bg-signal/8 hover:text-white",
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", selected ? "text-signal-bright" : "text-slate-500 group-hover:text-signal")} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block whitespace-nowrap font-medium">{tab.label}</span>
                    <span className="hidden truncate text-xs text-slate-500 lg:block">{tab.description}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-5 hidden rounded-lg border border-white/10 bg-white/[0.035] p-4 lg:block">
            <div className="mb-3 flex items-center gap-2 text-signal-bright">
              <ShieldCheck className="size-4" aria-hidden="true" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em]">safe demo</span>
            </div>
            <p className="text-xs leading-5 text-slate-400">
              Без реальных банков, персональных данных, выплат и обещаний approve.
            </p>
          </div>
        </aside>

        <section className="min-w-0 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <header className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 shadow-[0_18px_80px_rgba(0,0,0,0.22),inset_0_1px_0_rgb(var(--signal-rgb)/0.06)] backdrop-blur-xl sm:px-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal/75">
                  AI Build Sprint demo
                </p>
                <h2 className="mt-1 text-balance text-2xl font-semibold leading-tight text-white sm:text-3xl">
                  VC Command Center
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-400">AI Dialog Engine для РКО / Telegram / CPA</p>
              </div>

              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="inline-flex min-h-9 items-center gap-2 rounded-md border border-signal/20 bg-signal/10 px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-signal-bright">
                  <BadgeCheck className="size-3.5" aria-hidden="true" />
                  Synthetic demo
                </span>
                {showcaseMode ? (
                  <span className="inline-flex min-h-9 items-center rounded-md border border-white/10 bg-white/[0.045] px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-300">
                    {showcaseLabels[showcaseMode]}
                  </span>
                ) : (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      onClick={onPresenterOpen}
                      className="bg-signal text-slate-950 hover:bg-signal-bright"
                    >
                      <SlidersHorizontal className="size-4" />
                      Режим презентации
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={onScriptOpen}
                      className="border-white/10 bg-white/[0.055] text-white hover:bg-white/10"
                    >
                      <FileText className="size-4" />
                      Скрипт эфира
                    </Button>
                  </>
                )}
              </div>
            </div>
          </header>

          <div className="mt-5 min-w-0">{children}</div>

          <footer className="mt-5 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-xs leading-5 text-slate-500">
            {demoNotice}
          </footer>
        </section>
      </div>
    </main>
  );
}
