"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type VcVoiceSummaryProps = {
  summary: string;
  leadClass?: string;
  score?: number;
  nextAction?: string;
  compact?: boolean;
};

function buildVoiceText(summary: string, leadClass?: string, score?: number, nextAction?: string) {
  const parts = [
    leadClass ? `Лид класса ${leadClass}` : "Лид обработан",
    typeof score === "number" ? `score ${score}` : "",
    summary,
    nextAction ? `Следующий шаг: ${nextAction}` : "",
  ].filter(Boolean);

  return parts.join(". ").replace(/\s+/g, " ").trim();
}

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

export function VcVoiceSummary({
  summary,
  leadClass,
  score,
  nextAction,
  compact = false,
}: VcVoiceSummaryProps) {
  const [isSupported, setIsSupported] = useState<boolean | null>(() => (typeof window === "undefined" ? null : hasSpeechSynthesis()));
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const transcript = useMemo(
    () => buildVoiceText(summary || "Текстовая выжимка пока не готова.", leadClass, score, nextAction),
    [leadClass, nextAction, score, summary],
  );

  useEffect(() => {
    if (!hasSpeechSynthesis()) return;

    const synth = window.speechSynthesis;
    const loadVoices = () => setVoices(synth.getVoices());

    loadVoices();
    synth.addEventListener("voiceschanged", loadVoices);

    return () => {
      synth.removeEventListener("voiceschanged", loadVoices);
      if (utteranceRef.current) synth.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setSpeaking(false);
  }, []);

  const play = useCallback(() => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      typeof SpeechSynthesisUtterance === "undefined"
    ) {
      setIsSupported(false);
      return;
    }

    const synth = window.speechSynthesis;
    const availableVoices = voices.length ? voices : synth.getVoices();
    const utterance = new SpeechSynthesisUtterance(transcript);
    const russianVoice = findRussianVoice(availableVoices);

    synth.cancel();
    utterance.voice = russianVoice ?? null;
    utterance.lang = russianVoice?.lang ?? "ru-RU";
    utterance.rate = 0.94;
    utterance.pitch = 0.96;
    utterance.onend = () => {
      utteranceRef.current = null;
      setSpeaking(false);
    };
    utterance.onerror = () => {
      utteranceRef.current = null;
      setSpeaking(false);
    };

    utteranceRef.current = utterance;
    setSpeaking(true);
    synth.speak(utterance);
  }, [transcript, voices]);

  return (
    <section
      className={`min-w-0 rounded-xl border border-signal/18 bg-black/28 shadow-[0_24px_90px_rgba(0,0,0,0.24),inset_0_1px_0_rgb(var(--signal-rgb)/0.08)] backdrop-blur-xl ${
        compact ? "p-4" : "p-5"
      }`}
      data-voice-summary={speaking ? "speaking" : "ready"}
    >
      <style>{`
        @keyframes vcVoiceWave {
          0%, 100% { transform: scaleY(0.36); opacity: 0.45; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-signal-bright">
            <Volume2 className="size-4" aria-hidden="true" />
            <p className="font-mono text-[11px] uppercase tracking-[0.18em]">голосовая выжимка</p>
          </div>
          <h3 className={`${compact ? "mt-1 text-lg" : "mt-2 text-xl"} font-semibold leading-tight text-white`}>
            Голосовая выжимка менеджеру
          </h3>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {typeof score === "number" ? (
            <span className="rounded-md border border-signal/18 bg-signal/8 px-2 py-1 font-mono text-xs text-signal-bright">
              {leadClass ? `${leadClass} · ` : ""}{score}
            </span>
          ) : leadClass ? (
            <span className="rounded-md border border-signal/18 bg-signal/8 px-2 py-1 font-mono text-xs text-signal-bright">
              {leadClass}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex items-end gap-1.5" aria-hidden="true">
        {[14, 22, 30, 18, 26, 34, 20, 28].map((height, index) => (
          <span
            key={`${height}-${index}`}
            className={`w-1.5 origin-bottom rounded-full bg-signal-bright/80 ${
              speaking ? "[animation:vcVoiceWave_0.82s_ease-in-out_infinite]" : "opacity-35"
            }`}
            style={{ height, animationDelay: `${index * 70}ms` }}
          />
        ))}
      </div>

      {isSupported === false ? (
        <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2 text-sm leading-6 text-slate-300">
          Голос недоступен в этом браузере — показываем текстовую выжимку.
        </p>
      ) : null}

      <p className={`${compact ? "line-clamp-4" : ""} mt-4 text-sm leading-6 text-slate-300`}>
        {transcript}
      </p>

      {nextAction ? (
        <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2 text-sm leading-6 text-slate-200">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-signal/75">next action</span>
          <br />
          {nextAction}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={speaking || !transcript}
          onClick={play}
          data-voice-play
          className="bg-signal text-slate-950 hover:bg-signal-bright"
        >
          <Play className="size-4" />
          Play
        </Button>
        {speaking ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={stop}
            data-voice-stop
            className="border-white/10 bg-white/[0.055] text-white hover:bg-white/10"
          >
            <Pause className="size-4" />
            Stop
          </Button>
        ) : null}
      </div>
    </section>
  );
}
