"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useRef } from "react";
import { timelineSection } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";
import { SectionHeading } from "./SectionPrimitives";

export function Timeline() {
  const reduceMotion = useReducedMotion();
  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start center", "end center"],
  });
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  return (
    <SectionReveal id="timeline" className="relative px-4 py-20 sm:px-6">
      <div aria-hidden="true" className="absolute inset-x-0 top-1/2 h-48 -translate-y-1/2 skew-y-3 bg-violet-300/[0.035]" />
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="top-24 h-fit rounded-lg border border-white/10 bg-black/16 p-5 backdrop-blur-xl lg:sticky">
          <SectionHeading {...timelineSection.heading} />
          <div className="mt-7 rounded-lg border border-cyan-200/12 bg-[#06172e]/75 p-4">
            <div className="mb-3 flex justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
              <span>sprint route</span>
              <span className="text-cyan-200">результат</span>
            </div>
            <div className="grid grid-cols-8 gap-1.5" aria-hidden="true">
              {timelineSection.items.map((item, index) => (
                <span key={item.step} className={index === timelineSection.items.length - 1 ? "h-10 rounded-sm border border-cyan-200/50 bg-cyan-300/45" : "h-10 rounded-sm border border-white/8 bg-white/[0.06]"} />
              ))}
            </div>
          </div>
        </div>

        <div ref={timelineRef} className="relative">
          <div className="absolute left-5 top-0 h-full w-px bg-white/10 md:left-1/2" />
          <motion.div
            aria-hidden="true"
            style={reduceMotion ? undefined : { scaleY }}
            className="absolute left-5 top-0 h-full w-px origin-top bg-gradient-to-b from-cyan-200 via-violet-300 to-transparent shadow-[0_0_22px_rgba(34,211,238,0.55)] md:left-1/2"
          />
          <div className="space-y-5">
            {timelineSection.items.map((item, index) => (
              <motion.article
                key={item.step}
                initial={reduceMotion ? false : { opacity: 0, x: index % 2 === 0 ? -28 : 28, filter: "blur(8px)" }}
                whileInView={reduceMotion ? undefined : { opacity: 1, x: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
                className={index % 2 === 0 ? "relative pl-14 md:w-1/2 md:pr-10" : "relative pl-14 md:ml-auto md:w-1/2 md:pl-10"}
              >
                <span className={index % 2 === 0 ? "absolute left-0 top-5 grid size-10 place-items-center rounded-full border border-cyan-200/35 bg-[#07172d] text-xs font-semibold text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.24)] md:left-auto md:right-[-1.25rem]" : "absolute left-0 top-5 grid size-10 place-items-center rounded-full border border-cyan-200/35 bg-[#07172d] text-xs font-semibold text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.24)] md:left-[-1.25rem]"}>
                  {item.step}
                </span>
                <div className="group rounded-lg border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl transition duration-300 hover:border-cyan-200/25 hover:bg-white/[0.06] hover:shadow-[0_24px_80px_rgba(34,211,238,0.08)]">
                  <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
