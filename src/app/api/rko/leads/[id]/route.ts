import { NextResponse } from "next/server";
import { getLead } from "@/lib/rko/server-store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = await getLead(id);
  if (!result.lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  return NextResponse.json(result);
}
