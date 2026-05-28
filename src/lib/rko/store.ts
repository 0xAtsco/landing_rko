"use client";

import { useSyncExternalStore } from "react";
import type { Lead, LeadActionType, LeadDraft, LeadStatus } from "./types";

let cachedLeads: Lead[] | null = null;
let inFlight: Promise<Lead[]> | null = null;
const listeners = new Set<() => void>();
const emptyLeads: Lead[] = [];

function emit() {
  listeners.forEach((listener) => listener());
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) throw new Error(`RKO API request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export function readLeads(): Lead[] {
  return cachedLeads ?? [];
}

export async function refreshLeads() {
  if (inFlight) return inFlight;
  inFlight = requestJson<{ leads: Lead[] }>("/api/rko/leads")
    .then((data) => {
      cachedLeads = data.leads;
      emit();
      return data.leads;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

export async function addLead(draft: LeadDraft) {
  const data = await requestJson<{ lead: Lead; duplicateLeadId?: string }>("/api/rko/leads", {
    method: "POST",
    body: JSON.stringify(draft),
  });
  cachedLeads = [data.lead, ...(cachedLeads ?? [])];
  emit();
  return data.lead;
}

export async function replaceWithSeed(count = 100) {
  const data = await requestJson<{ leads: Lead[]; count: number }>("/api/rko/demo/seed", {
    method: "POST",
    body: JSON.stringify({ count }),
  });
  cachedLeads = data.leads;
  emit();
  return data.leads;
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  const data = await requestJson<{ lead: Lead }>(`/api/rko/leads/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  cachedLeads = (cachedLeads ?? []).map((lead) => (lead.id === id ? data.lead : lead));
  emit();
  return cachedLeads;
}

export async function addManagerAction(id: string, type: LeadActionType, note?: string) {
  const data = await requestJson<{ lead: Lead }>(`/api/rko/leads/${encodeURIComponent(id)}/action`, {
    method: "POST",
    body: JSON.stringify({ type, note }),
  });
  cachedLeads = (cachedLeads ?? []).map((lead) => (lead.id === id ? data.lead : lead));
  emit();
  return cachedLeads;
}

let pollTimer: ReturnType<typeof setInterval> | null = null;

function subscribe(callback: () => void) {
  listeners.add(callback);
  if (!cachedLeads) void refreshLeads();
  // One shared poll for all subscribers (no per-subscription interval leak).
  if (pollTimer === null) {
    pollTimer = setInterval(() => {
      void refreshLeads();
    }, 5000);
  }
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && pollTimer !== null) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };
}

function getSnapshot() {
  return cachedLeads ?? emptyLeads;
}

function getServerSnapshot() {
  return emptyLeads;
}

export function useRkoLeads() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
