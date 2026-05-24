"use client";

import { useScroll, useTransform, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { APPLICATION_URL, navLinks } from "@/lib/content";

export function Header() {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5">
      <motion.div
        aria-hidden="true"
        style={{ scaleX }}
        className="fixed left-0 top-0 h-0.5 w-full origin-left bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400"
      />
      <nav aria-label="Основная навигация" className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-lg border border-cyan-200/15 bg-[#031228]/70 px-3 shadow-[0_8px_40px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:h-16 sm:px-5">
        <a href="#" className="flex items-center gap-2 rounded text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" aria-label="VibeCamp — наверх страницы">
          <span className="grid size-8 place-items-center rounded-md border border-cyan-200/30 bg-cyan-200/10 text-cyan-200 shadow-[0_0_22px_rgba(34,211,238,0.16)]">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          VibeCamp
        </a>
        <div className="hidden items-center gap-1 rounded-md border border-white/8 bg-white/[0.035] p-1 text-sm text-white/68 lg:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="rounded px-3 py-1.5 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
              {link.label}
            </a>
          ))}
        </div>
        <a
          href={APPLICATION_URL}
          data-analytics="hero_apply"
          className="rounded-lg border border-cyan-200/30 bg-cyan-200/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-200 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:px-4 sm:text-sm"
        >
          Войти в поток
        </a>
      </nav>
    </header>
  );
}
