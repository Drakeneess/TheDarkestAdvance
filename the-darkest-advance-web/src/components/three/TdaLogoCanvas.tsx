"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Float } from "@react-three/drei";
import { Suspense } from "react";
import { TdaLogoModel } from "./TdaLogoModel";

export function TdaLogoCanvas() {
  return (
    <div className="pointer-events-none h-full w-full">
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 35,
        }}
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "low-power",
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[4, 3, 5]} intensity={2.2} />
          <pointLight position={[-3, -2, 3]} intensity={2.6} color="#b00000" />

          <Float speed={1.1} rotationIntensity={0.16} floatIntensity={0.22}>
            <TdaLogoModel />
          </Float>

          <Environment preset="night" />
        </Suspense>
      </Canvas>
    </div>
  );
}