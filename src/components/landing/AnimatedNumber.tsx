"use client";

import { useEffect, useRef } from "react";

const ruFormatter = new Intl.NumberFormat("ru-RU");

type AnimatedNumberProps = {
  value: number;
  durationMs?: number;
  suffix?: string;
};

export function AnimatedNumber({ value, durationMs = 1200, suffix = "" }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const currentElement = ref.current;
    if (!currentElement) return;
    const element: HTMLSpanElement = currentElement;

    let raf = 0;
    let observer: IntersectionObserver | null = null;
    const finalValue = `${ruFormatter.format(value)}${suffix}`;

    function setText(nextValue: number) {
      element.textContent = `${ruFormatter.format(nextValue)}${suffix}`;
    }

    function run() {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        element.textContent = finalValue;
        return;
      }

      const start = performance.now();

      function tick(now: number) {
        const progress = Math.min((now - start) / durationMs, 1);
        const eased = 1 - (1 - progress) ** 3;
        setText(Math.round(value * eased));
        if (progress < 1) raf = window.requestAnimationFrame(tick);
      }

      raf = window.requestAnimationFrame(tick);
    }

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return;
          observer?.disconnect();
          run();
        },
        { rootMargin: "120px 0px", threshold: 0.1 },
      );
      observer.observe(element);
    } else {
      run();
    }

    return () => {
      observer?.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [durationMs, suffix, value]);

  return <span ref={ref}>{ruFormatter.format(0)}{suffix}</span>;
}
