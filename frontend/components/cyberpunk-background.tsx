"use client";

import { useEffect, useRef } from "react";

export function CyberpunkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Track mouse position
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);

    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.005;

      // Clear with dark background
      ctx.fillStyle = "#07070a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid lines with animation
      const gridSize = 60;
      const waveAmount = Math.sin(time) * 2;

      // Horizontal grid lines
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.strokeStyle = `rgba(139, 92, 246, ${0.1 + Math.sin(time + y * 0.01) * 0.05})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);

        for (let x = 0; x < canvas.width; x += gridSize / 4) {
          const wave = Math.sin(time + (x + y) * 0.01) * 3;
          ctx.lineTo(x, y + wave);
        }
        ctx.stroke();
      }

      // Vertical grid lines
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.1 + Math.sin(time + x * 0.01) * 0.05})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);

        for (let y = 0; y < canvas.height; y += gridSize / 4) {
          const wave = Math.cos(time + (x + y) * 0.01) * 3;
          ctx.lineTo(x + wave, y);
        }
        ctx.stroke();
      }

      // Draw pulsing neon orbs
      const orbs = [
        {
          x: 0.2,
          y: 0.2,
          baseSize: 80,
          color: "rgba(168, 85, 247, ",
          glowColor: "#a855f7",
        },
        {
          x: 0.75,
          y: 0.25,
          baseSize: 100,
          color: "rgba(34, 197, 94, ",
          glowColor: "#22c55e",
        },
        {
          x: 0.8,
          y: 0.8,
          baseSize: 90,
          color: "rgba(59, 130, 246, ",
          glowColor: "#3b82f6",
        },
      ];

      orbs.forEach((orb, idx) => {
        const x = orb.x * canvas.width;
        const y = orb.y * canvas.height;
        const pulse = Math.sin(time * 0.5 + idx) * 0.5 + 1.2;
        const size = orb.baseSize * pulse;

        // Glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
        gradient.addColorStop(0, orb.color + (0.3 * pulse) + ")");
        gradient.addColorStop(1, orb.color + "0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(x - size * 2, y - size * 2, size * 4, size * 4);

        // Core circle
        ctx.fillStyle = orb.color + (0.5 * pulse) + ")";
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw lines from mouse to grid intersections
      const { x: mx, y: my } = mousePos.current;
      for (let y = 0; y < canvas.height; y += gridSize) {
        for (let x = 0; x < canvas.width; x += gridSize) {
          const dx = mx - x;
          const dy = my - y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 300) {
            const alpha = (1 - dist / 300) * 0.3;
            ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(x, y);
            ctx.stroke();

            // Draw pulsing point
            ctx.fillStyle = `rgba(168, 85, 247, ${alpha + 0.2})`;
            ctx.beginPath();
            ctx.arc(x, y, 2 + Math.sin(time + dist * 0.01) * 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Draw scanlines effect
      ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
      ctx.lineWidth = 1;
      for (let y = 0; y < canvas.height; y += 2) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"
    />
  );
}
