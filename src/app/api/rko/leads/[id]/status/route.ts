import { NextResponse } from "next/server";
import { updateLeadStatusServer } from "@/lib/rko/server-store";
import type { LeadStatus } from "@/lib/rko/types";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json() as { status?: LeadStatus };
  if (!body.status) return NextResponse.json({ error: "status is required" }, { status: 400 });
  const lead = await updateLeadStatusServer(id, body.status);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  return NextResponse.json({ lead });
}
