"use client";

import { useCallback, useMemo, useState } from "react";
import { addLead, replaceWithSeed } from "@/lib/rko/store";
import type { Lead, LeadDraft } from "@/lib/rko/types";

const hotLeadText =
  "Привет, хочу открыть ИП и расчётный счёт. Работаю с маркетплейсами, оборот 700к–1м, Казань, нужен эквайринг. Открыть хочу на этой неделе.";

const junkLeadText =
  "Просто посмотреть, ИП нет, открывать ничего не планирую, телефон не дам, интересно только где бонус.";

export const vcTimelineLabels = [
  "Заявка получена",
  "AI уточнил поля",
  "Score рассчитан",
  "Карточка создана в CRM",
  "Выжимка готова менеджеру",
] as const;

export type VcDemoAction = "hot" | "junk" | "generate" | "reset";

export type VcDemoResult =
  | {
      type: "lead";
      title: string;
      text: string;
      lead: Lead;
    }
  | {
      type: "bulk";
      title: string;
      text: string;
      count: number;
    };

export type VcDemoScenarios = {
  activeAction: VcDemoAction | null;
  busy: boolean;
  completedSteps: number;
  error: string | null;
  result: VcDemoResult | null;
  runAction: (action: VcDemoAction) => Promise<void>;
  resetResult: () => void;
};

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function now() {
  return new Date().toISOString();
}

function uniqueHandle(prefix: string) {
  return `@${prefix}_${Date.now().toString(36)}`;
}

function hotLeadDraft(): LeadDraft {
  return {
    source: "warm_telegram",
    campaign: "rko_marketplace",
    creative: "vc_command_hot_scenario",
    telegram: uniqueHandle("vc_hot"),
    entityType: "planning_ip",
    businessType: "маркетплейсы",
    city: "Казань",
    monthlyTurnover: "700к–1м",
    currentBank: undefined,
    needs: ["rko", "ip_registration", "acquiring"],
    urgency: "week",
    rawDialog: [
      {
        role: "user",
        content: hotLeadText,
        createdAt: now(),
      },
      {
        role: "assistant",
        content: "Понял задачу: ИП, РКО и эквайринг для маркетплейсов. Передам менеджеру выжимку и следующий шаг.",
        createdAt: now(),
      },
    ],
  };
}

function junkLeadDraft(): LeadDraft {
  return {
    source: "bad_motiv",
    campaign: "generic_rko",
    creative: "motiv_channel_visual_alias",
    entityType: "unknown",
    businessType: "низкое намерение: просто посмотреть бонус",
    city: "",
    monthlyTurnover: "",
    currentBank: undefined,
    needs: [],
    urgency: "later",
    rawDialog: [
      {
        role: "user",
        content: junkLeadText,
        createdAt: now(),
      },
      {
        role: "assistant",
        content: "Без контакта, ИП/ООО и намерения открыть счёт заявку лучше не отдавать менеджеру.",
        createdAt: now(),
      },
    ],
  };
}

export function useVcDemoScenarios(): VcDemoScenarios {
  const [activeAction, setActiveAction] = useState<VcDemoAction | null>(null);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [result, setResult] = useState<VcDemoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTimeline = useCallback(async () => {
    setCompletedSteps(0);
    for (let index = 1; index <= vcTimelineLabels.length; index += 1) {
      await wait(180);
      setCompletedSteps(index);
    }
  }, []);

  const runAction = useCallback(
    async (action: VcDemoAction) => {
      setActiveAction(action);
      setError(null);
      setResult(null);

      try {
        if (action === "hot") {
          const [lead] = await Promise.all([addLead(hotLeadDraft()), runTimeline()]);
          setResult({
            type: "lead",
            title: "Горячий РКО-лид создан",
            text: "Высокий score, A/B class, выжимка готова для менеджера.",
            lead,
          });
          return;
        }

        if (action === "junk") {
          const [lead] = await Promise.all([addLead(junkLeadDraft()), runTimeline()]);
          setResult({
            type: "lead",
            title: "Мусорный лид отфильтрован",
            text: "Низкое намерение, нет контакта, нет ИП/ООО или намерения открыть.",
            lead,
          });
          return;
        }

        const [leads] = await Promise.all([replaceWithSeed(100), runTimeline()]);
        setResult({
          type: "bulk",
          title: action === "generate" ? "100 синтетических лидов создано" : "Демо сброшено",
          text:
            action === "generate"
              ? "Источники обновлены: warm_telegram, google_ads, cpa_partner_1, cpa_partner_2, motiv_channel, referral."
              : "База вернулась к чистой синтетической выборке для нового показа.",
          count: leads.length,
        });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Не удалось выполнить demo action");
      } finally {
        setActiveAction(null);
      }
    },
    [runTimeline],
  );

  const resetResult = useCallback(() => {
    setCompletedSteps(0);
    setError(null);
    setResult(null);
  }, []);

  return useMemo(
    () => ({
      activeAction,
      busy: activeAction !== null,
      completedSteps,
      error,
      result,
      runAction,
      resetResult,
    }),
    [activeAction, completedSteps, error, result, runAction, resetResult],
  );
}
