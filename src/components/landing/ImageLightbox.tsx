import Image from "next/image";
import { Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type LightboxItem = Readonly<{
  title: string;
  source?: string;
  message?: string;
  meta?: string;
  caption?: string;
  src?: string;
  alt?: string;
  tags?: readonly string[];
  featured?: boolean;
}>;

type ImageLightboxProps = {
  items: readonly LightboxItem[];
  className?: string;
  gridClassName?: string;
  cardClassName?: string;
  idPrefix?: string;
};

export function ImageLightbox({ items, className, gridClassName, cardClassName, idPrefix = "lightbox" }: ImageLightboxProps) {
  return (
    <div className={className}>
      <div className={cn("grid gap-4", gridClassName)}>
        {items.map((item, index) => {
          const popoverId = `${idPrefix}-${index}`;
          const openPopoverProps = { popoverTarget: popoverId };

          return (
            <div key={`${item.title}-${index}`} className={cn(item.featured && "md:col-span-2")}>
              <button
                type="button"
                {...openPopoverProps}
                className={cn(
                  "group relative min-h-[260px] w-full overflow-hidden rounded-xl border border-signal/16 bg-[var(--surface-2)]/86 p-3 text-left shadow-[0_18px_70px_rgba(0,0,0,0.26),inset_0_1px_0_rgb(var(--signal-rgb)/0.06)] transition hover:-translate-y-0.5 hover:border-signal/36 hover:shadow-[0_24px_86px_rgb(var(--signal-rgb)/0.08)] focus-visible:border-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/45",
                  item.featured && "md:min-h-[340px]",
                  cardClassName,
                )}
                aria-label={`Открыть ${item.title} на весь экран`}
              >
                <LightboxPreview item={item} featured={item.featured} />
              </button>
              <LightboxDialog item={item} id={popoverId} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LightboxDialog({ item, id }: { item: LightboxItem; id: string }) {
  const closePopoverProps = { popoverTarget: id, popoverTargetAction: "hide" as const };
  const popoverProps = { popover: "auto" as const };

  return (
    <div
      id={id}
      {...popoverProps}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="landing-popover w-[min(calc(100vw-1.5rem),72rem)] border-0 bg-transparent p-0 text-white"
    >
      <div className="relative w-full overflow-hidden rounded-xl border border-signal/24 bg-[var(--surface-1)] shadow-[0_30px_120px_rgba(0,0,0,0.62)]">
        <div className="flex items-start justify-between gap-4 border-b border-signal/14 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal-bright">
              {item.source || "fullscreen"}
            </p>
            <h3 className="mt-1 text-xl font-semibold leading-tight text-[#f4ffff] sm:text-2xl">{item.title}</h3>
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

        <div className="max-h-[78svh] overflow-auto p-4 sm:p-5">
          {item.src ? (
            <figure>
              <div className="relative min-h-[62svh] overflow-hidden rounded-lg border border-signal/16 bg-black/28">
                <Image
                  src={item.src}
                  alt={item.alt || item.title}
                  fill
                  sizes="100vw"
                  loading="eager"
                  fetchPriority="high"
                  unoptimized
                  className="object-contain p-2"
                />
              </div>
              {item.caption ? (
                <figcaption className="mt-3 text-sm leading-6 text-[#93a3a3]">{item.caption}</figcaption>
              ) : null}
            </figure>
          ) : (
            <RequestPanel item={item} large />
          )}
        </div>
      </div>
    </div>
  );
}

function LightboxPreview({ item, featured }: { item: LightboxItem; featured?: boolean }) {
  return (
    <div className="relative z-10 flex h-full min-h-[inherit] flex-col">
      <div aria-hidden="true" className="tiffany-dot-field absolute inset-0 opacity-35" />
      <div className="relative z-10 mb-3 flex items-center justify-between gap-3 rounded-lg border border-signal/14 bg-black/18 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate font-mono text-[11px] uppercase tracking-[0.16em] text-signal/80">
            {item.source || "screen"}
          </p>
          <h3 className="mt-1 truncate text-sm font-semibold text-[#f4ffff]">{item.title}</h3>
        </div>
        <span className="grid size-8 shrink-0 place-items-center rounded-md border border-signal/20 bg-signal/10 text-signal-bright">
          <Maximize2 className="size-4" aria-hidden="true" />
        </span>
      </div>

      {item.src ? (
        <figure className="relative z-10 flex flex-1 flex-col overflow-hidden rounded-lg border border-signal/16 bg-black/28">
          <div className={cn("relative flex-1 min-h-[210px]", featured && "min-h-[320px]")}>
            <Image
              src={item.src}
              alt={item.alt || item.title}
              fill
              sizes={featured ? "(min-width: 768px) 720px, 100vw" : "(min-width: 768px) 360px, 100vw"}
              loading="eager"
              fetchPriority="high"
              unoptimized
              className="object-contain p-2"
            />
          </div>
          <figcaption className="border-t border-signal/12 bg-[var(--surface-1)]/72 px-3 py-2 text-xs leading-5 text-[#93a3a3]">
            {item.caption || item.meta}
          </figcaption>
        </figure>
      ) : (
        <RequestPanel item={item} />
      )}
    </div>
  );
}

function RequestPanel({ item, large = false }: { item: LightboxItem; large?: boolean }) {
  return (
    <div
      className={cn(
        "relative z-10 flex flex-1 flex-col justify-between rounded-lg border border-signal/16 bg-black/24 p-4 shadow-[inset_0_0_34px_rgb(var(--signal-rgb)/0.06)]",
        large && "min-h-[52svh] p-5 sm:p-7",
      )}
    >
      <div>
        <div className="mb-4 flex flex-wrap gap-2">
          {(item.tags ?? ["запрос"]).map((tag) => (
            <span key={tag} className="rounded-md border border-signal/18 bg-signal/10 px-2 py-1 font-mono text-[11px] text-signal-bright">
              {tag}
            </span>
          ))}
        </div>
        <p className={cn("text-base font-semibold leading-7 text-[#f4ffff]", large && "max-w-4xl text-2xl leading-10 sm:text-3xl sm:leading-[1.22]")}>
          {item.message || item.caption}
        </p>
      </div>

      {item.meta ? (
        <div className="mt-6 rounded-lg border border-dashed border-signal/20 bg-[var(--surface-1)]/72 p-4">
          <p className="text-sm font-semibold text-signal-bright">{item.meta}</p>
          <p className="mt-2 text-xs leading-5 text-[#93a3a3]">
            Обезличенный пример. Без персональных данных, телефонов и реальных банковских обещаний.
          </p>
        </div>
      ) : null}
    </div>
  );
}
