"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const scriptSections = [
  {
    title: "1. AI Диалог",
    text: "Главная ценность здесь — не CRM, а AI-обработчик, который ведёт диалог и подстраивается под тон человека.",
  },
  {
    title: "2. Горячий лид",
    text: "Запускаем горячий РКО-сценарий. Показываем high_intent, score, next best question и voice reply.",
  },
  {
    title: "3. Новичок",
    text: "Запускаем сценарий новичка. AI объясняет спокойно, не перегружает и задаёт один вопрос.",
  },
  {
    title: "4. Сомнение",
    text: "Показываем skeptical tone: без давления, с коротким объяснением логики обработки.",
  },
  {
    title: "5. Бонусный мотив",
    text: "Запускаем bonus hunter. AI включает risk_filter и не отдаёт такой лид как горячий.",
  },
  {
    title: "6. CRM",
    text: "Открываем CRM. Там не сырой чат, а карточка: поля, score, class, выжимка и следующий шаг.",
  },
  {
    title: "7. Настройка ИИ",
    text: "Показываем prompt, tone mode, stop factors и voice toggle. Эти настройки влияют на AI Диалог.",
  },
  {
    title: "8. Радар / финал",
    text: "Открываем Радар. Финальная мысль: это SWOP-like логика — трафик, тон, качество и handoff, а не просто чат.",
  },
] as const;

type VcDemoScriptPanelProps = {
  open: boolean;
  onClose: () => void;
};

async function copyText(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function VcDemoScriptPanel({ open, onClose }: VcDemoScriptPanelProps) {
  const [copyStatus, setCopyStatus] = useState("");
  const fullScript = useMemo(
    () => scriptSections.map((section) => `${section.title}\n${section.text}`).join("\n\n"),
    [],
  );

  const handleCopy = useCallback(async () => {
    try {
      await copyText(fullScript);
      setCopyStatus("Скопировано");
    } catch {
      setCopyStatus("Не удалось скопировать");
    }
  }, [fullScript]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden bg-black/58 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Скрипт эфира">
      <div className="absolute inset-x-3 bottom-3 max-h-[88vh] overflow-hidden rounded-xl border border-white/10 bg-[#070707]/98 shadow-[0_28px_140px_rgba(0,0,0,0.56)] lg:inset-y-4 lg:left-auto lg:right-4 lg:w-[520px]">
        <div className="flex h-full max-h-[88vh] flex-col overflow-hidden">
          <header className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal-bright">demo script</p>
              <h2 className="mt-1 text-2xl font-semibold leading-tight text-white">Скрипт эфира</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">5–7 минут. Только синтетическое демо.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.045] text-slate-300 transition hover:border-signal/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-strong"
              aria-label="Закрыть скрипт эфира"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="grid gap-3">
              {scriptSections.map((section) => (
                <section key={section.title} className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
                  <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-signal-bright">{section.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{section.text}</p>
                </section>
              ))}
            </div>
          </div>

          <footer className="grid gap-2 border-t border-white/10 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              {copyStatus === "Скопировано" ? <CheckCircle2 className="size-4 text-emerald-200" aria-hidden="true" /> : null}
              {copyStatus || "Готово для копирования"}
            </div>
            <Button type="button" className="bg-signal text-slate-950 hover:bg-signal-bright" onClick={() => void handleCopy()}>
              <Copy className="size-4" />
              copy script
            </Button>
          </footer>
        </div>
      </div>
    </div>
  );
}
