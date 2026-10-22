"use client";

import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { Group, MathUtils } from "three";

export function TdaLogoModel() {
  const groupRef = useRef<Group>(null);
  const scrollProgressRef = useRef(0);

  const { scene } = useGLTF("/models/tda-logo.glb");

  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    const updateScroll = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;

      scrollProgressRef.current =
        maxScroll > 0 ? window.scrollY / maxScroll : 0;
    };

    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateScroll);
    };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const mouse = state.pointer;
    const mouseYaw = mouse.x * 0.35;
    const mousePitch = -mouse.y * 0.18;
    const scrollYaw = scrollProgressRef.current * 0.25;

    const targetX = -0.06 + mousePitch;
    const targetY = mouseYaw + scrollYaw;
    const targetZ = mouse.x * -0.035;

    const smooth = 1 - Math.exp(-4 * delta);

    groupRef.current.rotation.x = MathUtils.lerp(
      groupRef.current.rotation.x,
      targetX,
      smooth
    );

    groupRef.current.rotation.y = MathUtils.lerp(
      groupRef.current.rotation.y,
      targetY,
      smooth
    );

    groupRef.current.rotation.z = MathUtils.lerp(
      groupRef.current.rotation.z,
      targetZ,
      smooth
    );
  });

  return (
    <group ref={groupRef} dispose={null} scale={2.2} position={[0, -0.1, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload("/models/tda-logo.glb");
