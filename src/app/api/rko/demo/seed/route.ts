import { NextResponse } from "next/server";
import { seedDemoLeads } from "@/lib/rko/server-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let count = 100;
  try {
    const body = await request.json() as { count?: number };
    if (typeof body.count === "number") count = Math.min(120, Math.max(80, Math.round(body.count)));
  } catch {
    count = 100;
  }
  const leads = await seedDemoLeads(count);
  return NextResponse.json({ leads, count: leads.length });
}
