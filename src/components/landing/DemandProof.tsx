import Image from "next/image";
import { ImageIcon, Maximize2, MessageCircle, X } from "lucide-react";
import { demandSection, type ChatRequest } from "@/lib/content";
import { cn } from "@/lib/utils";
import { SectionReveal } from "./SectionReveal";
import { SectionHeading } from "./SectionPrimitives";

export function DemandProof() {
  return (
    <SectionReveal id="demand" className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20">
      <div aria-hidden="true" className="absolute inset-x-0 top-10 h-64 bg-[radial-gradient(circle_at_28%_20%,rgb(var(--signal-rgb)/0.12),transparent_32rem)]" />
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 grid gap-5 lg:grid-cols-[0.9fr_0.55fr] lg:items-end">
          <SectionHeading {...demandSection.heading} />
          <div className="rounded-lg border border-signal/16 bg-[var(--surface-2)]/78 p-4">
            <div className="mb-3 flex items-center gap-2 text-signal-bright">
              <MessageCircle className="size-4" aria-hidden="true" />
              <span className="font-mono text-[11px] uppercase tracking-[0.16em]">Telegram-запросы</span>
            </div>
            <p className="text-sm leading-6 text-[#93a3a3]">
              Вайбкодинг нужен, чтобы быстро дать человеку понятный результат, а не объяснять теорию.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {demandSection.chatRequests.map((request, index) => {
            const openPopoverProps = { popoverTarget: request.id };

            return (
              <div key={request.id} className={cn(index % 3 === 1 && "xl:mt-8", index % 3 === 2 && "xl:mt-4")}>
                <button
                  type="button"
                  {...openPopoverProps}
                  className="group relative w-full overflow-hidden rounded-xl border border-signal/16 bg-[var(--surface-2)]/86 p-3 text-left shadow-[0_18px_70px_rgba(0,0,0,0.26),inset_0_1px_0_rgb(var(--signal-rgb)/0.06)] transition hover:-translate-y-0.5 hover:border-signal/36 hover:bg-[var(--surface-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/45"
                  aria-label={`Открыть запрос ${index + 1}`}
                >
                  <div aria-hidden="true" className="tiffany-dot-field absolute inset-0 opacity-22" />
                  <div className="relative z-10">
                    <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-signal/12 bg-black/18 px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="grid size-8 shrink-0 place-items-center rounded-md border border-signal/20 bg-signal/10 text-signal-bright">
                          <ImageIcon className="size-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal/80">скрин из чата</p>
                          <p className="truncate text-sm font-semibold text-[#f4ffff]">запрос #{index + 1}</p>
                        </div>
                      </div>
                      <Maximize2 className="size-4 shrink-0 text-signal-bright opacity-70 transition group-hover:opacity-100" aria-hidden="true" />
                    </div>

                    <div className="overflow-hidden rounded-lg border border-white/10">
                      <Image
                        src={request.screenshot.src}
                        width={request.screenshot.width}
                        height={request.screenshot.height}
                        alt={request.screenshot.alt}
                        sizes="(min-width: 1280px) 360px, (min-width: 768px) 50vw, 100vw"
                        unoptimized
                        fetchPriority="low"
                        className="h-auto w-full"
                      />
                    </div>

                    <span className="sr-only">{request.text}</span>
                  </div>
                </button>
                <RequestDialog request={request} />
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          {demandSection.afterScreens.map((text) => (
            <div
              key={text}
              className="relative overflow-hidden rounded-lg border border-signal/18 bg-[var(--surface-2)]/84 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.22),inset_0_1px_0_rgb(var(--signal-rgb)/0.06)]"
            >
              <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-signal/70" />
              <p className="text-pretty text-lg font-semibold leading-8 text-[#f4ffff] sm:text-xl sm:leading-9">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}

function RequestDialog({ request }: { request: ChatRequest }) {
  const closePopoverProps = { popoverTarget: request.id, popoverTargetAction: "hide" as const };
  const popoverProps = { popover: "auto" as const };

  return (
    <div
      id={request.id}
      {...popoverProps}
      role="dialog"
      aria-modal="true"
      aria-label="Запрос из чата"
      className="landing-popover w-[min(calc(100vw-1.5rem),56rem)] border-0 bg-transparent p-0 text-white"
    >
      <div className="relative w-full max-w-4xl overflow-hidden rounded-xl border border-signal/24 bg-[var(--surface-1)] shadow-[0_30px_120px_rgba(0,0,0,0.62)]">
        <div className="flex items-start justify-between gap-4 border-b border-signal/14 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal-bright">Telegram-запрос</p>
            <h3 className="mt-1 text-xl font-semibold leading-tight text-[#f4ffff]">Запрос из чата</h3>
          </div>
          <button
            type="button"
            {...closePopoverProps}
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.055] text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/45"
            aria-label="Закрыть"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[78svh] overflow-auto p-4 sm:p-6">
          <div className="rounded-xl border border-signal/16 bg-[var(--surface-2)]/88 p-3 shadow-[inset_0_0_34px_rgb(var(--signal-rgb)/0.06)] sm:p-4">
            <div className="overflow-hidden rounded-lg border border-white/10">
              <Image
                src={request.screenshot.src}
                width={request.screenshot.width}
                height={request.screenshot.height}
                alt={request.screenshot.alt}
                sizes="(min-width: 1024px) 900px, 100vw"
                loading="lazy"
                unoptimized
                fetchPriority="low"
                className="h-auto w-full"
              />
            </div>
            <span className="sr-only">{request.text}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
