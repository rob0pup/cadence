"use client";

import * as React from "react";

/**
 * Lightweight animated bar visualizer. Driven by requestAnimationFrame and the
 * play state (no Web Audio graph, so it works for cross-origin streams too).
 */
export function Visualizer({ active }: { active: boolean }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const activeRef = React.useRef(active);
  activeRef.current = active;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const bars = 28;
    const heights = new Array(bars).fill(0.04);
    let t = 0;
    let raf = 0;

    const render = () => {
      t += 0.06;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = getComputedStyle(canvas).color;
      const gap = 2;
      const bw = (width - gap * (bars - 1)) / bars;
      for (let i = 0; i < bars; i++) {
        const target = activeRef.current
          ? 0.15 + 0.85 * Math.abs(Math.sin(t + i * 0.5) * Math.cos(t * 0.7 + i))
          : 0.04;
        heights[i] += (target - heights[i]) * 0.18;
        const h = Math.max(2, heights[i] * height);
        ctx.fillRect(i * (bw + gap), height - h, bw, h);
      }
      raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={44}
      className="h-11 w-full text-foreground/60"
    />
  );
}
