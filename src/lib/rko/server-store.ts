import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getRkoAiProvider } from "@/lib/ai/provider";
import { findDuplicateLead, normalizePhone, normalizeTelegram } from "./dedup";
import { scoreLead, statusForClass } from "./scoring";
import { createSeedLeads } from "./seed";
import { calculateTrafficQuality } from "./traffic";
import type { Lead, LeadAction, LeadActionType, LeadDraft, LeadEvent, LeadStatus, SourceReport } from "./types";

type RkoDatabase = {
  leads: Lead[];
  actions: LeadAction[];
  events: LeadEvent[];
};

const dataDir = path.join(process.cwd(), ".rko-data");
const dataFile = path.join(dataDir, "db.json");

let writeQueue = Promise.resolve();

function id(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function now() {
  return new Date().toISOString();
}

function emptyDb(): RkoDatabase {
  return { leads: [], actions: [], events: [] };
}

async function ensureDb() {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(dataFile, "utf8");
  } catch {
    const leads = createSeedLeads(100);
    await writeFile(dataFile, JSON.stringify({
      leads,
      actions: [],
      events: [{ id: id("evt"), type: "seed_generated", createdAt: now(), payload: { count: leads.length } }],
    } satisfies RkoDatabase, null, 2));
  }
}

export async function readRkoDb(): Promise<RkoDatabase> {
  await ensureDb();
  try {
    const raw = await readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw) as RkoDatabase;
    return {
      leads: Array.isArray(parsed.leads) ? parsed.leads : [],
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return emptyDb();
  }
}

async function writeRkoDb(db: RkoDatabase) {
  await mkdir(dataDir, { recursive: true });
  writeQueue = writeQueue.then(() => writeFile(dataFile, JSON.stringify(db, null, 2)));
  await writeQueue;
}

function event(type: LeadEvent["type"], leadId?: string, payload?: Record<string, unknown>): LeadEvent {
  return { id: id("evt"), type, leadId, createdAt: now(), payload };
}

function actionToStatus(type: LeadActionType): LeadStatus {
  if (type === "send_to_manager") return "sent_to_manager";
  if (type === "follow_up") return "qualified";
  if (type === "nurture") return "nurture";
  if (type === "junk_or_duplicate") return "junk";
  return "closed";
}

function actionLabel(type: LeadActionType) {
  if (type === "send_to_manager") return "Передать менеджеру";
  if (type === "follow_up") return "Дожать";
  if (type === "nurture") return "В прогрев";
  if (type === "junk_or_duplicate") return "Мусор/дубль";
  return "Закрыт";
}

export async function listLeads() {
  const db = await readRkoDb();
  return db.leads.toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function getLead(idValue: string) {
  const db = await readRkoDb();
  return {
    lead: db.leads.find((lead) => lead.id === idValue),
    actions: db.actions.filter((action) => action.leadId === idValue).toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    events: db.events.filter((item) => item.leadId === idValue).toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
  };
}

export async function createLead(draft: LeadDraft) {
  const db = await readRkoDb();
  const normalizedDraft = {
    ...draft,
    telegram: normalizeTelegram(draft.telegram) || undefined,
    phone: normalizePhone(draft.phone) || undefined,
  };
  const duplicate = findDuplicateLead(normalizedDraft, db.leads);
  const scoring = scoreLead(normalizedDraft, db.leads);
  const riskFlags = duplicate && !scoring.riskFlags.includes("duplicate") ? [...scoring.riskFlags, "duplicate" as const] : scoring.riskFlags;
  const score = duplicate ? Math.min(scoring.score, 55) : scoring.score;
  const leadClass = duplicate ? "C" : scoring.leadClass;
  const temporary: Lead = {
    ...normalizedDraft,
    id: id("rko"),
    createdAt: now(),
    score,
    leadClass,
    riskFlags,
    recommendedRoute: "",
    nextAction: "",
    managerSummary: "",
    status: duplicate ? "duplicate" : statusForClass(leadClass),
  };
  const insight = await getRkoAiProvider().enrichLead(temporary, db.leads);
  const lead: Lead = {
    ...temporary,
    recommendedRoute: insight.recommendedRoute,
    nextAction: insight.nextAction,
    managerSummary: insight.managerSummary,
  };

  db.leads = [lead, ...db.leads];
  db.events = [
    event("lead_created", lead.id, { source: lead.source, campaign: lead.campaign }),
    event("lead_scored", lead.id, { score: lead.score, leadClass: lead.leadClass, riskFlags: lead.riskFlags }),
    ...(duplicate ? [event("duplicate_detected", lead.id, { duplicateLeadId: duplicate.id })] : []),
    ...db.events,
  ];
  await writeRkoDb(db);
  return { lead, duplicateLeadId: duplicate?.id };
}

export async function updateLeadStatusServer(idValue: string, status: LeadStatus) {
  const db = await readRkoDb();
  const lead = db.leads.find((item) => item.id === idValue);
  if (!lead) return undefined;
  const fromStatus = lead.status;
  lead.status = status;
  db.events = [event("status_changed", lead.id, { fromStatus, toStatus: status }), ...db.events];
  await writeRkoDb(db);
  return lead;
}

export async function addLeadAction(idValue: string, input: { type: LeadActionType; note?: string; managerName?: string }) {
  const db = await readRkoDb();
  const lead = db.leads.find((item) => item.id === idValue);
  if (!lead) return undefined;
  const fromStatus = lead.status;
  const toStatus = actionToStatus(input.type);
  lead.status = toStatus;
  const action: LeadAction = {
    id: id("act"),
    leadId: lead.id,
    type: input.type,
    label: actionLabel(input.type),
    note: input.note,
    managerName: input.managerName || "demo manager",
    createdAt: now(),
    fromStatus,
    toStatus,
  };
  db.actions = [action, ...db.actions];
  db.events = [event("manager_action", lead.id, { actionType: input.type, fromStatus, toStatus }), ...db.events];
  await writeRkoDb(db);
  return { lead, action };
}

export async function seedDemoLeads(count = 100) {
  const leads = createSeedLeads(count);
  const db: RkoDatabase = {
    leads,
    actions: [],
    events: [event("seed_generated", undefined, { count })],
  };
  await writeRkoDb(db);
  return leads;
}

export async function getTrafficReport(): Promise<SourceReport> {
  const db = await readRkoDb();
  return {
    generatedAt: now(),
    rows: calculateTrafficQuality(db.leads),
  };
}

export async function getTrafficCsv() {
  const report = await getTrafficReport();
  const headers = ["source", "leads", "A/B %", "duplicate %", "risk %", "no intent %", "avg score", "recommendation"];
  const rows = report.rows.map((row) => [
    row.source,
    row.leads,
    row.abPercent,
    row.duplicatePercent,
    row.riskPercent,
    row.noIntentPercent,
    row.avgScore,
    row.recommendation,
  ]);
  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
}
