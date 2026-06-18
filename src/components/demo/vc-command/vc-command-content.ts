export type VcCommandTabId =
  | "home"
  | "chats"
  | "crm"
  | "studio"
  | "traffic"
  | "tools"
  | "referrals"
  | "settings";

export type VcCommandTab = Readonly<{
  id: VcCommandTabId;
  label: string;
  description: string;
}>;

export const vcCommandTabs = [
  { id: "chats", label: "AI Диалог", description: "Тон, вопрос, score" },
  { id: "home", label: "Overview", description: "Обзор демо-системы" },
  { id: "crm", label: "CRM", description: "Карточки и выжимка" },
  { id: "traffic", label: "Радар трафика", description: "Качество источников" },
  { id: "studio", label: "Настройка ИИ", description: "Промпт и тон" },
  { id: "tools", label: "Инструменты", description: "Операционные модули" },
  { id: "referrals", label: "Реф. ссылки", description: "Метки и источники" },
  { id: "settings", label: "Presenter", description: "Сценарий показа" },
] as const satisfies readonly VcCommandTab[];

export function isVcCommandTabId(value: string | undefined): value is VcCommandTabId {
  return vcCommandTabs.some((tab) => tab.id === value);
}

export type VcShowcaseMode = "dialog" | "dashboard" | "chat" | "crm" | "agent" | "radar";

export const showcaseTabMap = {
  dialog: "chats",
  dashboard: "home",
  chat: "chats",
  crm: "crm",
  agent: "studio",
  radar: "traffic",
} as const satisfies Record<VcShowcaseMode, VcCommandTabId>;

export function isVcShowcaseMode(value: string | undefined): value is VcShowcaseMode {
  return Boolean(value && value in showcaseTabMap);
}

export const demoNotice =
  "Демо использует синтетические данные. Система показывает обработку, скоринг и качество источников. Без обещаний дохода, approve или выплат.";

export const demoScriptSteps = [
  "Открой AI Диалог.",
  "Запусти горячий РКО-сценарий.",
  "Покажи тон, score, next question и voice reply.",
  "Проверь карточку в CRM.",
  "Открой Настройку ИИ и Радар трафика.",
] as const;

export const leadFlow = ["Пост / реклама", "Сайт", "AI-чат", "CRM", "Менеджер"] as const;

export const chatScenario =
  "Привет, хочу открыть ИП и расчётный счёт. Работаю с маркетплейсами, оборот 700к–1м, Казань, нужен эквайринг. Открыть хочу на этой неделе.";

export const trafficAliasRows = [
  {
    source: "warm_telegram",
    text: "меньше лидов, выше A/B quality",
    quality: "сильный",
  },
  {
    source: "google_ads",
    text: "смешанное качество, нужен точный креатив",
    quality: "средний",
  },
  {
    source: "cpa_partner_1",
    text: "объём есть, качество плавает",
    quality: "смешанный",
  },
  {
    source: "cpa_partner_2",
    text: "видны дубли и похожие ответы",
    quality: "фильтровать",
  },
  {
    source: "motiv_channel",
    text: "много шума, низкое намерение, no reply / junk",
    quality: "пауза",
  },
  {
    source: "referral",
    text: "меньше объёма, хорошее намерение",
    quality: "хороший",
  },
] as const;

export const studioSections = [
  {
    title: "Status",
    value: "Demo agent active",
    text: "Агент ведёт диалог, вытаскивает поля и готовит выжимку менеджеру.",
  },
  {
    title: "Prompt & Logic",
    value: "readonly",
    text: "В этом шаге показываем логику визуально. Реальное редактирование промпта не включено.",
  },
  {
    title: "Test",
    value: "safe mode",
    text: "Тестируй только синтетические заявки без паспортов, карт, кодов и реальных банков.",
  },
  {
    title: "History",
    value: "mock log",
    text: "История показывает демо-события: score, risk flags, выжимка, следующий шаг.",
  },
] as const;

export const stopFactors = [
  "нет контакта",
  "нет ИП/ООО или намерения открыть",
  "дубль",
  "подозрительные одинаковые ответы",
  "no reply",
  "хочет только бесплатный материал",
] as const;

export const toolCards = [
  { title: "Чекер базы", text: "Показывает качество и дубли в синтетической базе." },
  { title: "Рассылка", text: "Макет сценария касаний, без реальной отправки." },
  { title: "Прозвон базы", text: "Макет voice-flow, без реальных звонков." },
  { title: "API", text: "Пример точки подключения, без реальной интеграции." },
  { title: "Аналитика базы", text: "Сводка по источникам и рискам." },
] as const;

export const referralRows = [
  {
    vertical: "РКО",
    offer: "demo_rko_start",
    tag: "tg_warm_01",
    link: "demo.link/rko-a",
    status: "active",
    quality: "высокий",
  },
  {
    vertical: "РКО",
    offer: "demo_rko_start",
    tag: "google_mix_02",
    link: "demo.link/rko-b",
    status: "active",
    quality: "средний",
  },
  {
    vertical: "CPA",
    offer: "demo_cpa_lead",
    tag: "partner_01",
    link: "demo.link/cpa-a",
    status: "visual demo",
    quality: "средний",
  },
  {
    vertical: "HR",
    offer: "demo_hr_flow",
    tag: "hr_test_01",
    link: "demo.link/hr-a",
    status: "visual demo",
    quality: "высокий",
  },
  {
    vertical: "MFO",
    offer: "demo_mfo_flow",
    tag: "mfo_test_01",
    link: "demo.link/mfo-a",
    status: "visual demo",
    quality: "риск",
  },
] as const;

export const settingsRows = [
  ["Demo mode", "enabled"],
  ["Synthetic data", "enabled"],
  ["LLM optional", "mock by default"],
  ["Telegram integration", "planned"],
  ["Голосовая выжимка", "active"],
] as const;
