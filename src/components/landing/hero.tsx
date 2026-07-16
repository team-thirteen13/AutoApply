"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroBlob } from "./hero-blob";

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in after mount
    const timer = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  return (
    <section
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-hero-start to-hero-end flex items-center justify-center"
      style={{
        animation: "none",
      }}
    >
      {/* Gradient blob shapes for depth */}
      <HeroBlob className="w-96 h-96 top-20 -left-20" />
      <HeroBlob className="w-72 h-72 bottom-20 -right-10" />
      <HeroBlob className="w-48 h-48 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      {/* Content with fade-in animation */}
      <div
        className={`max-w-6xl mx-auto px-4 text-center relative z-10 transition-opacity duration-600 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-text-on-dark tracking-tight">
          Build Resumes That Get You Hired
        </h1>
        <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
          Create professional resumes with AI-powered suggestions. Land your
          dream job faster.
        </p>
        <div className="mt-10">
          <Link href="/register">
            <Button variant="gradient" size="lg">
              Sign Up for Free
            </Button>
          </Link>
        </div>
      </div>

      {/* Gradient fade at bottom — smooth transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />

      {/* Reduced motion: disable animation, show content instantly */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          section {
            animation: none !important;
          }
          .transition-opacity {
            transition: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </section>
  );
}
