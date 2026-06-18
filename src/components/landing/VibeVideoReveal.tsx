"use client";

import { useEffect, useRef, useState } from "react";
import { vibeVideoSection } from "@/lib/content";

const START_SCALE = 0.34;
const SCALE_END_AT = 0.78;

export function VibeVideoReveal() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasLeftSectionRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [videoRestartToken, setVideoRestartToken] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const updateReducedMotion = () => {
      setReducedMotion(media.matches);
      if (media.matches) {
        setProgress(1);
      }
    };

    const updateProgress = () => {
      frame = 0;

      if (media.matches) {
        setProgress(1);
        return;
      }

      const section = sectionRef.current;
      if (!section) {
        return;
      }

      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const scrollableDistance = Math.max(rect.height - viewportHeight, 1);
      const passed = Math.min(Math.max(-rect.top, 0), scrollableDistance);

      setProgress(Math.min(Math.max(passed / scrollableDistance, 0), 1));
    };

    const requestUpdate = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(updateProgress);
      }
    };

    updateReducedMotion();
    requestUpdate();

    media.addEventListener("change", updateReducedMotion);
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      media.removeEventListener("change", updateReducedMotion);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;

        if (!entry.isIntersecting) {
          hasLeftSectionRef.current = true;
          if (video) {
            video.pause();
            video.currentTime = 0;
          }
          return;
        }

        if (hasLeftSectionRef.current) {
          hasLeftSectionRef.current = false;
          setVideoRestartToken((token) => token + 1);
        }
      },
      { threshold: 0.14 },
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.currentTime = 0;
    const playPromise = video.play();

    if (playPromise) {
      playPromise.catch(() => undefined);
    }
  }, [videoRestartToken]);

  const scaleProgress = reducedMotion ? 1 : Math.min(Math.max(progress / SCALE_END_AT, 0), 1);
  const videoScale = reducedMotion ? 1 : START_SCALE + (1 - START_SCALE) * scaleProgress;
  const chromeOpacity = reducedMotion ? 1 : Math.min(Math.max((scaleProgress - 0.18) / 0.82, 0), 1);

  return (
    <section ref={sectionRef} className="relative min-h-[185svh] px-4 sm:min-h-[205svh] sm:px-6 lg:min-h-[220svh]">
      <div className="sticky top-0 flex min-h-svh items-center py-10 sm:py-14">
        <div className="mx-auto w-full max-w-6xl">
          <div
            className="relative mx-auto overflow-hidden rounded-xl border border-signal/18 bg-[var(--surface-1)]/88 p-2 shadow-[0_28px_110px_rgba(0,0,0,0.36),inset_0_1px_0_rgb(var(--signal-rgb)/0.08)] will-change-transform sm:p-4"
            style={{
              opacity: 0.62 + chromeOpacity * 0.38,
              transform: `scale(${videoScale})`,
              transformOrigin: "center center",
            }}
          >
            <div aria-hidden="true" className="tiffany-dot-field absolute inset-0 opacity-35" />
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal/60 to-transparent" />

            <div className="relative z-10 px-2 pb-3 pt-1 sm:px-2 sm:pb-5">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-signal-bright sm:text-xs">
                {vibeVideoSection.eyebrow}
              </p>
              <h2 className="max-w-4xl text-balance text-2xl font-semibold leading-[1.02] text-[#f4ffff] sm:text-4xl lg:text-5xl">
                {vibeVideoSection.title}
              </h2>
            </div>

            <div className="relative aspect-video overflow-hidden rounded-lg border border-signal/14 bg-black/50">
              <video
                key={videoRestartToken}
                ref={videoRef}
                className="size-full object-cover"
                src={vibeVideoSection.src}
                muted
                autoPlay
                playsInline
                loop
                controls
                preload="metadata"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
