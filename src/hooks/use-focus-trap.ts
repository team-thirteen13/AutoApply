"use client";

import { useEffect, useRef, useCallback } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Lightweight focus trap for slide-over panels and modals.
 *
 * - Moves focus into the container when `open` becomes true
 * - Traps Tab / Shift+Tab inside the container
 * - Closes on Escape (unless `ignoreEscape` is true)
 * - Returns focus to `triggerRef` when closed
 * - Sets `aria-modal="true"` on the container
 */
export function useFocusTrap<T extends HTMLElement>(
  open: boolean,
  triggerRef?: React.RefObject<HTMLElement | null>,
  options?: { ignoreEscape?: boolean; headingRef?: React.RefObject<HTMLElement | null> },
) {
  const containerRef = useRef<T>(null);
  const ignoreEscape = options?.ignoreEscape ?? false;
  const headingRef = options?.headingRef;

  // Move focus into the panel when it opens; return focus when it closes
  useEffect(() => {
    if (open && containerRef.current) {
      // Set aria-modal
      containerRef.current.setAttribute("aria-modal", "true");

      // Focus the heading first, then the container
      const focusTarget =
        headingRef?.current ?? containerRef.current;
      // Small delay to ensure DOM is painted
      const raf = requestAnimationFrame(() => {
        focusTarget.focus();
      });
      return () => cancelAnimationFrame(raf);
    }

    if (!open && triggerRef?.current) {
      triggerRef.current.focus();
    }
  }, [open, triggerRef, headingRef]);

  // Tab trap + Escape handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!containerRef.current) return;

      if (e.key === "Escape" && !ignoreEscape) {
        e.stopPropagation();
        // Find the onClose from the closest context — dispatched as custom event
        containerRef.current.dispatchEvent(
          new CustomEvent("focus-trap-escape", { bubbles: true }),
        );
        return;
      }

      if (e.key !== "Tab") return;

      const focusable = containerRef.current.querySelectorAll(FOCUSABLE);
      if (focusable.length === 0) return;

      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [ignoreEscape],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [open, handleKeyDown]);

  return containerRef;
}
