"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { APPLICATION_URL, cases, casesSection } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";
import { MagneticButton } from "./MagneticButton";
import { SectionHeading } from "./SectionPrimitives";

export function Cases() {
  const reduceMotion = useReducedMotion();

  return (
    <SectionReveal id="cases" className="relative px-4 py-20 sm:px-6">
      <div aria-hidden="true" className="absolute left-0 top-24 h-72 w-full bg-[radial-gradient(circle_at_70%_35%,rgba(124,58,237,0.14),transparent_34rem)]" />
      <div className="mx-auto max-w-6xl">
        <SectionHeading {...casesSection.heading} tone="violet" className="mb-10 max-w-4xl" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cases.map((item, index) => (
            <motion.article
              key={item.title}
              initial={reduceMotion ? false : { opacity: 0, y: 34, rotateX: 5 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
              whileHover={reduceMotion ? undefined : { y: -8, scale: 1.01 }}
              className="group relative flex min-h-[720px] flex-col overflow-hidden rounded-lg border border-white/10 bg-[#07172d]/82 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur-xl transition hover:border-cyan-200/30 hover:shadow-[0_28px_110px_rgba(34,211,238,0.16)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-300/10 via-transparent to-violet-400/14 opacity-75" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/50 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex gap-1.5" aria-hidden="true">
                    <span className="size-2.5 rounded-full bg-rose-300/80" />
                    <span className="size-2.5 rounded-full bg-amber-300/80" />
                    <span className="size-2.5 rounded-full bg-emerald-300/80" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    demo.0{index + 1}
                  </span>
                </div>

                <div className="mb-5 overflow-hidden rounded-lg border border-white/10 bg-black/24 p-2 shadow-[inset_0_0_30px_rgba(34,211,238,0.05)]">
                  {item.image.length > 0 ? (
                    <Image
                      src={item.image}
                      alt={item.imageAlt}
                      width={1600}
                      height={1000}
                      sizes="(min-width: 1280px) 360px, (min-width: 768px) 50vw, 100vw"
                      className="aspect-[16/10] w-full rounded-md object-cover shadow-[0_18px_70px_rgba(34,211,238,0.12)] transition duration-500 group-hover:-translate-y-1 group-hover:scale-[1.015]"
                      loading="lazy"
                    />
                  ) : (
                    <CaseMockup type={item.visual} />
                  )}
                </div>

                <span className="w-fit rounded-lg border border-cyan-200/20 bg-cyan-200/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-cyan-100">
                  {item.tag}
                </span>
                <h3 className="mt-4 text-xl font-semibold leading-tight text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.text}</p>

                <div className="mt-5 space-y-3 text-sm leading-6">
                  <CaseLine label="До" text={item.before} />
                  <CaseLine label="Собрано" text={item.built} />
                  <CaseLine label="Выход" text={item.output} />
                </div>

                <div className="mt-auto pt-6">
                  <MagneticButton href={APPLICATION_URL} analytics="case_apply" className="w-full">
                    Хочу собрать похожее
                  </MagneticButton>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}

function CaseLine({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.035] p-3">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200/80">
        {label}
      </div>
      <div className="text-slate-300">{text}</div>
    </div>
  );
}

function CaseMockup({ type }: { type: string }) {
  if (type === "telegram") return <TelegramMockup />;
  if (type === "sales") return <SalesMockup />;
  if (type === "shorts") return <ShortsMockup />;
  if (type === "rko") return <RkoMockup />;
  if (type === "crm") return <CrmMockup />;
  return <BusinessMockup />;
}

function WindowHeader({ title, status = "active" }: { title: string; status?: string }) {
  return (
    <div className="mb-3 grid grid-cols-[1fr_auto] gap-3 rounded-md border border-white/8 bg-white/[0.035] p-2 font-mono text-[10px] text-slate-400">
      <span>{title}</span>
      <span className="text-cyan-200">{status}</span>
    </div>
  );
}

function TelegramMockup() {
  return (
    <div>
      <WindowHeader title="telegram.funnel" />
      <div className="grid gap-3 sm:grid-cols-[1fr_0.9fr]">
        <div className="space-y-2">
          {["Пост: боль оффера", "Прогрев: кейс", "CTA: бот"].map((line, index) => (
            <div key={line} className="chat-pop rounded-lg border border-white/8 bg-white/[0.055] p-2 text-xs text-slate-200" style={{ animationDelay: `${index * 0.16}s` }}>
              {line}
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-cyan-200/14 bg-cyan-200/[0.055] p-2">
          <div className="mb-2 grid grid-cols-3 gap-1">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <span key={item} className="case-cell h-7 rounded bg-cyan-300/30" style={{ animationDelay: `${item * 0.05}s` }} />
            ))}
          </div>
          <div className="rounded-md bg-black/24 p-2 text-[10px] text-slate-300">lead: новый · канал · заявка</div>
        </div>
      </div>
    </div>
  );
}

function SalesMockup() {
  return (
    <div>
      <WindowHeader title="sales.crm" />
      <div className="grid grid-cols-3 gap-2">
        {["Новый", "В работе", "След. шаг"].map((status, index) => (
          <div key={status} className="rounded-lg border border-white/8 bg-black/20 p-2">
            <div className="mb-2 text-[10px] text-slate-500">{status}</div>
            {[0, 1].map((row) => (
              <div key={row} className="pipeline-row mb-1.5 rounded bg-white/[0.07] px-2 py-1.5 text-[10px] text-slate-300" style={{ animationDelay: `${(index + row) * 0.1}s` }}>
                lead {index + row + 1}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-cyan-200/18 bg-cyan-300/10 p-2 text-xs text-cyan-100">
        AI: ответить коротко, уточнить оборот и время созвона
      </div>
    </div>
  );
}

function ShortsMockup() {
  return (
    <div>
      <WindowHeader title="shorts.factory" />
      <div className="grid grid-cols-3 gap-2">
        {["Hook", "Script", "Post"].map((item, index) => (
          <div key={item} className="case-cell min-h-24 rounded-lg border border-white/8 bg-gradient-to-b from-cyan-300/18 to-violet-300/12 p-2" style={{ animationDelay: `${index * 0.12}s` }}>
            <div className="mb-8 rounded bg-white/16 px-2 py-1 text-[10px] text-white">{item}</div>
            <div className="h-1.5 rounded bg-white/20" />
            <div className="mt-1.5 h-1.5 w-2/3 rounded bg-cyan-200/35" />
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1">
        {Array.from({ length: 15 }).map((_, index) => (
          <span key={index} className="h-2 rounded bg-white/10 odd:bg-cyan-300/45" />
        ))}
      </div>
    </div>
  );
}

function RkoMockup() {
  const nodes = ["Пост", "Ленд", "Бот", "CRM", "Менеджер"];

  return (
    <div>
      <WindowHeader title="rko.pipeline" />
      <div className="relative mb-3 overflow-hidden rounded-lg border border-cyan-200/14 bg-black/24 p-3">
        <svg aria-hidden="true" className="absolute inset-0 h-full w-full">
          <line x1="12%" y1="50%" x2="88%" y2="50%" stroke="#67e8f9" strokeOpacity=".35" strokeWidth="1" strokeDasharray="6 8" className="signal-flow" />
        </svg>
        <div className="relative z-10 grid grid-cols-5 gap-2">
          {nodes.map((node, index) => (
            <div key={node} className="grid min-h-12 place-items-center rounded-lg border border-white/10 bg-[#071a33]/90 px-1 text-center text-[10px] text-slate-200 shadow-[0_0_20px_rgba(34,211,238,0.08)]">
              {node}
              <span className={`mt-1 size-1.5 rounded-full ${index === 2 ? "bg-cyan-200 shadow-[0_0_14px_rgba(103,232,249,0.9)]" : "bg-white/25"}`} />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="chat-pop rounded-lg bg-cyan-300 px-3 py-2 text-xs text-slate-950">Бот: какой банк интересен?</div>
        <div className="rounded-lg border border-white/8 bg-white/[0.055] p-2 text-xs text-slate-300">CRM: статус · новый</div>
      </div>
    </div>
  );
}

function CrmMockup() {
  return (
    <div>
      <WindowHeader title="custom.crm" />
      <div className="overflow-hidden rounded-lg border border-white/10 bg-black/24">
        {["Лид", "Статус", "Ответственный", "Следующий шаг"].map((cell) => (
          <div key={cell} className="grid grid-cols-[1fr_76px] gap-2 border-b border-white/8 px-3 py-2 text-xs last:border-b-0">
            <span className="text-slate-300">{cell}</span>
            <span className="rounded bg-cyan-300/16 px-2 py-0.5 text-center text-cyan-100">ok</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BusinessMockup() {
  return (
    <div>
      <WindowHeader title="business.page" />
      <div className="grid grid-cols-[1fr_72px] gap-3">
        <div className="rounded-lg border border-white/8 bg-white/[0.055] p-3">
          <div className="mb-3 h-3 w-24 rounded bg-cyan-200/45" />
          <div className="space-y-2">
            <div className="h-2 rounded bg-white/18" />
            <div className="h-2 w-4/5 rounded bg-white/12" />
            <div className="h-8 rounded bg-cyan-300/20" />
          </div>
        </div>
        <div className="rounded-lg border border-cyan-200/14 bg-black/24 p-2">
          <div className="mx-auto mb-2 h-14 w-8 rounded border border-white/10 bg-cyan-300/10" />
          <div className="h-2 rounded bg-white/18" />
          <div className="mt-1 h-2 rounded bg-cyan-200/35" />
        </div>
      </div>
    </div>
  );
}
