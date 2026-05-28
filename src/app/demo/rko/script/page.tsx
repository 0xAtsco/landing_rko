import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RkoShell } from "@/components/demo/rko/RkoShell";

const steps = [
  "Открыть dashboard и показать, что CRM уже содержит демо-лиды с разным score.",
  "Открыть live chat во втором окне и написать свободно: “У меня ИП на маркетплейсах, оборот 800к, нужен счёт и эквайринг”.",
  "Показать streaming-ответ AI и Processing Theater: данные извлекаются, score меняется, summary собирается на глазах.",
  "Нажать “Создать CRM-карточку сейчас” или дождаться контакта. Открыть карточку в dashboard.",
  "Вернуться в chat и нажать “Мусор/мотив”. Показать, что лид получает слабый score и risk flags.",
  "В dashboard выбрать мусорный лид и показать, что менеджеру его можно не отдавать.",
  "Открыть traffic dashboard и сравнить warm_telegram с bad_motiv.",
  "Показать public playground: аудитория может попробовать чат без доступа к общей CRM-таблице.",
];

export default function RkoScriptPage() {
  return (
    <RkoShell kicker="live demo script" title="Сценарий демонстрации на 5 минут">
      <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl">
          <ol className="grid gap-3">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3 rounded-lg border border-white/10 bg-black/18 p-3 text-sm leading-6 text-slate-200">
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-signal text-sm font-semibold text-slate-950">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
        <aside className="grid content-start gap-4 rounded-lg border border-signal/18 bg-white/[0.06] p-5 shadow-[0_32px_120px_rgb(var(--signal-rgb)/0.14)] backdrop-blur-xl">
          <CheckCircle2 className="size-8 text-emerald-300" />
          <h3 className="text-xl font-semibold text-white">Финальная фраза</h3>
          <p className="text-sm leading-6 text-slate-300">
            “Это не production banking system и не обещание approve. Это MVP, который показывает, как AI помогает быстрее обработать заявку, не потерять горячего лида, отфильтровать мусор и увидеть качество источников.”
          </p>
          <div className="grid gap-2">
            <Button asChild className="bg-signal text-slate-950 hover:bg-signal-bright" data-analytics="demo_open_dashboard">
              <Link href="/demo/rko/dashboard">Открыть dashboard <ArrowRight className="size-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="border-white/10 bg-white/[0.055] text-white hover:bg-white/10" data-analytics="demo_open_traffic">
              <Link href="/demo/rko/traffic">Открыть traffic</Link>
            </Button>
            <Button asChild variant="outline" className="border-signal/20 bg-signal/10 text-signal-bright hover:bg-signal/15" data-analytics="demo_start_chat">
              <Link href="/demo/rko/playground">Открыть playground</Link>
            </Button>
          </div>
        </aside>
      </section>
    </RkoShell>
  );
}
