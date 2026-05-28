"use client";

import { useEffect, useRef } from "react";
import { setDocumentMotionMode, useMotionMode } from "@/lib/motion";

export function MotionBudgetController() {
  const mode = useMotionMode();
  const activeGlowRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const pointRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setDocumentMotionMode(mode);
  }, [mode]);

  useEffect(() => {
    const revealTargets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (mode === "reduced" || revealTargets.length === 0) {
      revealTargets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );

    revealTargets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [mode]);

  useEffect(() => {
    if (mode !== "full") return;

    function flushGlow() {
      const target = activeGlowRef.current;
      if (target) {
        const rect = target.getBoundingClientRect();
        target.style.setProperty("--glow-x", `${pointRef.current.x - rect.left}px`);
        target.style.setProperty("--glow-y", `${pointRef.current.y - rect.top}px`);
      }
      frameRef.current = null;
    }

    function onPointerMove(event: PointerEvent) {
      const target = (event.target as Element | null)?.closest<HTMLElement>("[data-hover-glow]");
      if (!target) {
        activeGlowRef.current = null;
        return;
      }
      activeGlowRef.current = target;
      pointRef.current = { x: event.clientX, y: event.clientY };
      if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(flushGlow);
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [mode]);

  return null;
}
