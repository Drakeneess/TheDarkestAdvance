"use client";

import dynamic from "next/dynamic";
import { useReducedVisuals } from "@/hooks/useReducedVisuals";

const TdaLogoCanvas = dynamic(
  () =>
    import("@/components/three/TdaLogoCanvas").then(
      (mod) => mod.TdaLogoCanvas
    ),
  {
    ssr: false,
  }
);

export function SiteBackground() {
  const reducedVisuals = useReducedVisuals();

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black">
      <div className="tda-ambient-base absolute inset-0" />
      <div className="tda-ash-gradient absolute inset-0" />

      {!reducedVisuals && (
        <div className="absolute inset-0 opacity-55">
          <TdaLogoCanvas />
        </div>
      )}

      {reducedVisuals && (
        <div className="tda-static-sigil absolute inset-0" aria-hidden="true" />
      )}

      <div className="tda-ash-noise absolute inset-0" />
      <div className="tda-ash-dust absolute inset-0" />
      <div className="tda-ember-dust absolute inset-0" />

      <div className="tda-vignette absolute inset-0" />
    </div>
  );
}