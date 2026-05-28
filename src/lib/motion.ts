"use client";

import { useSyncExternalStore } from "react";

export type MotionMode = "full" | "lite" | "reduced";

function resolveMotionMode() {
  if (typeof window === "undefined") return "lite";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "reduced";
  if (window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 768px)").matches) return "full";
  return "lite";
}

function subscribe(callback: () => void) {
  const queries = [
    window.matchMedia("(prefers-reduced-motion: reduce)"),
    window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 768px)"),
  ];
  queries.forEach((query) => query.addEventListener("change", callback));
  return () => queries.forEach((query) => query.removeEventListener("change", callback));
}

export function useMotionMode(): MotionMode {
  return useSyncExternalStore(subscribe, resolveMotionMode, () => "lite");
}

export function setDocumentMotionMode(mode: MotionMode) {
  document.documentElement.dataset.motionMode = mode;
}
