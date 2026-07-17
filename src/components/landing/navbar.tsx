// ─────────────────────────────────────────────────────────────
// Sticky Navigation Bar
// ─────────────────────────────────────────────────────────────
// Auth-aware navigation that transitions from transparent
// (over hero) to solid white on scroll. Shows Sign Up / Sign In
// when logged out, Dashboard link when logged in.
// ─────────────────────────────────────────────────────────────

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";
import type { AuthUser } from "@/types/auth";

interface NavbarProps {
  user: AuthUser | null;
}

export function Navbar({ user }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 10);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "border-b border-slate-200 bg-white shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2">
            <span
              className={`font-heading text-xl font-bold transition-colors duration-300 ${
                isScrolled ? "text-slate-900" : "text-white"
              }`}
            >
              AutoApply
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <Link href="/dashboard">
                <Button
                  variant="gradient"
                  size="md"
                  className={isScrolled ? "" : "border border-white/20"}
                >
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="md"
                    className={`${
                      isScrolled
                        ? "text-slate-600 hover:bg-slate-100"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    variant="gradient"
                    size="md"
                    className={isScrolled ? "" : "border border-white/20"}
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            ref={menuTriggerRef}
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors md:hidden ${
              isScrolled
                ? "text-slate-600 hover:bg-slate-100"
                : "text-white hover:bg-white/10"
            }`}
            aria-label="Open navigation menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* Mobile navigation overlay */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        triggerRef={menuTriggerRef}
      />
    </>
  );
}
