"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";

interface LazySectionProps {
  children: ReactNode;
  rootMargin?: string;
  className?: string;
}

/**
 * Lazy loading wrapper for below-the-fold sections (D-13).
 * Uses IntersectionObserver to defer rendering until near viewport.
 * Renders a placeholder with min-h-[400px] to prevent CLS.
 */
export function LazySection({
  children,
  rootMargin = "200px",
  className,
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

  if (!isVisible) {
    return <div ref={containerRef} className={className} style={{ minHeight: "400px" }} />;
  }

  return <div className={className}>{children}</div>;
}
