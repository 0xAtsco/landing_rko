export type LeadSource =
  | "warm_telegram"
  | "google_ads"
  | "cpa_partner_1"
  | "cpa_partner_2"
  | "bad_motiv"
  | "referral";

export type LeadNeed =
  | "rko"
  | "ip_registration"
  | "ooo_registration"
  | "acquiring"
  | "accounting"
  | "salary_project"
  | "credit"
  | "currency_control";

export type EntityType =
  | "ip_exists"
  | "ooo_exists"
  | "planning_ip"
  | "planning_ooo"
  | "self_employed"
  | "unknown";

export type Urgency = "today" | "week" | "month" | "later" | "unknown";

export type LeadClass = "A" | "B" | "C" | "D" | "F";

export type LeadStatus =
  | "new"
  | "qualified"
  | "sent_to_manager"
  | "nurture"
  | "junk"
  | "duplicate"
  | "closed";

export type RiskFlag =
  | "no_contact"
  | "no_business_intent"
  | "no_entity"
  | "not_ready"
  | "duplicate"
  | "motivated_traffic"
  | "contradictory_answers"
  | "empty_answers"
  | "bad_source";

export type DialogMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type Lead = {
  id: string;
  createdAt: string;
  source: LeadSource;
  campaign: string;
  creative?: string;
  name?: string;
  telegram?: string;
  phone?: string;
  entityType: EntityType;
  businessType?: string;
  city?: string;
  monthlyTurnover?: string;
  currentBank?: string;
  needs: LeadNeed[];
  urgency: Urgency;
  rawDialog: DialogMessage[];
  score: number;
  leadClass: LeadClass;
  riskFlags: RiskFlag[];
  recommendedRoute: string;
  nextAction: string;
  managerSummary: string;
  status: LeadStatus;
};

export type LeadEventType =
  | "lead_created"
  | "lead_scored"
  | "duplicate_detected"
  | "status_changed"
  | "manager_action"
  | "seed_generated";

export type LeadEvent = {
  id: string;
  leadId?: string;
  type: LeadEventType;
  createdAt: string;
  payload?: Record<string, unknown>;
};

export type LeadActionType =
  | "send_to_manager"
  | "follow_up"
  | "nurture"
  | "junk_or_duplicate"
  | "closed";

export type LeadAction = {
  id: string;
  leadId: string;
  type: LeadActionType;
  label: string;
  createdAt: string;
  managerName?: string;
  note?: string;
  fromStatus?: LeadStatus;
  toStatus?: LeadStatus;
};

export type LeadDraft = Omit<
  Lead,
  | "id"
  | "createdAt"
  | "score"
  | "leadClass"
  | "riskFlags"
  | "recommendedRoute"
  | "nextAction"
  | "managerSummary"
  | "status"
>;

export type ScoreFactor = {
  label: string;
  points: number;
  active: boolean;
};

export type ScoreResult = {
  score: number;
  leadClass: LeadClass;
  riskFlags: RiskFlag[];
  factors: ScoreFactor[];
};

export type LeadInsight = {
  managerSummary: string;
  scoreExplanation: string;
  recommendedRoute: string;
  nextAction: string;
  suggestedMessage: string;
  copilotSay: string;
  copilotAsk: string;
  copilotStep: string;
};

export type TrafficSourceQuality = {
  source: LeadSource;
  leads: number;
  abPercent: number;
  duplicatePercent: number;
  riskPercent: number;
  noIntentPercent: number;
  avgScore: number;
  recommendation: string;
  explanation: string;
  patterns: string[];
  improvements: string[];
};

export type SourceReport = {
  generatedAt: string;
  rows: TrafficSourceQuality[];
};
