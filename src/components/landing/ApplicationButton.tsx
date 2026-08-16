"use client";

import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { TELEGRAM_URL } from "@/lib/content";
import { cn } from "@/lib/utils";

type ApplicationButtonProps = {
  tariff: string;
  label?: string;
  className?: string;
  compact?: boolean;
};

type Contact = { name: string; telegram: string };
type ApplicationStep = "contact" | "details" | "submitted";

const readiness = Array.from({ length: 10 }, (_, index) => index + 1);
const telegramPattern = /^@[A-Za-z0-9_]{5,32}$/;

export function ApplicationButton({ tariff, label = "Оставить заявку", className, compact = false }: ApplicationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<ApplicationStep>("contact");
  const [contact, setContact] = useState<Contact>({ name: "", telegram: "" });
  const [telegramError, setTelegramError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const leadId = useRef<string | null>(null);

  function getLeadId() {
    if (!leadId.current) {
      leadId.current = crypto.randomUUID();
    }
    return leadId.current;
  }

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const telegram = String(data.get("telegram") || "").trim();
    if (!telegramPattern.test(telegram)) {
      setTelegramError("Укажи Telegram в формате @username: 5–32 символа, латиница, цифры или _.");
      return;
    }
    setTelegramError("");
    setSubmitError("");
    setIsSubmitting(true);
    const nextContact = { name: String(data.get("name") || "").trim(), telegram };

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "contact",
          leadId: getLeadId(),
          tariff,
          ...nextContact,
        }),
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(result?.error || "Не удалось сохранить контакт. Попробуй ещё раз.");
      }
      setContact(nextContact);
      setStep("details");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Не удалось сохранить контакт. Попробуй ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "details",
          leadId: getLeadId(),
          tariff,
          name: contact.name,
          telegram: contact.telegram,
          income: String(data.get("income") || "").trim(),
          readiness: Number(data.get("readiness")),
        }),
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(result?.error || "Не удалось отправить заявку. Попробуй ещё раз.");
      }

      setStep("submitted");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Не удалось отправить заявку. Попробуй ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function close() {
    setIsOpen(false);
    setStep("contact");
    setContact({ name: "", telegram: "" });
    setTelegramError("");
    setSubmitError("");
    setIsSubmitting(false);
    leadId.current = null;
  }

  return (
    <>
      <button
        type="button"
        data-analytics="application_open"
        onClick={() => setIsOpen(true)}
        className={cn(
          compact
            ? "group flex min-h-24 items-center justify-between gap-4 rounded-lg border border-signal/28 bg-signal/10 px-5 py-4 text-left text-[#f4ffff] transition hover:bg-signal/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-strong"
            : "group relative inline-flex min-h-12 shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-lg bg-signal-strong px-5 text-sm font-semibold text-[var(--surface-base)] shadow-[0_0_34px_rgb(var(--signal-rgb)/0.22),inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:bg-[var(--signal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-strong motion-safe:hover:-translate-y-0.5 sm:px-6",
          className,
        )}
      >
        {compact ? (
          <>
            <span>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-signal-bright">{tariff}</span>
              <span className="mt-1 block text-lg font-semibold">{label}</span>
            </span>
            <ArrowRight className="size-7 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </>
        ) : (
          <>
            <span className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal-bright/25 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-60" />
            <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/45 to-transparent transition duration-700 group-hover:translate-x-[120%]" />
            <span className="relative z-10">{label}</span>
            <ArrowRight className="relative z-10 size-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
          </>
        )}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="application-title">
          <div className="relative w-full max-w-xl rounded-xl border border-signal/28 bg-[var(--surface-1)] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.58)] sm:p-7">
            <button type="button" onClick={close} className="absolute right-4 top-4 grid size-10 place-items-center rounded-md text-[#d9eeee] transition hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-strong" aria-label="Закрыть форму">
              <X className="size-5" aria-hidden="true" />
            </button>

            {step === "contact" ? (
              <form onSubmit={submitContact}>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-signal-bright">Шаг 1 из 2</p>
                <h2 id="application-title" className="mt-3 pr-8 text-3xl font-semibold leading-tight text-[#f4ffff]">Как к тебе обращаться?</h2>
                <p className="mt-2 text-sm leading-6 text-[#93a3a3]">Оставь контакт, чтобы Андрей мог ответить на заявку.</p>
                <div className="mt-6 grid gap-4">
                  <label className="grid gap-2 text-sm font-semibold text-[#d9eeee]">Имя
                    <input name="name" required autoComplete="name" defaultValue={contact.name} className="min-h-12 rounded-lg border border-signal/20 bg-black/22 px-4 text-base font-normal text-[#f4ffff] outline-none transition placeholder:text-[#748484] focus:border-signal focus:ring-2 focus:ring-signal/25" placeholder="Как к тебе обращаться" />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-[#d9eeee]">Telegram
                    <input name="telegram" required autoComplete="username" defaultValue={contact.telegram} onChange={() => setTelegramError("")} aria-invalid={Boolean(telegramError)} aria-describedby={telegramError ? "telegram-error" : undefined} className={cn("min-h-12 rounded-lg border bg-black/22 px-4 text-base font-normal text-[#f4ffff] outline-none transition placeholder:text-[#748484] focus:ring-2", telegramError ? "border-red-400/80 focus:border-red-400 focus:ring-red-400/25" : "border-signal/20 focus:border-signal focus:ring-signal/25")} placeholder="@username" />
                    {telegramError ? <span id="telegram-error" className="text-xs font-normal leading-5 text-red-300">{telegramError}</span> : null}
                  </label>
                </div>
                {submitError ? <p className="text-sm leading-6 text-red-300" role="alert">{submitError}</p> : null}
                <button type="submit" disabled={isSubmitting} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-signal-strong px-5 text-sm font-semibold text-[var(--surface-base)] shadow-[0_0_34px_rgb(var(--signal-rgb)/0.22),inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:bg-[var(--signal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-strong disabled:cursor-wait disabled:opacity-75">{isSubmitting ? "Сохраняем контакт…" : "Продолжить"} <ArrowRight className="size-4" aria-hidden="true" /></button>
              </form>
            ) : step === "details" ? (
              <form onSubmit={submitApplication}>
                <div className="flex items-center gap-3 pr-8">
                  <button type="button" onClick={() => setStep("contact")} className="grid size-9 shrink-0 place-items-center rounded-md border border-signal/20 text-[#d9eeee] transition hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-strong" aria-label="Вернуться к контактам"><ArrowLeft className="size-4" aria-hidden="true" /></button>
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-signal-bright">Шаг 2 из 2</p>
                </div>
                <h2 id="application-title" className="mt-3 text-3xl font-semibold leading-tight text-[#f4ffff]">Пара вопросов перед заявкой</h2>
                <div className="mt-6 grid gap-4">
                  <label className="grid gap-2 text-sm font-semibold text-[#d9eeee]">Какой у тебя доход за прошлый месяц?
                    <input name="income" required inputMode="numeric" autoComplete="off" className="min-h-12 rounded-lg border border-signal/20 bg-black/22 px-4 text-base font-normal text-[#f4ffff] outline-none transition placeholder:text-[#748484] focus:border-signal focus:ring-2 focus:ring-signal/25" placeholder="Например, 80 000 ₽" />
                  </label>
                  <fieldset className="grid gap-3">
                    <legend className="text-sm font-semibold text-[#d9eeee]">Насколько готов войти в поток?</legend>
                    <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                      {readiness.map((value) => (
                        <label key={value} className="cursor-pointer">
                          <input className="peer sr-only" type="radio" name="readiness" value={value} required />
                          <span className="grid min-h-11 place-items-center rounded-md border border-signal/20 bg-black/22 text-sm text-[#d9eeee] transition peer-checked:border-signal peer-checked:bg-signal peer-checked:text-[var(--surface-base)] hover:border-signal/60">{value}</span>
                        </label>
                      ))}
                    </div>
                    <p className="flex justify-between text-xs text-[#93a3a3]"><span>1 — смотрю</span><span>5 — рассматриваю</span><span>10 — готов оплатить</span></p>
                  </fieldset>
                </div>
                {submitError ? <p className="text-sm leading-6 text-red-300" role="alert">{submitError}</p> : null}
                <button type="submit" disabled={isSubmitting} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-signal-strong px-5 text-sm font-semibold text-[var(--surface-base)] shadow-[0_0_34px_rgb(var(--signal-rgb)/0.22),inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:bg-[var(--signal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-strong disabled:cursor-wait disabled:opacity-75">{isSubmitting ? "Отправляем заявку…" : "Отправить заявку Андрею"} <ArrowRight className="size-4" aria-hidden="true" /></button>
              </form>
            ) : (
              <div className="pr-8">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-signal-bright">Заявка отправлена</p>
                <h2 id="application-title" className="mt-3 text-3xl font-semibold leading-tight text-[#f4ffff]">Заявка отправлена</h2>
                <p className="mt-3 max-w-lg text-base leading-7 text-[#d9eeee]">Также можешь сам написать Андрею в личные сообщения или перейти к оплате.</p>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <a href={TELEGRAM_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-signal/28 bg-signal/10 px-5 text-sm font-semibold text-[#f4ffff] transition hover:bg-signal/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-strong">Написать Андрею</a>
                  <button type="button" disabled title="Подключим после выбора платёжного сервиса" className="inline-flex min-h-12 cursor-not-allowed items-center justify-center rounded-lg bg-[#607070] px-5 text-sm font-semibold text-black/65">Оплатить</button>
                </div>
                <p className="mt-3 text-xs leading-5 text-[#93a3a3]">Кнопка оплаты станет активной после подключения платёжной страницы.</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
