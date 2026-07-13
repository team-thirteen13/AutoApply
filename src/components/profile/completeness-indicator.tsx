"use client";

import type { Profile } from "@/types/profile";

// ── Required editable fields for completeness ─────────────
const REQUIRED_FIELDS = [
  "name",
  "email",
  "phone",
  "location",
  "githubUrl",
  "linkedinUrl",
  "portfolioUrl",
] as const;

const TOTAL_FIELDS = REQUIRED_FIELDS.length;

// ── Helpers ───────────────────────────────────────────────

function isFilled(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0;
}

export function calculateCompleteness(
  profile: Pick<Profile, (typeof REQUIRED_FIELDS)[number]>,
): { filled: number; total: number; percentage: number } {
  const filled = REQUIRED_FIELDS.filter((field) =>
    isFilled(profile[field]),
  ).length;

  return {
    filled,
    total: TOTAL_FIELDS,
    percentage: Math.round((filled / TOTAL_FIELDS) * 100),
  };
}

// ── Component ─────────────────────────────────────────────

interface CompletenessIndicatorProps {
  profile: Pick<Profile, (typeof REQUIRED_FIELDS)[number]>;
}

export function CompletenessIndicator({
  profile,
}: CompletenessIndicatorProps) {
  const { filled, total, percentage } = calculateCompleteness(profile);

  const barColor =
    percentage >= 80
      ? "bg-emerald-500"
      : percentage >= 50
        ? "bg-amber-500"
        : "bg-red-400";

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">
          Profile Completeness
        </span>
        <span className="text-sm font-semibold text-slate-900">
          {filled}/{total} fields
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Profile completeness: ${percentage}%`}
        />
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {percentage === 100
          ? "All required fields are completed"
          : `${total - filled} required field${total - filled === 1 ? "" : "s"} remaining`}
      </p>
    </div>
  );
}
