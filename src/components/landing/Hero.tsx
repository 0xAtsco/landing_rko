"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { APPLICATION_URL, hero } from "@/lib/content";
import { MagneticButton } from "./MagneticButton";

const premiumEase = [0.22, 1, 0.36, 1] as const;

const flowNodes = [
  { label: "Пост / реклама", className: "left-5 top-[42%]", x: "18%", y: "48%" },
  { label: "лендинг", className: "left-[20%] bottom-[14%]", x: "30%", y: "76%" },
  { label: "бот", className: "right-6 top-[39%]", x: "82%", y: "47%" },
  { label: "CRM", className: "right-6 top-[62%]", x: "82%", y: "70%" },
  { label: "менеджер", className: "left-1/2 bottom-3 -translate-x-1/2", x: "50%", y: "86%" },
] as const;

const heroCopyVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.08,
    },
  },
};

const heroItemVariants: Variants = {
  hidden: { opacity: 0, y: 22, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: premiumEase },
  },
};

const consoleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.88, rotateX: 8, filter: "blur(14px)" },
  visible: {
    opacity: 1,
    scale: 1,
    rotateX: 0,
    filter: "blur(0px)",
    transition: { duration: 0.95, delay: 0.18, ease: premiumEase },
  },
};

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative isolate min-h-[88svh] overflow-hidden px-4 pb-4 pt-24 sm:px-6 sm:pb-8 lg:pt-28">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_46%_12%,rgba(34,211,238,0.28),transparent_26rem),radial-gradient(circle_at_14%_34%,rgba(124,58,237,0.24),transparent_22rem),linear-gradient(180deg,#020817_0%,#061b34_48%,#030712_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:38px_38px] opacity-35 [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />
        <div className="hero-shader absolute left-1/2 top-[-8rem] h-[760px] w-[760px] -translate-x-1/2 rounded-full blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#020817] to-transparent" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[0.96fr_1.04fr]">
        <motion.div
          variants={heroCopyVariants}
          initial={false}
          animate={reduceMotion ? undefined : "visible"}
          className="relative z-10 min-w-0 max-w-full text-center lg:text-left"
        >
          <motion.div variants={heroItemVariants}>
          <Badge className="mb-5 max-w-full whitespace-normal rounded-md border-cyan-200/25 bg-cyan-200/10 px-3 py-1.5 text-center text-[11px] font-medium leading-5 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.16)] hover:bg-cyan-200/10 sm:text-xs">
            {hero.badge}
          </Badge>
          </motion.div>
          <h1 className="mx-auto max-w-[calc(100vw-2rem)] text-balance text-[2.45rem] font-semibold leading-[0.94] tracking-normal text-white drop-shadow-[0_0_22px_rgba(125,211,252,0.12)] sm:max-w-4xl sm:text-5xl lg:mx-0 lg:text-[4.15rem] xl:text-[4.55rem]">
            <motion.span variants={heroItemVariants}>
              {hero.title}
            </motion.span>
          </h1>
          <motion.p variants={heroItemVariants} className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-slate-100/90 lg:mx-0 lg:text-xl">
            {hero.subtitle}
          </motion.p>
          <motion.p variants={heroItemVariants} className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400 lg:mx-0">
            {hero.support}
          </motion.p>

          <motion.div variants={heroItemVariants} className="mx-auto mt-5 max-w-2xl rounded-lg border border-cyan-200/18 bg-[#071a33]/72 p-2 shadow-[inset_0_0_34px_rgba(34,211,238,0.08)] backdrop-blur-xl lg:mx-0">
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-slate-200 sm:text-xs lg:justify-start">
              {hero.miniFlow.map((step, index) => (
                <span key={step} className="flex items-center gap-2">
                  <span className="rounded-md border border-white/10 bg-white/[0.055] px-2.5 py-1.5">
                    {step}
                  </span>
                  {index < hero.miniFlow.length - 1 ? (
                    <span className="text-cyan-200">→</span>
                  ) : null}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div variants={heroItemVariants} className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <MagneticButton href={APPLICATION_URL} analytics="hero_apply">{hero.primaryCta}</MagneticButton>
            <MagneticButton href="#builds" variant="secondary">
              {hero.secondaryCta}
            </MagneticButton>
          </motion.div>

          <motion.div variants={heroItemVariants} className="mt-6 flex flex-nowrap justify-start gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible lg:justify-start">
            {hero.proofChips.map((chip) => (
              <span
                key={chip}
                className="shrink-0 rounded-lg border border-white/10 bg-white/[0.055] px-3 py-1.5 text-xs text-slate-200 backdrop-blur"
              >
                {chip}
              </span>
            ))}
          </motion.div>

          <motion.div variants={heroItemVariants} className="sm:hidden">
            <HeroMobileVisual reduceMotion={reduceMotion} />
          </motion.div>

        </motion.div>

        <motion.div
          variants={consoleVariants}
          initial={false}
          animate={reduceMotion ? undefined : "visible"}
          className="relative mx-auto hidden h-[520px] min-w-0 w-full max-w-[640px] sm:block lg:h-[600px]"
        >
          <HeroVisual reduceMotion={reduceMotion} />
        </motion.div>
      </div>
    </section>
  );
}

function HeroVisual({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[1.6rem] border border-cyan-200/18 bg-[#041326]/82 p-5 shadow-[0_34px_120px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(34,211,238,0.24),transparent_16rem),radial-gradient(circle_at_82%_16%,rgba(124,58,237,0.18),transparent_18rem),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_40%)]" />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:26px_26px] opacity-35 [mask-image:radial-gradient(circle_at_center,black,transparent_82%)]" />

      <div className="relative z-10 flex items-center justify-between rounded-lg border border-white/10 bg-black/24 px-4 py-3 font-mono text-[11px] text-slate-300">
        <span className="text-cyan-100">traffic.ops/live</span>
        <span className="text-emerald-300">signal stable</span>
        <span className="text-violet-200">14d sprint</span>
      </div>

      <div className="relative z-10 mt-5 h-[calc(100%-116px)] min-h-[360px] overflow-hidden rounded-[1.25rem] border border-cyan-200/12 bg-black/16">
        <div className="absolute right-4 top-4 z-30 grid w-44 gap-2 rounded-lg border border-white/10 bg-[#071a33]/88 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="grid grid-cols-[1fr_auto] gap-2 text-[10px] uppercase tracking-[0.16em] text-slate-400">
            <span>lead queue</span>
            <span className="text-cyan-200">live</span>
          </div>
          {hero.queueRows.map((row) => (
            <div key={row.name} className="grid grid-cols-[1fr_auto] gap-2 rounded-md bg-white/[0.055] px-2 py-1.5 font-mono text-[10px] text-slate-200">
              <span>{row.name}</span>
              <span className="text-cyan-200">{row.source}</span>
            </div>
          ))}
        </div>

        <svg aria-hidden="true" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="heroLiveLine" x1="0" x2="1">
              <stop offset="0%" stopColor="#67e8f9" stopOpacity=".12" />
              <stop offset="50%" stopColor="#a78bfa" stopOpacity=".86" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity=".18" />
            </linearGradient>
          </defs>
          {flowNodes.map((node) => (
            <line
              key={node.label}
              x1="50%"
              y1="52%"
              x2={node.x}
              y2={node.y}
              stroke="url(#heroLiveLine)"
              strokeWidth="1.4"
              strokeDasharray="7 10"
              className="signal-flow"
            />
          ))}
        </svg>

        <motion.div
          initial={false}
          animate={reduceMotion ? undefined : { scale: [1, 1.025, 1] }}
          transition={reduceMotion ? undefined : { duration: 5.4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-[52%] grid size-52 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-cyan-200/24 bg-[#06172f]/82 shadow-[0_0_90px_rgba(34,211,238,0.38)] lg:size-60"
        >
          <div className="radar-sweep absolute inset-3 rounded-full opacity-80" />
          <div className="absolute inset-5 rounded-full border border-violet-300/20" />
          <div className="absolute inset-12 rounded-full border border-cyan-200/30" />
          <div className="relative grid size-20 place-items-center rounded-full bg-cyan-200 shadow-[0_0_48px_rgba(103,232,249,0.95)]">
            <span className="size-2 rounded-full bg-slate-950/80" />
          </div>
        </motion.div>

        {flowNodes.map((node, index) => (
          <motion.div
            key={node.label}
            initial={false}
            animate={reduceMotion ? undefined : { y: [0, index % 2 ? -5 : 5, 0] }}
            transition={
              reduceMotion
                ? undefined
                : {
                    y: { duration: 5 + index * 0.25, repeat: Infinity, ease: "easeInOut", delay: 1 + index * 0.1 },
                  }
            }
          className={`absolute z-20 ${node.className} min-w-24 rounded-lg border border-white/12 bg-[#071a33]/90 px-3 py-2 text-center text-xs font-semibold text-white shadow-[0_16px_48px_rgba(0,0,0,0.32)] backdrop-blur-xl lg:min-w-28 lg:px-4 lg:py-3 lg:text-sm`}
          >
            <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-cyan-300/80" />
            {node.label}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 mt-4 rounded-lg border border-cyan-200/20 bg-black/48 px-4 py-3 font-mono text-xs text-cyan-100 shadow-[0_0_32px_rgba(34,211,238,0.16)]">
        <span className="text-violet-300">vibecamp</span>
        <span className="text-slate-500"> $ </span>
        <span className="typewriter inline-block align-bottom">{hero.commands.join("  ")}</span>
      </div>
    </div>
  );
}

function HeroMobileVisual({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <div className="mx-auto mt-5 max-w-sm overflow-hidden rounded-lg border border-cyan-200/18 bg-[#06172e]/78 p-3 shadow-[0_24px_80px_rgba(34,211,238,0.12)] backdrop-blur-xl">
      <div className="grid grid-cols-[0.76fr_1fr] gap-3">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: premiumEase }}
          className="relative grid min-h-28 place-items-center overflow-hidden rounded-md border border-cyan-200/14 bg-black/20"
        >
          <div className="radar-sweep absolute inset-4 rounded-full opacity-80" />
          <div className="absolute inset-7 rounded-full border border-cyan-200/18" />
          <div className="grid size-14 place-items-center rounded-full border border-cyan-200/30 bg-cyan-200/10 shadow-[0_0_34px_rgba(34,211,238,0.32)]">
            <div className="size-5 rounded-full bg-cyan-200 shadow-[0_0_24px_rgba(103,232,249,0.9)]" />
          </div>
        </motion.div>
        <div className="space-y-1.5 rounded-md border border-white/10 bg-black/20 p-2 text-left font-mono text-[10px] text-cyan-100">
          {hero.queueRows.map((row, index) => (
            <motion.div
              key={row.name}
              initial={reduceMotion ? false : { opacity: 0, x: 8 }}
              animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.18 + index * 0.08 }}
              className="grid grid-cols-[1fr_auto] gap-2 rounded bg-white/[0.055] px-2 py-1.5"
            >
              <span>{row.name}</span>
              <span className="text-violet-200">{row.status}</span>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-medium text-slate-200">
        {hero.miniFlow.map((step, index) => (
          <span key={step} className="flex items-center gap-1.5">
            <span className="rounded border border-white/10 bg-white/[0.055] px-2 py-1">{step}</span>
            {index < hero.miniFlow.length - 1 ? <span className="text-cyan-200">→</span> : null}
          </span>
        ))}
      </div>
    </div>
  );
}
