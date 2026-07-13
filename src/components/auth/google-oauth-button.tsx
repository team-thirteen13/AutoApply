"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

// ── Navigation helper (injectable for testing) ─────────────

export function navigateToOAuthUrl(url: string): void {
  window.location.assign(url);
}

// ── Types ──────────────────────────────────────────────────

interface GoogleOAuthButtonProps {
  nextPath?: string;
  className?: string;
}

// ── Component ──────────────────────────────────────────────

export function GoogleOAuthButton({
  nextPath = "/dashboard",
  className = "",
}: GoogleOAuthButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    if (pending) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/oauth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextPath }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data || data.success !== true || !data.data?.url) {
        const message =
          data?.error?.message ??
          "Unable to start Google sign-in. Please try again.";
        setError(message);
        setPending(false);
        return;
      }

      navigateToOAuthUrl(data.data.url);
      // Intentionally not resetting pending — page navigates away
    } catch {
      setError("Unable to start Google sign-in. Please try again.");
      setPending(false);
    }
  }, [pending, nextPath]);

  return (
    <div className={className}>
      <Button
        type="button"
        variant="secondary"
        size="md"
        loading={pending}
        disabled={pending}
        onClick={handleClick}
        aria-label="Continue with Google"
        className="w-full"
      >
        Continue with Google
      </Button>

      {error && (
        <p
          role="alert"
          className="mt-2 text-center text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
