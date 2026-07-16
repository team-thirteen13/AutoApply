"use client";

interface HeroBlobProps {
  className?: string;
}

export function HeroBlob({ className = "" }: HeroBlobProps) {
  return (
    <div
      className={`absolute rounded-full ${className}`}
      style={{
        background: "radial-gradient(circle, #7c3aed 0%, #1e3a8a 100%)",
        filter: "blur(80px)",
        opacity: 0.15,
      }}
    />
  );
}
