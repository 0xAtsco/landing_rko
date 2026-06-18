"use client";

import { useSyncExternalStore } from "react";

export type MotionMode = "full" | "lite" | "reduced";

type NavigatorWithHints = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

function readForcedMotionMode(): MotionMode | null {
  try {
    const searchMode = new URLSearchParams(window.location.search).get("motion");
    const savedMode = window.localStorage.getItem("vibecamp-motion");
    const mode = searchMode ?? savedMode;

    if (mode === "full" || mode === "lite" || mode === "reduced") return mode;
  } catch {
    return null;
  }

  return null;
}

function resolveMotionMode() {
  if (typeof window === "undefined") return "lite";
  const forcedMode = readForcedMotionMode();
  if (forcedMode) return forcedMode;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "reduced";

  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!canHover) return "lite";

  const navigatorHints = window.navigator as NavigatorWithHints;
  const memory = navigatorHints.deviceMemory ?? 4;
  const cores = window.navigator.hardwareConcurrency ?? 4;
  const isLikelyRetinaLaptop = window.devicePixelRatio > 1.5 && window.innerWidth < 1600;
  const canRunFullMotion =
    window.innerWidth >= 1440 &&
    !isLikelyRetinaLaptop &&
    memory >= 8 &&
    cores >= 8 &&
    !navigatorHints.connection?.saveData;

  return canRunFullMotion ? "full" : "lite";
}

function subscribe(callback: () => void) {
  const queries = [
    window.matchMedia("(prefers-reduced-motion: reduce)"),
    window.matchMedia("(hover: hover) and (pointer: fine)"),
  ];
  queries.forEach((query) => query.addEventListener("change", callback));
  window.addEventListener("resize", callback, { passive: true });
  window.addEventListener("storage", callback);

  return () => {
    queries.forEach((query) => query.removeEventListener("change", callback));
    window.removeEventListener("resize", callback);
    window.removeEventListener("storage", callback);
  };
}

export function useMotionMode(): MotionMode {
  return useSyncExternalStore(subscribe, resolveMotionMode, () => "lite");
}

export function setDocumentMotionMode(mode: MotionMode) {
  document.documentElement.dataset.motionMode = mode;
}
