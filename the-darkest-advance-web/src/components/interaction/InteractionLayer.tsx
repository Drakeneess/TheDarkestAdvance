"use client";

import { useEffect } from "react";

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

    const updatePointer = (event: PointerEvent) => {
      target.x = (event.clientX / window.innerWidth) * 2 - 1;
      target.y = (event.clientY / window.innerHeight) * 2 - 1;
    };

    const updateScroll = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;

      target.scroll = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    };

    const animate = () => {
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      current.scroll += (target.scroll - current.scroll) * 0.08;

      root.style.setProperty("--input-x", current.x.toFixed(4));
      root.style.setProperty("--input-y", current.y.toFixed(4));
      root.style.setProperty("--scroll-progress", current.scroll.toFixed(4));

      root.style.setProperty("--parallax-soft-x", `${current.x * -8}px`);
      root.style.setProperty("--parallax-soft-y", `${current.y * -5}px`);

      root.style.setProperty("--parallax-mid-x", `${current.x * -16}px`);
      root.style.setProperty("--parallax-mid-y", `${current.y * -10}px`);

      root.style.setProperty("--parallax-strong-x", `${current.x * -28}px`);
      root.style.setProperty("--parallax-strong-y", `${current.y * -18}px`);

      requestAnimationFrame(animate);
    };

    updateScroll();

    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("scroll", updateScroll, { passive: true });

    const animationFrame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("scroll", updateScroll);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return null;
}