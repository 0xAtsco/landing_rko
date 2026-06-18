import { NextResponse } from "next/server";
import type { LeadTone, ResponseStyle } from "@/components/demo/vc-command/vc-ai-dialog-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TtsRequest = {
  text?: string;
  tone?: LeadTone;
  style?: ResponseStyle;
};

const MAX_TTS_LENGTH = 800;

function hasElevenLabsEnv() {
  return Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID);
}

export async function GET() {
  return NextResponse.json({
    provider: hasElevenLabsEnv() ? "elevenlabs" : "browser",
    model: process.env.ELEVENLABS_MODEL_ID || "eleven_flash_v2_5",
  });
}

function sanitizeText(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .replace(/@[a-zA-Z0-9_]{4,32}/g, "@demo_contact")
    .replace(/(?:\+7|8)?[\s(.-]*\d{3}[\s).-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}/g, "[demo_contact]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TTS_LENGTH);
}

function voiceSettingsFor(tone?: LeadTone, style?: ResponseStyle) {
  if (tone === "confused" || style === "warm_explainer") {
    return { stability: 0.62, similarity_boost: 0.82, use_speaker_boost: true };
  }
  if (tone === "skeptical" || style === "expert_confident") {
    return { stability: 0.7, similarity_boost: 0.78, use_speaker_boost: true };
  }
  if (tone === "high_intent" || tone === "rushed" || style === "short_direct") {
    return { stability: 0.5, similarity_boost: 0.8, use_speaker_boost: true };
  }
  if (tone === "bonus_hunter" || style === "risk_filter") {
    return { stability: 0.75, similarity_boost: 0.74, use_speaker_boost: false };
  }
  return { stability: 0.58, similarity_boost: 0.8, use_speaker_boost: true };
}

export async function POST(request: Request) {
  let body: TtsRequest;

  try {
    body = (await request.json()) as TtsRequest;
  } catch {
    return NextResponse.json({ ok: false, fallback: "browser", reason: "invalid_json" }, { status: 400 });
  }

  const text = sanitizeText(body.text);
  if (!text) {
    return NextResponse.json({ ok: false, fallback: "text", reason: "empty_text" }, { status: 400 });
  }

  // Server-only env. Never expose these values to the client.
  // ELEVENLABS_MODEL_ID defaults to the documented Flash v2.5 model id: eleven_flash_v2_5.
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_flash_v2_5";

  if (!apiKey || !voiceId) {
    return NextResponse.json({ ok: false, fallback: "browser", reason: "missing_env" });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "audio/mpeg",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: voiceSettingsFor(body.tone, body.style),
        }),
      },
    );

    if (!response.ok) {
      return NextResponse.json({ ok: false, fallback: "browser", reason: "provider_error" }, { status: 200 });
    }

    const audio = await response.arrayBuffer();
    return new Response(audio, {
      headers: {
        "content-type": response.headers.get("content-type") || "audio/mpeg",
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, fallback: "browser", reason: "network_error" });
  }
}
