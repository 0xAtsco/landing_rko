"use client";

import { useEffect, useRef } from "react";
import { setDocumentMotionMode, useMotionMode } from "@/lib/motion";

export function MotionBudgetController() {
  const mode = useMotionMode();
  const activeGlowRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const pointRef = useRef({ x: 0, y: 0 });
  const rectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    setDocumentMotionMode(mode);
  }, [mode]);

  useEffect(() => {
    function scrollToHash(hash: string, updateUrl = false) {
      const id = decodeURIComponent(hash.replace(/^#/, ""));
      if (!id) return;

      const target = document.getElementById(id);
      if (!target) return;

      if (updateUrl) {
        window.history.pushState(null, "", `#${id}`);
      }

      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      target.scrollIntoView({ block: "start", behavior });
    }

    function onClick(event: MouseEvent) {
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      const href = link?.getAttribute("href");

      if (!href || href === "#") return;

      const target = document.getElementById(decodeURIComponent(href.slice(1)));
      if (!target) return;

      event.preventDefault();
      scrollToHash(href, window.location.hash !== href);
    }

    function onHashChange() {
      scrollToHash(window.location.hash);
    }

    window.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHashChange);
    window.requestAnimationFrame(onHashChange);

    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

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
      const rect = rectRef.current;
      if (target && rect) {
        target.style.setProperty("--glow-x", `${pointRef.current.x - rect.left}px`);
        target.style.setProperty("--glow-y", `${pointRef.current.y - rect.top}px`);
      }
      frameRef.current = null;
    }

    function onPointerOver(event: PointerEvent) {
      const target = (event.target as Element | null)?.closest<HTMLElement>("[data-hover-glow]");
      if (!target || target === activeGlowRef.current) return;
      activeGlowRef.current = target;
      rectRef.current = target.getBoundingClientRect();
    }

    function onPointerOut(event: PointerEvent) {
      const target = activeGlowRef.current;
      if (!target) return;

      const relatedTarget = event.relatedTarget;
      if (relatedTarget instanceof Node && target.contains(relatedTarget)) return;

      target.style.removeProperty("--glow-x");
      target.style.removeProperty("--glow-y");
      activeGlowRef.current = null;
      rectRef.current = null;
    }

    function onPointerMove(event: PointerEvent) {
      if (!activeGlowRef.current) {
        activeGlowRef.current = null;
        return;
      }
      pointRef.current = { x: event.clientX, y: event.clientY };
      if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(flushGlow);
    }

    window.addEventListener("pointerover", onPointerOver, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointerover", onPointerOver);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("pointermove", onPointerMove);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [mode]);

  return null;
}
