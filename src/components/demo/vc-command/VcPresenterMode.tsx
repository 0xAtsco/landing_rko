"use client";

import { useCallback, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MousePointerClick,
  Play,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VcCommandTabId } from "./vc-command-content";
import type { VcDemoScenarios } from "./useVcDemoScenarios";
import type { VcAiScenarioId } from "./vc-ai-dialog-types";

type PresenterStep = {
  title: string;
  say: string;
  action: string;
  proof: string;
  tab: VcCommandTabId;
  aiScenario?: VcAiScenarioId;
  playVoice?: boolean;
  cta?: boolean;
};

const presenterSteps: PresenterStep[] = [
  {
    title: "Главная ценность — AI-обработчик",
    say: "Главная ценность — обработчик, который подстраивается под тон диалога, задаёт следующий лучший вопрос, обновляет CRM и даёт менеджеру короткую выжимку.",
    action: "Открыть AI Диалог.",
    proof: "Слева чат, справа live intelligence: тон, score, next question, CRM status.",
    tab: "chats",
  },
  {
    title: "Горячий лид",
    say: "Запускаем горячий РКО-запрос. Смотрите: система видит high_intent, считает score, выбирает следующий вопрос и готовит voice reply.",
    action: "Нажать “Горячий РКО”.",
    proof: "Tone high_intent, score, next best question, voice reply.",
    tab: "chats",
    aiScenario: "hot",
    playVoice: true,
  },
  {
    title: "Новичок не понимает",
    say: "Теперь человек не понимает, с чего начать. AI не давит, а объясняет коротко и задаёт один следующий вопрос.",
    action: "Нажать “Новичок не понимает”.",
    proof: "Tone confused, style warm_explainer, один вопрос без перегруза.",
    tab: "chats",
    aiScenario: "confused",
  },
  {
    title: "Сомнение",
    say: "Если человек сомневается, AI отвечает спокойно: показывает логику, не обещает approve и не давит.",
    action: "Нажать “Сомневается”.",
    proof: "Tone skeptical, style expert_confident, спокойный next question.",
    tab: "chats",
    aiScenario: "skeptical",
  },
  {
    title: "Бонусный мотив",
    say: "Если человек хочет только бонус, система включает risk_filter и не называет такой лид горячим.",
    action: "Нажать “Хочет бонус”.",
    proof: "Tone bonus_hunter, class D/F, no hot handoff.",
    tab: "chats",
    aiScenario: "bonus",
  },
  {
    title: "CRM получает карточку",
    say: "Менеджер получает не сырой чат, а карточку: поля, score, class, выжимку и следующий шаг.",
    action: "Открыть CRM.",
    proof: "Последняя AI-dialog карточка в списке лидов.",
    tab: "crm",
  },
  {
    title: "Настройка ИИ",
    say: "Это не магия. Здесь настраиваются prompt, tone mode, stop factors и voice reply. Эти настройки влияют на AI Диалог.",
    action: "Открыть Настройку ИИ.",
    proof: "Prompt, Tone & Voice, Stop Factors.",
    tab: "studio",
  },
  {
    title: "Качество источников",
    say: "После обработки видно, какой источник даёт качество, а где мотив, дубли и слабое намерение.",
    action: "Открыть Радар трафика.",
    proof: "Source quality по A/B лидам, риску и дублям.",
    tab: "traffic",
  },
  {
    title: "Финальный CTA",
    say: "Это SWOP-like логика: не просто чат, а система обработки трафика, тона, качества и handoff.",
    action: "Сформулировать CTA: на спринте собираем такой рабочий AI-обработчик под свою задачу.",
    proof: "AI Диалог остаётся главным экраном, CRM и Radar — доказательства обработки.",
    tab: "chats",
    cta: true,
  },
];

type VcPresenterModeProps = {
  open: boolean;
  stepIndex: number;
  scenarios: VcDemoScenarios;
  onClose: () => void;
  onStepChange: (index: number) => void;
  onTabChange: (tab: VcCommandTabId) => void;
};

function clampStep(index: number) {
  return Math.min(Math.max(index, 0), presenterSteps.length - 1);
}

function clickVoiceSummary() {
  const voiceButton = document.querySelector<HTMLElement>("[data-ai-voice-play]");
  voiceButton?.scrollIntoView({ behavior: "smooth", block: "center" });

  window.setTimeout(() => {
    document.querySelector<HTMLButtonElement>("[data-ai-voice-play]")?.click();
  }, 250);
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function VcPresenterMode({
  open,
  stepIndex,
  scenarios,
  onClose,
  onStepChange,
  onTabChange,
}: VcPresenterModeProps) {
  const currentStep = presenterSteps[stepIndex] ?? presenterSteps[0];

  const previous = useCallback(() => {
    onStepChange(clampStep(stepIndex - 1));
  }, [onStepChange, stepIndex]);

  const next = useCallback(() => {
    onStepChange(clampStep(stepIndex + 1));
  }, [onStepChange, stepIndex]);

  const executeStep = useCallback(async () => {
    onTabChange(currentStep.tab);

    if (currentStep.aiScenario) {
      await wait(160);
      document.querySelector<HTMLButtonElement>(`[data-ai-scenario="${currentStep.aiScenario}"]`)?.click();
    }

    if (currentStep.playVoice) {
      window.setTimeout(clickVoiceSummary, 1400);
    }
  }, [currentStep, onTabChange]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previous();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [next, onClose, open, previous]);

  if (!open) return null;

  const progress = ((stepIndex + 1) / presenterSteps.length) * 100;

  return (
    <aside
      className="fixed inset-x-3 bottom-3 z-50 max-h-[88vh] overflow-hidden rounded-xl border border-signal/24 bg-[#070707]/96 shadow-[0_28px_140px_rgba(0,0,0,0.56),inset_0_1px_0_rgb(var(--signal-rgb)/0.1)] backdrop-blur-2xl lg:inset-x-auto lg:bottom-4 lg:right-4 lg:top-4 lg:w-[430px]"
      role="dialog"
      aria-modal="false"
      aria-label="Режим презентации"
      data-presenter-mode="open"
    >
      <div className="flex h-full max-h-[88vh] flex-col overflow-hidden">
        <div className="border-b border-white/10 p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal-bright">
                presenter mode
              </p>
              <h2 className="mt-1 text-xl font-semibold leading-tight text-white">
                {String(stepIndex + 1).padStart(2, "0")} / {String(presenterSteps.length).padStart(2, "0")}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.045] text-slate-300 transition hover:border-signal/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-strong"
              aria-label="Закрыть режим презентации"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-signal" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <h3 className="text-balance text-2xl font-semibold leading-tight text-white">{currentStep.title}</h3>

          <div className="mt-5 grid gap-3">
            <PresenterBlock label="Что сказать" text={currentStep.say} />
            <PresenterBlock label="Что сделать" text={currentStep.action} icon="click" />
            <PresenterBlock label="Видимое доказательство" text={currentStep.proof} icon="proof" />
          </div>

          {currentStep.cta ? (
            <div className="mt-5 rounded-xl border border-signal/24 bg-signal/10 p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal-bright">final cta</p>
              <h4 className="mt-2 text-xl font-semibold text-white">Собрать свой AI-обработчик</h4>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Не курс ради курса, а рабочий артефакт: диалог, score, CRM и handoff под задачу команды.
              </p>
            </div>
          ) : null}

        </div>

        <div className="grid gap-2 border-t border-white/10 p-4">
          <Button
            type="button"
            onClick={() => void executeStep()}
            disabled={scenarios.busy}
            className="bg-signal text-slate-950 hover:bg-signal-bright"
          >
            <Play className="size-4" />
            {scenarios.busy ? "Выполняется..." : "Выполнить действие"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={scenarios.busy}
            onClick={() => void scenarios.runAction("reset")}
            className="border-white/10 bg-white/[0.055] text-white hover:bg-white/10"
          >
            Сбросить демо
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={stepIndex === 0}
              onClick={previous}
              className="border-white/10 bg-white/[0.055] text-white hover:bg-white/10"
            >
              <ArrowLeft className="size-4" />
              Назад
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={stepIndex === presenterSteps.length - 1}
              onClick={next}
              className="border-white/10 bg-white/[0.055] text-white hover:bg-white/10"
            >
              Далее
              <ArrowRight className="size-4" />
            </Button>
          </div>
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
            ← / → шаги · Esc закрыть
          </p>
        </div>
      </div>
    </aside>
  );
}

function PresenterBlock({
  label,
  text,
  icon,
}: {
  label: string;
  text: string;
  icon?: "click" | "proof";
}) {
  const Icon = icon === "click" ? MousePointerClick : icon === "proof" ? CheckCircle2 : null;

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
      <div className="mb-2 flex items-center gap-2 text-signal-bright">
        {Icon ? <Icon className="size-4" aria-hidden="true" /> : null}
        <p className="font-mono text-[11px] uppercase tracking-[0.16em]">{label}</p>
      </div>
      <p className="text-sm leading-6 text-slate-200">{text}</p>
    </section>
  );
}
