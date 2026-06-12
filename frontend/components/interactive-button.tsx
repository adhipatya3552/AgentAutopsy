"use client";

import { ReactNode, useState, useRef } from "react";

interface InteractiveButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
  fullWidth?: boolean;
}

export function InteractiveButton({
  onClick,
  disabled = false,
  children,
  variant = "primary",
  className = "",
  fullWidth = false,
}: InteractiveButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const baseClasses = "relative overflow-hidden font-medium transition duration-200 text-sm shadow-lg";
  
  const variants = {
    primary:
      "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white disabled:opacity-40",
    secondary:
      "border border-zinc-700 bg-zinc-900/40 hover:bg-zinc-800/80 text-zinc-300 disabled:opacity-40",
    danger:
      "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white disabled:opacity-40",
  };

  const sizeClasses = fullWidth ? "w-full px-8 py-3" : "px-8 py-3";

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`${baseClasses} ${variants[variant]} ${sizeClasses} ${className}`}
    >
      {/* Glow effect on hover */}
      {isHovered && (
        <div
          className="absolute w-32 h-32 rounded-full blur-2xl opacity-40 pointer-events-none"
          style={{
            left: `${mousePosition.x - 64}px`,
            top: `${mousePosition.y - 64}px`,
            background:
              variant === "primary"
                ? "rgba(168, 85, 247, 0.6)"
                : variant === "danger"
                ? "rgba(244, 63, 94, 0.6)"
                : "rgba(100, 116, 139, 0.4)",
            transition: "all 0.1s ease-out",
          }}
        />
      )}

      {/* Sparkle particles on hover */}
      {isHovered && (
        <>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full pointer-events-none animate-ping"
              style={{
                left: `${mousePosition.x + (Math.random() - 0.5) * 40}px`,
                top: `${mousePosition.y + (Math.random() - 0.5) * 40}px`,
                background:
                  variant === "primary"
                    ? "#a855f7"
                    : variant === "danger"
                    ? "#f43f5e"
                    : "#6b7280",
                animationDelay: `${i * 0.1}s`,
                animationDuration: "0.6s",
              }}
            />
          ))}
        </>
      )}

      {/* Shimmer effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isHovered
            ? `linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)`
            : "transparent",
          transform: "translateX(-100%)",
          animation: isHovered ? "shimmer 0.6s infinite" : "none",
        }}
      />

      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </button>
  );
}
