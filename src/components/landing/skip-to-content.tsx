"use client";

import Link from "next/link";

/**
 * Skip-to-content link for keyboard accessibility (WCAG 2.4.1).
 * Hidden by default, visible on keyboard focus. First focusable element in DOM.
 */
export function SkipToContent() {
  return (
    <Link
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:p-4 focus:text-slate-900 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      Skip to main content
    </Link>
  );
}
