"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { APPLICATION_URL, hero } from "@/lib/content";
import { MagneticButton } from "./MagneticButton";

const cardPositions = [
  "left-2 top-8",
  "right-0 top-24",
  "left-0 bottom-28",
  "right-3 bottom-24",
  "left-1/2 top-0 -translate-x-1/2",
  "left-1/2 bottom-6 -translate-x-1/2",
];

const premiumEase = [0.22, 1, 0.36, 1] as const;

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

          <motion.div variants={heroItemVariants} className="mx-auto mt-4 grid max-w-sm grid-cols-[0.7fr_1fr] gap-2 rounded-lg border border-cyan-200/18 bg-[#071a33]/74 p-2 shadow-[inset_0_0_40px_rgba(34,211,238,0.08)] backdrop-blur-xl sm:hidden">
            <div className="relative grid min-h-20 place-items-center overflow-hidden rounded-md border border-cyan-200/14 bg-black/20">
              <div className="radar-sweep absolute inset-3 rounded-full opacity-80" />
              <div className="grid size-12 place-items-center rounded-full border border-cyan-200/30 bg-cyan-200/10 shadow-[0_0_34px_rgba(34,211,238,0.32)]">
                <div className="size-5 rounded-full bg-cyan-200 shadow-[0_0_24px_rgba(103,232,249,0.9)]" />
              </div>
            </div>
            <div className="space-y-1.5 rounded-md border border-white/10 bg-black/20 p-2 text-left font-mono text-[10px] text-cyan-100">
              {hero.queueRows.map((row) => (
                <div key={row.name} className="grid grid-cols-[1fr_auto] gap-2">
                  <span>{row.name}</span>
                  <span className="text-violet-200">{row.status}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          variants={consoleVariants}
          initial={false}
          animate={reduceMotion ? undefined : "visible"}
          className="relative mx-auto hidden h-[500px] min-w-0 w-full max-w-[610px] sm:block lg:h-[600px]"
        >
          <motion.div
            initial={reduceMotion ? false : { clipPath: "inset(48% 48% 48% 48%)", opacity: 0 }}
            animate={reduceMotion ? undefined : { clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-4 rounded-[1.6rem] border border-cyan-200/15 bg-[#041326]/72 shadow-[inset_0_0_80px_rgba(34,211,238,0.1),0_34px_120px_rgba(0,0,0,0.42)] backdrop-blur-md"
          />
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -12 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.8 }}
            className="absolute inset-x-16 top-12 flex items-center justify-between rounded-lg border border-white/10 bg-black/22 px-4 py-3 font-mono text-[11px] text-slate-300"
          >
            <span className="text-cyan-100">traffic.ops/live</span>
            <span className="text-emerald-300">signal stable</span>
            <span className="text-violet-200">14d sprint</span>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.38 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-[47%] top-[47%] grid size-52 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-cyan-200/25 bg-[#06172f]/80 shadow-[0_0_90px_rgba(34,211,238,0.38)] lg:size-64"
          >
            <div className="radar-sweep absolute inset-3 rounded-full opacity-80" />
            <div className="absolute inset-5 rounded-full border border-violet-300/20" />
            <div className="absolute inset-12 rounded-full border border-cyan-200/30" />
            <div className="relative grid size-20 place-items-center rounded-full bg-cyan-200/85 shadow-[0_0_48px_rgba(103,232,249,0.95)]">
              <span className="size-2 rounded-full bg-slate-950/80" />
            </div>
          </motion.div>
          <svg aria-hidden="true" className="absolute inset-0 h-full w-full">
            <defs>
              <linearGradient id="heroLine" x1="0" x2="1">
                <stop offset="0%" stopColor="#67e8f9" stopOpacity=".15" />
                <stop offset="50%" stopColor="#a78bfa" stopOpacity=".8" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity=".15" />
              </linearGradient>
            </defs>
            {cardPositions.map((_, index) => (
              <line
                key={index}
                x1="50%"
                y1="50%"
                x2={`${index % 2 === 0 ? 20 : 82}%`}
                y2={`${18 + index * 12}%`}
                stroke="url(#heroLine)"
                strokeWidth="1"
                strokeDasharray="6 8"
                className="signal-flow"
              />
            ))}
          </svg>

          {hero.floatingCards.map((card, index) => (
            <motion.div
              key={card}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.7, y: index % 2 ? 18 : -18 }}
              animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: [0, index % 2 ? -10 : 10, 0] }}
              transition={
                reduceMotion
                  ? undefined
                  : {
                      opacity: { duration: 0.45, delay: 0.65 + index * 0.08 },
                      scale: { duration: 0.45, delay: 0.65 + index * 0.08 },
                      y: { duration: 5 + index * 0.35, repeat: Infinity, ease: "easeInOut", delay: 1 + index * 0.08 },
                    }
              }
              className={`absolute ${cardPositions[index]} w-[132px] rounded-lg border border-white/12 bg-[#071a33]/84 p-3 text-left shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:w-[160px]`}
            >
              <div className="mb-2 h-1 w-10 rounded-full bg-cyan-300/80" />
              <div className="text-sm font-semibold text-white">{card}</div>
              <div className="mt-2 flex gap-1.5">
                <span className="h-1.5 flex-1 rounded-full bg-white/15" />
                <span className="h-1.5 flex-1 rounded-full bg-cyan-200/45" />
              </div>
            </motion.div>
          ))}

          <div className="absolute bottom-20 left-1/2 w-[min(92%,390px)] -translate-x-1/2 rounded-lg border border-cyan-200/20 bg-black/50 p-3 font-mono text-xs text-cyan-100 shadow-[0_0_32px_rgba(34,211,238,0.16)] backdrop-blur-xl">
            <span className="text-violet-300">vibecamp</span>
            <span className="text-slate-500"> $ </span>
            <span className="typewriter inline-block align-bottom">
              {hero.commands.join("  ")}
            </span>
          </div>

          <div className="absolute bottom-8 right-10 w-52 rounded-lg border border-white/10 bg-black/28 p-3 backdrop-blur-xl">
            <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-slate-400">
              <span>lead queue</span>
              <span className="text-cyan-200">live</span>
            </div>
            <div className="space-y-1.5">
              {hero.queueRows.map((row) => (
                <div key={row.name} className="grid grid-cols-[1fr_auto] gap-2 rounded-md bg-white/[0.055] px-2 py-1.5 font-mono text-[10px] text-slate-200">
                  <span>{row.name}</span>
                  <span className="text-cyan-200">{row.source}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
