"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, useGLTF } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

const MODEL_PATH = "/models/tda-logo.glb";

function enhanceMaterial(material: THREE.Material) {
  const cloned = material.clone();

  if (
    cloned instanceof THREE.MeshStandardMaterial ||
    cloned instanceof THREE.MeshPhysicalMaterial
  ) {
    cloned.metalness = 0.85;
    cloned.roughness = 0.32;
    cloned.emissive = new THREE.Color("#2a0303");
    cloned.emissiveIntensity = 0.55;
  }

  return cloned;
}

function BrokenArchiveLogo() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_PATH);

  const model = useMemo(() => {
    const clonedScene = scene.clone(true);

    clonedScene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      object.castShadow = false;
      object.receiveShadow = false;

      if (Array.isArray(object.material)) {
        object.material = object.material.map(enhanceMaterial);
      } else {
        object.material = enhanceMaterial(object.material);
      }
    });

    return clonedScene;
  }, [scene]);

  useFrame(({ clock, mouse }) => {
    if (!groupRef.current) return;

    const time = clock.getElapsedTime();

    groupRef.current.rotation.y = -0.45 + Math.sin(time * 0.18) * 0.08 + mouse.x * 0.12;
    groupRef.current.rotation.x = 0.16 + Math.cos(time * 0.15) * 0.05 - mouse.y * 0.08;
    groupRef.current.rotation.z = -0.08 + Math.sin(time * 0.12) * 0.03;
  });

  return (
    <group ref={groupRef} position={[0.35, -0.08, 0]} rotation={[0.12, -0.45, -0.08]} scale={2.45}>
      <primitive object={model} />
    </group>
  );
}

export default function NotFoundLogoCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0.1, 5.4], fov: 38 }}
      dpr={[1, 1.7]}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      }}
    >
      <ambientLight intensity={0.45} />

      <directionalLight position={[3.5, 2.5, 4]} intensity={2.2} color="#ff3b2f" />
      <pointLight position={[-2.5, -0.5, 2]} intensity={1.2} color="#7f0707" />

      <Suspense fallback={null}>
        <Float speed={1.1} rotationIntensity={0.25} floatIntensity={0.45}>
          <BrokenArchiveLogo />
        </Float>
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_PATH);