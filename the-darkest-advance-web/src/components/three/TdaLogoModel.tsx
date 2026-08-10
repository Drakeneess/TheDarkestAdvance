"use client";

import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import { Group, MathUtils } from "three";

export function TdaLogoModel() {
  const groupRef = useRef<Group>(null);
  const autoRotationRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  const { scene } = useGLTF("/models/tda-logo.glb");

  const clonedScene = useMemo(() => {
    return scene.clone(true);
  }, [scene]);

  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateMouse = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = (event.clientY / window.innerHeight) * 2 - 1;

      mouseRef.current = { x, y };
    };

    const updateScroll = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;

      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      setScrollProgress(progress);
    };

    updateScroll();

    window.addEventListener("pointermove", updateMouse, { passive: true });
    window.addEventListener("scroll", updateScroll, { passive: true });

    return () => {
      window.removeEventListener("pointermove", updateMouse);
      window.removeEventListener("scroll", updateScroll);
    };
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const mouse = mouseRef.current;

    const mouseYaw = mouse.x * 0.35;
    const mousePitch = -mouse.y * 0.18;
    const scrollYaw = scrollProgress * 0.25;

    const targetX = -0.06 + mousePitch;
    const targetY = autoRotationRef.current + mouseYaw + scrollYaw;
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