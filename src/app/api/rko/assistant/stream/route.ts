import { NextResponse } from "next/server";
import { getRkoAiProvider } from "@/lib/ai/provider";
import { extractLeadDraft, safeDialog } from "@/lib/rko/lead-extractor";
import { scoreLead } from "@/lib/rko/scoring";
import { listLeads } from "@/lib/rko/server-store";
import type { DialogMessage, LeadDraft } from "@/lib/rko/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AssistantStreamRequest = {
  sessionId?: string;
  messages?: Array<Partial<DialogMessage>>;
  currentLeadDraft?: Partial<LeadDraft>;
  source?: string;
  campaign?: string;
};

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  let body: AssistantStreamRequest;
  try {
    body = await request.json() as AssistantStreamRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId = body.sessionId || `session_${Date.now()}`;
  const messages = safeDialog(body.messages ?? []);
  const extracted = extractLeadDraft({
    messages,
    currentLeadDraft: body.currentLeadDraft,
    source: body.source,
    campaign: body.campaign,
    sessionId,
  });
  const provider = getRkoAiProvider();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sse(event, data)));
      };

      try {
        send("processing", { step: "received", label: "Получили сообщение" });
        const knownLeads = await listLeads();
        send("processing", { step: "extracted", label: "Извлекли данные" });

        const score = scoreLead(extracted.draft, knownLeads);
        send("processing", { step: "scored", label: "Посчитали score" });

        const insight = await provider.enrichLead({
          ...extracted.draft,
          id: `preview_${sessionId}`,
          createdAt: new Date().toISOString(),
          score: score.score,
          leadClass: score.leadClass,
          riskFlags: score.riskFlags,
          recommendedRoute: "",
          nextAction: "",
          managerSummary: "",
          status: "new",
        }, knownLeads);

        send("draft", {
          draft: extracted.draft,
          score,
          insight,
          missingFields: extracted.missingFields,
          notes: extracted.notes,
          providerMode: provider.mode,
        });
        send("processing", { step: "summary", label: "Сформировали выжимку" });

        for await (const chunk of provider.streamAssistantReply({
          sessionId,
          messages,
          draft: extracted.draft,
          score,
          insight,
          missingFields: extracted.missingFields,
          notes: extracted.notes,
        })) {
          send("delta", { text: chunk });
        }

        send("done", {
          draft: extracted.draft,
          score,
          insight,
          missingFields: extracted.missingFields,
          notes: extracted.notes,
          providerMode: provider.mode,
        });
      } catch (error) {
        send("error", { message: error instanceof Error ? error.message : "Assistant stream failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
