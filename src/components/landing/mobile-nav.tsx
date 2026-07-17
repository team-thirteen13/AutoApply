// ─────────────────────────────────────────────────────────────
// Mobile Navigation Overlay
// ─────────────────────────────────────────────────────────────
// Slide-from-right mobile menu with semi-transparent backdrop.
// Auth-aware links — closes on link click or backdrop click.
// ─────────────────────────────────────────────────────────────

"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import type { AuthUser } from "@/types/auth";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function MobileNav({ isOpen, onClose, user, triggerRef }: MobileNavProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const containerRef = useFocusTrap(isOpen, triggerRef, { headingRef });

  // Listen for escape custom event from useFocusTrap
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = () => {
      onClose();
    };

    const el = containerRef.current;
    if (el) {
      el.addEventListener("focus-trap-escape", handleEscape);
      return () => el.removeEventListener("focus-trap-escape", handleEscape);
    }
  }, [isOpen, onClose, containerRef]);

  return (
    <div
      className={`fixed inset-0 z-50 md:hidden ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu panel */}
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        id="mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        tabIndex={-1}
        className={`absolute right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header with close button */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <h2 ref={headingRef} tabIndex={-1} className="font-heading text-lg font-bold text-slate-900 outline-none">
            AutoApply
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          {user ? (
            <Link href="/dashboard" onClick={onClose}>
              <Button variant="gradient" size="lg" className="w-full">
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" onClick={onClose}>
                <Button variant="ghost" size="lg" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link href="/register" onClick={onClose}>
                <Button variant="gradient" size="lg" className="w-full">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
