import { NextResponse } from "next/server";
import { addLeadAction } from "@/lib/rko/server-store";
import type { LeadActionType } from "@/lib/rko/types";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json() as { type?: LeadActionType; note?: string; managerName?: string };
  if (!body.type) return NextResponse.json({ error: "type is required" }, { status: 400 });
  const result = await addLeadAction(id, { type: body.type, note: body.note, managerName: body.managerName });
  if (!result) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  return NextResponse.json(result, { status: 201 });
}
