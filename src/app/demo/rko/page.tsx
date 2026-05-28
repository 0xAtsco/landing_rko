"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Bot, LineChart, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RkoShell } from "@/components/demo/rko/RkoShell";
import { campaigns, campaignLabels, leadSources, sourceLabels } from "@/lib/rko/constants";
import type { LeadSource } from "@/lib/rko/types";

export default function RkoDemoLandingPage() {
  const [source, setSource] = useState<LeadSource>("warm_telegram");
  const [campaign, setCampaign] = useState<string>("rko_marketplace");
  const chatHref = useMemo(() => `/demo/rko/chat?source=${source}&campaign=${campaign}`, [campaign, source]);
  const playgroundHref = useMemo(() => `/demo/rko/playground?source=${source}&campaign=${campaign}`, [campaign, source]);

  return (
    <RkoShell kicker="demo funnel" title="Подберите РКО и не потеряйте заявку после первого клика">
      <section className="mt-8 grid min-h-[64vh] gap-6 lg:grid-cols-[1fr_440px] lg:items-center">
        <div className="grid gap-6">
          <p className="max-w-2xl text-pretty text-lg leading-8 text-slate-200">
            AI задаст вопросы, соберёт данные и передаст менеджеру понятную карточку лида.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: Bot, title: "Бот задаёт вопросы", text: "Не теряем контекст после первого клика." },
              { icon: Sparkles, title: "AI ставит score", text: "A/B идут менеджеру, мусор режется раньше." },
              { icon: LineChart, title: "Видно качество", text: "Источник оценивается по лидам, а не по шуму." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-lg border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl">
                  <Icon className="size-5 text-signal" />
                  <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-11 bg-signal px-5 text-slate-950 hover:bg-signal-bright" data-analytics="demo_start_chat">
              <Link href={chatHref}>Оставить тестовую заявку <ArrowRight className="size-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="h-11 border-white/10 bg-white/[0.055] px-5 text-white hover:bg-white/10" data-analytics="demo_open_dashboard">
              <Link href="/demo/rko/dashboard">Открыть dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 border-signal/20 bg-signal/10 px-5 text-signal-bright hover:bg-signal/15" data-analytics="demo_start_chat">
              <Link href={playgroundHref}>Public playground</Link>
            </Button>
          </div>
        </div>

        <aside className="rounded-lg border border-signal/18 bg-white/[0.06] p-5 shadow-[0_32px_120px_rgb(var(--signal-rgb)/0.14)] backdrop-blur-xl">
          <div className="flex items-center gap-2 text-signal-bright">
            <ShieldCheck className="size-5" />
            <span className="font-mono text-xs uppercase tracking-[0.18em]">source simulator</span>
          </div>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm text-slate-300">
              Source
              <select className="rounded-lg border border-white/10 bg-[var(--surface-2)] px-3 py-3 text-white outline-none focus:border-signal/50" value={source} onChange={(event) => setSource(event.target.value as LeadSource)}>
                {leadSources.map((item) => <option key={item} value={item}>{sourceLabels[item]}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Campaign
              <select className="rounded-lg border border-white/10 bg-[var(--surface-2)] px-3 py-3 text-white outline-none focus:border-signal/50" value={campaign} onChange={(event) => setCampaign(event.target.value)}>
                {campaigns.map((item) => <option key={item} value={item}>{campaignLabels[item]}</option>)}
              </select>
            </label>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">demo route</p>
              <p className="mt-2 break-all font-mono text-xs text-signal-bright">{chatHref}</p>
            </div>
          </div>
        </aside>
      </section>
    </RkoShell>
  );
}
