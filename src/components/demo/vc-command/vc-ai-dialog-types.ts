import type { DialogMessage, LeadDraft } from "@/lib/rko/types";

export type LeadTone =
  | "neutral"
  | "warm"
  | "skeptical"
  | "rushed"
  | "aggressive"
  | "confused"
  | "price_focused"
  | "bonus_hunter"
  | "high_intent";

export type DialogStage =
  | "greeting"
  | "intent"
  | "qualification"
  | "need"
  | "contact"
  | "handoff"
  | "nurture"
  | "reject";

export type ResponseStyle =
  | "short_direct"
  | "warm_explainer"
  | "expert_confident"
  | "soft_closer"
  | "risk_filter"
  | "human_handoff";

export type AiDialogResult = {
  reply: string;
  voiceText: string;
  detectedTone: LeadTone;
  responseStyle: ResponseStyle;
  stage: DialogStage;
  nextBestQuestion: string;
  extractedFields: {
    entityType?: string;
    businessType?: string;
    city?: string;
    monthlyTurnover?: string;
    needs?: string[];
    urgency?: string;
    contact?: string;
    currentBank?: string;
  };
  score: number;
  leadClass: "A" | "B" | "C" | "D" | "F";
  riskFlags: string[];
  managerSummary: string;
  nextAction: string;
  shouldCreateLead: boolean;
  shouldHandoffToManager: boolean;
};

export type VcToneMode = "balanced" | "expert" | "friendly" | "strict_filter" | "closer";

export type VcAiDialogSettings = {
  systemPrompt: string;
  stopFactors: string[];
  toneMode: VcToneMode;
  voiceEnabled: boolean;
};

export type VcAiDialogProviderMode = "llm" | "fallback";
export type VcVoiceProvider = "unknown" | "elevenlabs" | "browser" | "transcript";

export type VcAiDialogRequest = {
  sessionId?: string;
  messages?: Array<Partial<DialogMessage>>;
  currentLeadDraft?: Partial<LeadDraft>;
  settings?: Partial<VcAiDialogSettings>;
};

export type VcAiDialogResponse = {
  result: AiDialogResult;
  draft: LeadDraft;
  providerMode: VcAiDialogProviderMode;
  notes: string[];
  diagnostics?: {
    llmConfigured: boolean;
    providerError?: string;
  };
};

export type VcAiDialogMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  result?: AiDialogResult;
  providerMode?: VcAiDialogProviderMode;
};

export type VcAiScenarioId = "hot" | "confused" | "skeptical" | "bonus" | "urgent";

export const VC_AGENT_PROMPT_KEY = "vc-command-agent-prompt";
export const VC_STOP_FACTORS_KEY = "vc-command-stop-factors";
export const VC_TONE_MODE_KEY = "vc-command-tone-mode";
export const VC_VOICE_ENABLED_KEY = "vc-command-voice-enabled";

export const VC_SETTINGS_EVENT = "vc-command-agent-settings-updated";

export const DEFAULT_VC_AGENT_PROMPT =
  "Ты AI-обработчик заявок на РКО. Веди короткий человеческий диалог, подстраивайся под тон, собирай поля лида, считай score и готовь выжимку менеджеру. Не обещай доход, approve, выплаты, обход проверок или замену менеджера.";

export const DEFAULT_VC_STOP_FACTORS = [
  "нет контакта",
  "нет ИП/ООО и нет намерения открыть",
  "дубль или похожая заявка",
  "одинаковые подозрительные ответы",
  "no reply",
  "хочет только бонус/бесплатный материал",
  "просит гарантировать approve/выплаты",
  "просит обход проверок или фейковые данные",
] as const;

export const DEFAULT_VC_AI_SETTINGS: VcAiDialogSettings = {
  systemPrompt: DEFAULT_VC_AGENT_PROMPT,
  stopFactors: [...DEFAULT_VC_STOP_FACTORS],
  toneMode: "balanced",
  voiceEnabled: true,
};
