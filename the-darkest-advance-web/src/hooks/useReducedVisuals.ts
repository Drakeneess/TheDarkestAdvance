"use client";

import { useSyncExternalStore } from "react";

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
    addEventListener?: (
      type: "change",
      listener: () => void
    ) => void;
    removeEventListener?: (
      type: "change",
      listener: () => void
    ) => void;
  };
};

function getReducedVisualsSnapshot() {
  if (typeof window === "undefined") return true;

  const smallScreen = window.matchMedia("(max-width: 900px)").matches;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const navigatorInfo = navigator as NavigatorWithHints;

  const lowMemory =
    typeof navigatorInfo.deviceMemory === "number" &&
    navigatorInfo.deviceMemory <= 4;

  const fewCores =
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 4;

  const savesData = Boolean(navigatorInfo.connection?.saveData);

  const slowConnection =
    navigatorInfo.connection?.effectiveType === "slow-2g" ||
    navigatorInfo.connection?.effectiveType === "2g" ||
    navigatorInfo.connection?.effectiveType === "3g";

  return (
    smallScreen ||
    reducedMotion ||
    lowMemory ||
    fewCores ||
    savesData ||
    slowConnection
  );
}

function subscribeToVisualPreferenceChanges(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const smallScreenQuery = window.matchMedia("(max-width: 900px)");
  const reducedMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  const navigatorInfo = navigator as NavigatorWithHints;
  const connection = navigatorInfo.connection;

  smallScreenQuery.addEventListener("change", callback);
  reducedMotionQuery.addEventListener("change", callback);
  connection?.addEventListener?.("change", callback);

  return () => {
    smallScreenQuery.removeEventListener("change", callback);
    reducedMotionQuery.removeEventListener("change", callback);
    connection?.removeEventListener?.("change", callback);
  };
}

export function useReducedVisuals() {
  return useSyncExternalStore(
    subscribeToVisualPreferenceChanges,
    getReducedVisualsSnapshot,
    () => true
  );
}