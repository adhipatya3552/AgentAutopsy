"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export function CyberpunkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const prevMousePos = useRef({ x: 0, y: 0 });
  const particles = useRef<Particle[]>([]);

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
      prevMousePos.current = { ...mousePos.current };
      mousePos.current = { x: e.clientX, y: e.clientY };

      // Create particle trail on mouse movement
      const dx = e.clientX - prevMousePos.current.x;
      const dy = e.clientY - prevMousePos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 2) {
        for (let i = 0; i < 3; i++) {
          particles.current.push({
            x: e.clientX + (Math.random() - 0.5) * 20,
            y: e.clientY + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4 - 2,
            life: 1,
            maxLife: 0.8 + Math.random() * 0.4,
            size: 1 + Math.random() * 2,
            color: ["rgba(168, 85, 247,", "rgba(6, 182, 212,", "rgba(34, 197, 94,"][Math.floor(Math.random() * 3)],
          });
        }
      }
    };
    window.addEventListener("mousemove", handleMouseMove);

    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.005;

      // Update particles
      particles.current = particles.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // gravity
        p.life -= 1 / 60;
        return p.life > 0;
      });

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

      // Draw intense cursor glow - main feature
      const { x: mx, y: my } = mousePos.current;

      // Large outer glow ring
      const gradient1 = ctx.createRadialGradient(mx, my, 0, mx, my, 250);
      gradient1.addColorStop(0, "rgba(168, 85, 247, 0.3)");
      gradient1.addColorStop(0.4, "rgba(168, 85, 247, 0.1)");
      gradient1.addColorStop(1, "rgba(168, 85, 247, 0)");
      ctx.fillStyle = gradient1;
      ctx.fillRect(mx - 250, my - 250, 500, 500);

      // Medium cyan glow
      const gradient2 = ctx.createRadialGradient(mx, my, 0, mx, my, 180);
      gradient2.addColorStop(0, "rgba(6, 182, 212, 0.25)");
      gradient2.addColorStop(0.5, "rgba(6, 182, 212, 0.05)");
      gradient2.addColorStop(1, "rgba(6, 182, 212, 0)");
      ctx.fillStyle = gradient2;
      ctx.fillRect(mx - 180, my - 180, 360, 360);

      // Intense core glow
      const gradient3 = ctx.createRadialGradient(mx, my, 0, mx, my, 120);
      gradient3.addColorStop(0, "rgba(168, 85, 247, 0.6)");
      gradient3.addColorStop(0.3, "rgba(6, 182, 212, 0.3)");
      gradient3.addColorStop(1, "rgba(168, 85, 247, 0)");
      ctx.fillStyle = gradient3;
      ctx.fillRect(mx - 120, my - 120, 240, 240);

      // Ultra bright center dot
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.beginPath();
      ctx.arc(mx, my, 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw lines from mouse to nearby grid intersections
      for (let y = 0; y < canvas.height; y += gridSize) {
        for (let x = 0; x < canvas.width; x += gridSize) {
          const dx = mx - x;
          const dy = my - y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 350) {
            const alpha = (1 - dist / 350) * 0.5;
            
            // Brighter lines
            ctx.strokeStyle = `rgba(6, 182, 212, ${alpha * 0.8})`;
            ctx.lineWidth = 2 + Math.sin(time + dist * 0.01) * 0.5;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(x, y);
            ctx.stroke();

            // Pulsing points at grid intersections
            const pulseSize = 3 + Math.sin(time + dist * 0.02) * 1.5;
            ctx.fillStyle = `rgba(6, 182, 212, ${alpha + 0.3})`;
            ctx.beginPath();
            ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
            ctx.fill();

            // Additional glow on points
            const pointGradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
            pointGradient.addColorStop(0, `rgba(168, 85, 247, ${alpha * 0.3})`);
            pointGradient.addColorStop(1, `rgba(168, 85, 247, 0)`);
            ctx.fillStyle = pointGradient;
            ctx.fillRect(x - 15, y - 15, 30, 30);
          }
        }
      }

      // Draw particles
      particles.current.forEach((p) => {
        const alpha = (p.life / p.maxLife) * 0.8;
        ctx.fillStyle = `${p.color} ${alpha})`;
        
        // Particle glow
        const pGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        pGradient.addColorStop(0, `${p.color} ${alpha * 0.6})`);
        pGradient.addColorStop(1, `${p.color} 0)`);
        ctx.fillStyle = pGradient;
        ctx.fillRect(p.x - p.size * 3, p.y - p.size * 3, p.size * 6, p.size * 6);

        // Particle core
        ctx.fillStyle = `${p.color} ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw scanlines effect
      ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
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
