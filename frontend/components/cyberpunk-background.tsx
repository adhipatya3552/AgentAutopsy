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
  type: "trail" | "burst" | "float";
}

interface FloatingObject {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
}

export function CyberpunkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const prevMousePos = useRef({ x: 0, y: 0 });
  const particles = useRef<Particle[]>([]);
  const floatingObjects = useRef<FloatingObject[]>([]);
  const targetMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize floating objects
    for (let i = 0; i < 20; i++) {
      floatingObjects.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 100,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: 2 + Math.random() * 8,
        color: ["rgba(168, 85, 247,", "rgba(6, 182, 212,", "rgba(236, 72, 153,", "rgba(34, 197, 94,"][Math.floor(Math.random() * 4)],
        rotation: Math.random() * Math.PI * 2,
      });
    }

    // Track mouse position
    const handleMouseMove = (e: MouseEvent) => {
      prevMousePos.current = { ...mousePos.current };
      targetMouse.current = { x: e.clientX, y: e.clientY };

      // Create particle trail on mouse movement
      const dx = e.clientX - prevMousePos.current.x;
      const dy = e.clientY - prevMousePos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 1) {
        // Add trail particles
        for (let i = 0; i < 4; i++) {
          particles.current.push({
            x: e.clientX + (Math.random() - 0.5) * 30,
            y: e.clientY + (Math.random() - 0.5) * 30,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6 - 1,
            life: 1,
            maxLife: 1 + Math.random() * 0.5,
            size: 0.5 + Math.random() * 2,
            color: ["rgba(168, 85, 247,", "rgba(6, 182, 212,", "rgba(236, 72, 153,"][Math.floor(Math.random() * 3)],
            type: "trail",
          });
        }

        // Add burst particles on faster movement
        if (distance > 10) {
          for (let i = 0; i < 2; i++) {
            particles.current.push({
              x: e.clientX,
              y: e.clientY,
              vx: (Math.random() - 0.5) * 12,
              vy: (Math.random() - 0.5) * 12,
              life: 1,
              maxLife: 0.6 + Math.random() * 0.3,
              size: 1.5 + Math.random() * 3,
              color: ["rgba(168, 85, 247,", "rgba(6, 182, 212,"][Math.floor(Math.random() * 2)],
              type: "burst",
            });
          }
        }
      }

      // Smooth mouse position interpolation
      mousePos.current.x += (targetMouse.current.x - mousePos.current.x) * 0.15;
      mousePos.current.y += (targetMouse.current.y - mousePos.current.y) * 0.15;
    };

    window.addEventListener("mousemove", handleMouseMove);

    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.016; // ~60fps

      // Update particles
      particles.current = particles.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.vx *= 0.98; // friction
        p.life -= 1 / 60;
        return p.life > 0;
      });

      // Update floating objects
      floatingObjects.current.forEach((obj) => {
        obj.x += obj.vx;
        obj.y += obj.vy;
        obj.rotation += 0.02;

        // Wrap around edges
        if (obj.x > canvas.width + 50) obj.x = -50;
        if (obj.x < -50) obj.x = canvas.width + 50;
        if (obj.y > canvas.height + 50) obj.y = -50;
        if (obj.y < -50) obj.y = canvas.height + 50;

        // Slight attraction to mouse for depth effect
        const mx = mousePos.current.x;
        const my = mousePos.current.y;
        const dx = mx - obj.x;
        const dy = my - obj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 400 && dist > 0) {
          obj.vx += (dx / dist) * 0.02;
          obj.vy += (dy / dist) * 0.02;
        }

        // Damping
        obj.vx *= 0.99;
        obj.vy *= 0.99;
      });

      // ===== BACKGROUND LAYERS =====

      // Layer 1: Dark gradient background
      const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bgGradient.addColorStop(0, "#0a0a12");
      bgGradient.addColorStop(0.5, "#07070a");
      bgGradient.addColorStop(1, "#0d0a15");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Layer 2: Animated flowing mesh
      drawFlowingMesh(ctx, canvas, time);

      // Layer 3: Particle background (floating objects)
      floatingObjects.current.forEach((obj, idx) => {
        const pulse = Math.sin(time * 0.3 + idx) * 0.3 + 0.7;

        // Draw geometric shapes
        ctx.save();
        ctx.translate(obj.x, obj.y);
        ctx.rotate(obj.rotation);

        // Shape choice based on index
        if (idx % 3 === 0) {
          // Triangle
          ctx.fillStyle = `${obj.color} ${0.15 * pulse})`;
          ctx.beginPath();
          ctx.moveTo(0, -obj.size);
          ctx.lineTo(obj.size, obj.size);
          ctx.lineTo(-obj.size, obj.size);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = `${obj.color} ${0.25 * pulse})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        } else if (idx % 3 === 1) {
          // Circle with glow
          ctx.fillStyle = `${obj.color} ${0.12 * pulse})`;
          ctx.beginPath();
          ctx.arc(0, 0, obj.size * 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `${obj.color} ${0.2 * pulse})`;
          ctx.beginPath();
          ctx.arc(0, 0, obj.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Square
          ctx.fillStyle = `${obj.color} ${0.15 * pulse})`;
          ctx.fillRect(-obj.size, -obj.size, obj.size * 2, obj.size * 2);

          ctx.strokeStyle = `${obj.color} ${0.25 * pulse})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(-obj.size, -obj.size, obj.size * 2, obj.size * 2);
        }

        ctx.restore();
      });

      // Layer 4: Mouse-reactive vortex
      drawMouseVortex(ctx, canvas, mousePos.current, time);

      // Layer 5: Dynamic particle effects
      particles.current.forEach((p) => {
        const alpha = p.life / p.maxLife;

        if (p.type === "trail") {
          // Soft glowing trails
          const pGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
          pGradient.addColorStop(0, `${p.color} ${alpha * 0.6})`);
          pGradient.addColorStop(1, `${p.color} 0)`);
          ctx.fillStyle = pGradient;
          ctx.fillRect(p.x - p.size * 4, p.y - p.size * 4, p.size * 8, p.size * 8);

          ctx.fillStyle = `${p.color} ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === "burst") {
          // Bright burst particles
          ctx.fillStyle = `${p.color} ${alpha * 0.8})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          const bGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
          bGradient.addColorStop(0, `${p.color} ${alpha * 0.4})`);
          bGradient.addColorStop(1, `${p.color} 0)`);
          ctx.fillStyle = bGradient;
          ctx.fillRect(p.x - p.size * 2, p.y - p.size * 2, p.size * 4, p.size * 4);
        }
      });

      // Layer 6: Scanlines (CRT effect)
      ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
      ctx.lineWidth = 1;
      for (let y = 0; y < canvas.height; y += 3) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Layer 7: Noise effect
      addNoiseLayer(ctx, canvas, time);

      animationId = requestAnimationFrame(animate);
    };

    function drawFlowingMesh(
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      time: number
    ) {
      const gridSize = 80;
      const waveStrength = 8;

      // Horizontal lines
      for (let y = 0; y < canvas.height; y += gridSize) {
        const baseAlpha = 0.08 + Math.sin(time * 0.3 + y * 0.005) * 0.04;
        ctx.strokeStyle = `rgba(168, 85, 247, ${baseAlpha})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();

        for (let x = 0; x < canvas.width; x += gridSize / 4) {
          const wave =
            Math.sin(time * 0.4 + (x + y) * 0.01) * waveStrength +
            Math.cos(time * 0.25 + y * 0.008) * waveStrength * 0.5;
          if (x === 0) {
            ctx.moveTo(x, y + wave);
          } else {
            ctx.lineTo(x, y + wave);
          }
        }
        ctx.stroke();
      }

      // Vertical lines
      for (let x = 0; x < canvas.width; x += gridSize) {
        const baseAlpha = 0.08 + Math.sin(time * 0.3 + x * 0.005) * 0.04;
        ctx.strokeStyle = `rgba(6, 182, 212, ${baseAlpha})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();

        for (let y = 0; y < canvas.height; y += gridSize / 4) {
          const wave =
            Math.cos(time * 0.4 + (x + y) * 0.01) * waveStrength +
            Math.sin(time * 0.25 + x * 0.008) * waveStrength * 0.5;
          if (y === 0) {
            ctx.moveTo(x + wave, y);
          } else {
            ctx.lineTo(x + wave, y);
          }
        }
        ctx.stroke();
      }

      // Diagonal pulsing lines
      for (let i = 0; i < canvas.width + canvas.height; i += gridSize * 1.5) {
        const alpha = Math.sin(time * 0.5 + i * 0.01) * 0.05 + 0.03;
        ctx.strokeStyle = `rgba(236, 72, 153, ${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(i, -100);
        ctx.lineTo(i - canvas.height, canvas.height + 100);
        ctx.stroke();
      }
    }

    function drawMouseVortex(
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      mouse: { x: number; y: number },
      time: number
    ) {
      const { x: mx, y: my } = mouse;

      // Outer ring
      const ring1 = ctx.createRadialGradient(mx, my, 0, mx, my, 300);
      ring1.addColorStop(0, "rgba(168, 85, 247, 0.05)");
      ring1.addColorStop(0.3, "rgba(6, 182, 212, 0.08)");
      ring1.addColorStop(1, "rgba(168, 85, 247, 0)");
      ctx.fillStyle = ring1;
      ctx.beginPath();
      ctx.arc(mx, my, 300, 0, Math.PI * 2);
      ctx.fill();

      // Middle ring
      const ring2 = ctx.createRadialGradient(mx, my, 0, mx, my, 200);
      ring2.addColorStop(0, "rgba(6, 182, 212, 0.15)");
      ring2.addColorStop(0.5, "rgba(236, 72, 153, 0.1)");
      ring2.addColorStop(1, "rgba(6, 182, 212, 0)");
      ctx.fillStyle = ring2;
      ctx.beginPath();
      ctx.arc(mx, my, 200, 0, Math.PI * 2);
      ctx.fill();

      // Inner core with spiral effect
      for (let i = 0; i < 12; i++) {
        const angle = (time + i * Math.PI / 6) * 2;
        const dist = 80 + Math.sin(time * 0.5) * 20;
        const x = mx + Math.cos(angle) * dist;
        const y = my + Math.sin(angle) * dist;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 40);
        gradient.addColorStop(0, "rgba(168, 85, 247, 0.3)");
        gradient.addColorStop(1, "rgba(168, 85, 247, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 40, 0, Math.PI * 2);
        ctx.fill();
      }

      // Center point
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.beginPath();
      ctx.arc(mx, my, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    function addNoiseLayer(
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      time: number
    ) {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 255;
        if (noise > 240) {
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
          data[i + 3] = Math.random() * 15;
        }
      }

      ctx.putImageData(imageData, 0, 0);
    }

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
