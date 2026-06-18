import { NextResponse } from "next/server";
import { createLead, listLeads } from "@/lib/rko/server-store";
import type { LeadDraft } from "@/lib/rko/types";

export const runtime = "nodejs";

export async function GET() {
  const leads = await listLeads();
  return NextResponse.json({ leads });
}

export async function POST(request: Request) {
  const draft = await request.json() as LeadDraft;
  const result = await createLead(draft);
  return NextResponse.json(result, { status: 201 });
}
