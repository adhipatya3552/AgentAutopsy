"use client";

import { ReactNode, useState, useRef } from "react";

interface HoverCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: "purple" | "blue" | "green" | "red";
}

export function HoverCard({ children, className = "", glowColor = "purple" }: HoverCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const glowColors = {
    purple: "rgba(168, 85, 247, 0.3)",
    blue: "rgba(59, 130, 246, 0.3)",
    green: "rgba(34, 197, 94, 0.3)",
    red: "rgba(244, 63, 94, 0.3)",
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative transition-all duration-300 ${className} ${
        isHovered ? "shadow-2xl" : "shadow-xl"
      }`}
    >
      {/* Glow effect on hover */}
      {isHovered && (
        <div
          className="absolute w-40 h-40 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{
            left: `${mousePosition.x - 80}px`,
            top: `${mousePosition.y - 80}px`,
            background: glowColors[glowColor],
            transition: "all 0.1s ease-out",
          }}
        />
      )}

      {/* Border glow effect */}
      {isHovered && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, ${glowColors[glowColor]}, transparent 50%)`,
            opacity: 0.5,
          }}
        />
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
}
