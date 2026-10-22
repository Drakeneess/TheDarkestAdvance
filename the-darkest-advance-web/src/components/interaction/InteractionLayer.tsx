"use client";

import { useEffect } from "react";

const SETTLE_EPSILON = 0.0005;

export function InteractionLayer() {
  useEffect(() => {
    const root = document.documentElement;

    const target = {
      x: 0,
      y: 0,
      scroll: 0,
    };

    const current = {
      x: 0,
      y: 0,
      scroll: 0,
    };

    let animationFrame: number | null = null;

    const writeStyles = () => {
      root.style.setProperty("--input-x", current.x.toFixed(4));
      root.style.setProperty("--input-y", current.y.toFixed(4));
      root.style.setProperty("--scroll-progress", current.scroll.toFixed(4));

      root.style.setProperty("--parallax-soft-x", `${current.x * -8}px`);
      root.style.setProperty("--parallax-soft-y", `${current.y * -5}px`);

      root.style.setProperty("--parallax-mid-x", `${current.x * -16}px`);
      root.style.setProperty("--parallax-mid-y", `${current.y * -10}px`);

      root.style.setProperty("--parallax-strong-x", `${current.x * -28}px`);
      root.style.setProperty("--parallax-strong-y", `${current.y * -18}px`);
    };

    const isSettled = () =>
      Math.abs(target.x - current.x) < SETTLE_EPSILON &&
      Math.abs(target.y - current.y) < SETTLE_EPSILON &&
      Math.abs(target.scroll - current.scroll) < SETTLE_EPSILON;

    const animate = () => {
      current.x += (target.x - current.x) * 0.1;
      current.y += (target.y - current.y) * 0.1;
      current.scroll += (target.scroll - current.scroll) * 0.1;

      if (isSettled()) {
        current.x = target.x;
        current.y = target.y;
        current.scroll = target.scroll;
        writeStyles();
        animationFrame = null;
        return;
      }

      writeStyles();
      animationFrame = requestAnimationFrame(animate);
    };

    const requestAnimation = () => {
      if (animationFrame === null) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    const updatePointer = (event: PointerEvent) => {
      target.x = (event.clientX / window.innerWidth) * 2 - 1;
      target.y = (event.clientY / window.innerHeight) * 2 - 1;
      requestAnimation();
    };

    const updateScroll = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;

      target.scroll = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      requestAnimation();
    };

    writeStyles();
    updateScroll();

    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("scroll", updateScroll, { passive: true });

    return () => {
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("scroll", updateScroll);

      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  return null;
}
