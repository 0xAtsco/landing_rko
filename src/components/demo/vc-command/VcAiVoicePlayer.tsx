"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Subtitles, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LeadTone, ResponseStyle, VcVoiceProvider } from "./vc-ai-dialog-types";

type VcAiVoicePlayerProps = {
  text: string;
  tone: LeadTone;
  style: ResponseStyle;
  enabled: boolean;
  onProviderChange?: (provider: VcVoiceProvider) => void;
};

type VoiceStatus = "idle" | "loading" | "playing" | "fallback" | "text";

function findRussianVoice(voices: SpeechSynthesisVoice[]) {
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith("ru")) ??
    voices.find((voice) => /russian|рус/i.test(voice.name))
  );
}

function hasSpeechSynthesis() {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
}

export function VcAiVoicePlayer({ text, tone, style, enabled, onProviderChange }: VcAiVoicePlayerProps) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const transcript = useMemo(() => text.trim().replace(/\s+/g, " ").slice(0, 800), [text]);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    if (hasSpeechSynthesis()) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    setStatus("idle");
  }, []);

  useEffect(() => {
    if (!hasSpeechSynthesis()) return;

    const synth = window.speechSynthesis;
    const loadVoices = () => setVoices(synth.getVoices());

    loadVoices();
    synth.addEventListener("voiceschanged", loadVoices);

    return () => {
      synth.removeEventListener("voiceschanged", loadVoices);
      stop();
    };
  }, [stop]);

  const playBrowserVoice = useCallback(() => {
    if (!hasSpeechSynthesis()) {
      setStatus("text");
      onProviderChange?.("transcript");
      return;
    }

    const synth = window.speechSynthesis;
    const availableVoices = voices.length ? voices : synth.getVoices();
    const utterance = new SpeechSynthesisUtterance(transcript);
    const russianVoice = findRussianVoice(availableVoices);

    synth.cancel();
    utterance.voice = russianVoice ?? null;
    utterance.lang = russianVoice?.lang ?? "ru-RU";
    utterance.rate = tone === "confused" ? 0.88 : tone === "rushed" ? 1.02 : 0.94;
    utterance.pitch = style === "risk_filter" ? 0.9 : 0.96;
    utterance.onend = () => {
      utteranceRef.current = null;
      setStatus("idle");
    };
    utterance.onerror = () => {
      utteranceRef.current = null;
      setStatus("text");
      onProviderChange?.("transcript");
    };

    utteranceRef.current = utterance;
    setStatus("fallback");
    onProviderChange?.("browser");
    synth.speak(utterance);
  }, [onProviderChange, style, tone, transcript, voices]);

  const play = useCallback(async () => {
    if (!transcript) return;
    if (!enabled) {
      setStatus("text");
      onProviderChange?.("transcript");
      return;
    }

    stop();
    setStatus("loading");

    try {
      const response = await fetch("/api/vc-command/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: transcript, tone, style }),
      });
      const contentType = response.headers.get("content-type") ?? "";

      if (response.ok && contentType.includes("audio")) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audioUrlRef.current = url;
        audio.onended = () => stop();
        audio.onerror = () => {
          stop();
          playBrowserVoice();
        };
        setStatus("playing");
        onProviderChange?.("elevenlabs");
        await audio.play();
        return;
      }

      playBrowserVoice();
    } catch {
      playBrowserVoice();
    }
  }, [enabled, onProviderChange, playBrowserVoice, stop, style, tone, transcript]);

  const label = status === "loading" ? "Голос..." : status === "playing" || status === "fallback" ? "Стоп" : "Голос";
  const active = status === "playing" || status === "fallback";

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!transcript || status === "loading"}
          onClick={active ? stop : () => void play()}
          data-ai-voice-play
          className="bg-signal text-slate-950 hover:bg-signal-bright"
        >
          {active ? <Pause className="size-4" /> : <Play className="size-4" />}
          {label}
        </Button>
        <span className="inline-flex min-h-8 items-center gap-2 rounded-md border border-white/10 bg-white/[0.045] px-2.5 text-xs leading-5 text-slate-400">
          {status === "playing" ? <Volume2 className="size-3.5 text-signal-bright" /> : <Subtitles className="size-3.5" />}
          {status === "fallback"
            ? "browser voice"
            : status === "text"
              ? "только текст"
              : status === "playing"
                ? "ElevenLabs"
                : enabled
                  ? "голос готов"
                  : "голос выкл"}
        </span>
      </div>
    </div>
  );
}
