import { NextResponse } from "next/server";
import { getTrafficReport } from "@/lib/rko/server-store";
import { trafficSummary } from "@/lib/rko/traffic";
import { listLeads } from "@/lib/rko/server-store";

export const runtime = "nodejs";

export async function GET() {
  const [report, leads] = await Promise.all([getTrafficReport(), listLeads()]);
  return NextResponse.json({ ...report, summary: trafficSummary(leads) });
}
