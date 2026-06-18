import { NextResponse } from "next/server";
import { createLead } from "@/lib/rko/server-store";
import type { LeadDraft } from "@/lib/rko/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json() as LeadDraft & { telegramUserId?: string };
  const result = await createLead({
    ...body,
    creative: body.creative || "telegram_bot_intake",
  });
  return NextResponse.json({ ...result, intake: "telegram" }, { status: 201 });
}
