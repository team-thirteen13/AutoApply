// ─────────────────────────────────────────────────────────────
// Mobile Navigation Overlay
// ─────────────────────────────────────────────────────────────
// Slide-from-right mobile menu with semi-transparent backdrop.
// Auth-aware links — closes on link click or backdrop click.
// ─────────────────────────────────────────────────────────────

"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/types/auth";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
}

export function MobileNav({ isOpen, onClose, user }: MobileNavProps) {
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
        className={`absolute right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header with close button */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <span className="font-heading text-lg font-bold text-slate-900">
            AutoApply
          </span>
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
