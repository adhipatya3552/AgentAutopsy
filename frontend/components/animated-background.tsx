'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

interface OrbitalPoint {
  angle: number;
  distance: number;
  size: number;
  color: string;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const prevMousePos = useRef({ x: 0, y: 0 });
  const particles = useRef<Particle[]>([]);
  const orbitals = useRef<OrbitalPoint[]>([]);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize orbital points
    orbitals.current = Array.from({ length: 8 }, (_, i) => ({
      angle: (i / 8) * Math.PI * 2,
      distance: 150,
      size: 2 + Math.random() * 2,
      color: ['rgba(168, 85, 247,', 'rgba(6, 182, 212,', 'rgba(34, 197, 94,', 'rgba(236, 72, 153,'][i % 4],
    }));

    // Track mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      prevMousePos.current = { ...mousePos.current };
      mousePos.current = { x: e.clientX, y: e.clientY };

      // Create particle trail
      const dx = e.clientX - prevMousePos.current.x;
      const dy = e.clientY - prevMousePos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 1) {
        for (let i = 0; i < 4; i++) {
          particles.current.push({
            x: e.clientX + (Math.random() - 0.5) * 30,
            y: e.clientY + (Math.random() - 0.5) * 30,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6 - 2,
            size: 1 + Math.random() * 3,
            color: ['rgba(168, 85, 247,', 'rgba(6, 182, 212,', 'rgba(34, 197, 94,'][Math.floor(Math.random() * 3)],
            alpha: 0.8,
            decay: 0.015 + Math.random() * 0.01,
          });
        }
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let animationId: number;
    const animate = () => {
      timeRef.current += 1;

      // Clear canvas with fade effect
      ctx.fillStyle = 'rgba(7, 7, 10, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const { x: mx, y: my } = mousePos.current;

      // Draw animated flowing mesh
      drawFlowingMesh(ctx, canvas, timeRef.current);

      // Draw floating geometric shapes
      drawFloatingShapes(ctx, canvas, timeRef.current, mx, my);

      // Draw orbital rings around cursor
      drawOrbitalRings(ctx, mx, my, timeRef.current);

      // Update and draw particles
      particles.current = particles.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.alpha -= p.decay;
        return p.alpha > 0;
      });

      particles.current.forEach((p) => {
        // Particle glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        gradient.addColorStop(0, `${p.color} ${p.alpha * 0.6})`);
        gradient.addColorStop(1, `${p.color} 0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(p.x - p.size * 4, p.y - p.size * 4, p.size * 8, p.size * 8);

        // Particle core
        ctx.fillStyle = `${p.color} ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw large cursor-following glow
      drawCursorGlow(ctx, mx, my);

      // Draw scanlines for CRT effect
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 1;
      for (let y = 0; y < canvas.height; y += 3) {
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
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
    />
  );
}

function drawFlowingMesh(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) {
  const gridSize = 80;
  const waveAmplitude = 20;
  const waveFrequency = 0.02;

  ctx.strokeStyle = 'rgba(139, 92, 246, 0.08)';
  ctx.lineWidth = 1;

  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    for (let y = 0; y < canvas.height; y += 5) {
      const wave = Math.sin((x * waveFrequency + time * 0.005) * Math.PI) * waveAmplitude;
      ctx.lineTo(x + wave, y);
    }
    ctx.stroke();
  }

  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += 5) {
      const wave = Math.cos((y * waveFrequency + time * 0.005) * Math.PI) * waveAmplitude;
      ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
}

function drawFloatingShapes(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number, mx: number, my: number) {
  const shapes = [
    { x: canvas.width * 0.2, y: canvas.height * 0.3, type: 'circle' as const },
    { x: canvas.width * 0.8, y: canvas.height * 0.2, type: 'triangle' as const },
    { x: canvas.width * 0.15, y: canvas.height * 0.7, type: 'square' as const },
    { x: canvas.width * 0.85, y: canvas.height * 0.65, type: 'circle' as const },
    { x: canvas.width * 0.5, y: canvas.height * 0.1, type: 'triangle' as const },
  ];

  shapes.forEach((shape, idx) => {
    const dx = mx - shape.x;
    const dy = my - shape.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const pull = Math.max(0, 1 - distance / 400);

    // Floating motion
    const floatX = shape.x + Math.sin(time * 0.003 + idx) * 30;
    const floatY = shape.y + Math.cos(time * 0.003 + idx * 0.5) * 30;

    // Pull toward cursor
    const finalX = floatX + dx * pull * 0.1;
    const finalY = floatY + dy * pull * 0.1;

    // Color breathing
    const alpha = 0.1 + Math.sin(time * 0.005 + idx) * 0.05 + pull * 0.15;
    const colors = ['rgba(168, 85, 247,', 'rgba(6, 182, 212,', 'rgba(34, 197, 94,'];
    const color = colors[idx % colors.length];

    ctx.fillStyle = `${color} ${alpha})`;
    ctx.strokeStyle = `${color} ${alpha * 0.8})`;
    ctx.lineWidth = 2;

    const size = 40 + Math.sin(time * 0.004) * 10;

    if (shape.type === 'circle') {
      ctx.beginPath();
      ctx.arc(finalX, finalY, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (shape.type === 'triangle') {
      ctx.save();
      ctx.translate(finalX, finalY);
      ctx.rotate((time * 0.002) % (Math.PI * 2));
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size, size);
      ctx.lineTo(-size, size);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (shape.type === 'square') {
      ctx.save();
      ctx.translate(finalX, finalY);
      ctx.rotate((time * 0.0015) % (Math.PI * 2));
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.strokeRect(-size / 2, -size / 2, size, size);
      ctx.restore();
    }
  });
}

function drawOrbitalRings(ctx: CanvasRenderingContext2D, mx: number, my: number, time: number) {
  const orbitals = [
    { radius: 100, rotation: time * 0.003, color: 'rgba(168, 85, 247,' },
    { radius: 160, rotation: time * -0.002, color: 'rgba(6, 182, 212,' },
    { radius: 220, rotation: time * 0.0015, color: 'rgba(34, 197, 94,' },
  ];

  orbitals.forEach((orbital) => {
    // Ring
    ctx.strokeStyle = `${orbital.color} 0.15)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(mx, my, orbital.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Points on ring
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + orbital.rotation;
      const x = mx + Math.cos(angle) * orbital.radius;
      const y = my + Math.sin(angle) * orbital.radius;
      const pointSize = 2 + Math.sin(time * 0.01 + i) * 1;

      ctx.fillStyle = `${orbital.color} 0.6)`;
      ctx.beginPath();
      ctx.arc(x, y, pointSize, 0, Math.PI * 2);
      ctx.fill();

      // Point glow
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 12);
      glow.addColorStop(0, `${orbital.color} 0.3)`);
      glow.addColorStop(1, `${orbital.color} 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(x - 12, y - 12, 24, 24);
    }
  });
}

function drawCursorGlow(ctx: CanvasRenderingContext2D, mx: number, my: number) {
  // Large outer glow
  const gradient1 = ctx.createRadialGradient(mx, my, 0, mx, my, 300);
  gradient1.addColorStop(0, 'rgba(168, 85, 247, 0.2)');
  gradient1.addColorStop(0.5, 'rgba(6, 182, 212, 0.1)');
  gradient1.addColorStop(1, 'rgba(168, 85, 247, 0)');
  ctx.fillStyle = gradient1;
  ctx.fillRect(mx - 300, my - 300, 600, 600);

  // Medium glow
  const gradient2 = ctx.createRadialGradient(mx, my, 0, mx, my, 150);
  gradient2.addColorStop(0, 'rgba(34, 197, 94, 0.15)');
  gradient2.addColorStop(1, 'rgba(34, 197, 94, 0)');
  ctx.fillStyle = gradient2;
  ctx.fillRect(mx - 150, my - 150, 300, 300);

  // Center dot
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(mx, my, 2, 0, Math.PI * 2);
  ctx.fill();
}
