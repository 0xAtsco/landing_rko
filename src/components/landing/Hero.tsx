"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { APPLICATION_URL, hero } from "@/lib/content";
import { MagneticButton } from "./MagneticButton";

const heroVisualSrc = "/generated/hero-command-center-v2.png";
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

          <motion.div variants={heroItemVariants} className="mx-auto mt-5 overflow-hidden rounded-lg border border-cyan-200/18 bg-black/24 p-1 shadow-[0_24px_80px_rgba(34,211,238,0.12)] sm:hidden">
            <Image
              src={heroVisualSrc}
              alt="Демо-макет операционного центра AI-воронки: трафик, лендинг, Telegram-бот, CRM и менеджер"
              width={1800}
              height={1200}
              sizes="100vw"
              className="aspect-[3/2] max-h-48 w-full rounded-md object-cover"
              priority
            />
          </motion.div>

        </motion.div>

        <motion.div
          variants={consoleVariants}
          initial={false}
          animate={reduceMotion ? undefined : "visible"}
          className="relative mx-auto hidden aspect-[3/2] min-w-0 w-full max-w-[660px] sm:block"
        >
          <div className="absolute inset-0 overflow-hidden rounded-[1.6rem] border border-cyan-200/18 bg-black/28 shadow-[0_34px_120px_rgba(0,0,0,0.42),0_0_90px_rgba(34,211,238,0.12)]">
            <Image
              src={heroVisualSrc}
              alt="Демо-макет операционного центра AI-воронки: трафик, лендинг, Telegram-бот, CRM и менеджер"
              width={1800}
              height={1200}
              sizes="(min-width: 1024px) 610px, 100vw"
              className="h-full w-full object-cover"
              priority
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
