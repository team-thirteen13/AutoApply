// ─────────────────────────────────────────────────────────────
// Retry-After Header Parser
// ─────────────────────────────────────────────────────────────
// Parses the Retry-After header from HTTP responses.
// Supports integer seconds and HTTP-date formats.
// Handles malformed, negative, and extreme values safely.
// ─────────────────────────────────────────────────────────────

const MAX_RETRY_AFTER_MS = 60_000; // 60 seconds cap
const MIN_RETRY_AFTER_MS = 1_000;  // 1 second minimum

/**
 * Parse the Retry-After header value into milliseconds.
 *
 * Supports:
 * - Integer seconds (e.g., "5")
 * - HTTP-date (e.g., "Wed, 21 Oct 2015 07:28:00 GMT")
 *
 * Returns undefined for missing, malformed, negative, or extreme values.
 * Always returns a value between MIN_RETRY_AFTER_MS and MAX_RETRY_AFTER_MS.
 */
export function parseRetryAfter(
  headerValue: string | null,
): number | undefined {
  if (!headerValue?.trim()) return undefined;

  const trimmed = headerValue.trim();

  // Try integer seconds first
  const seconds = Number(trimmed);
  if (!Number.isNaN(seconds) && Number.isInteger(seconds)) {
    if (seconds <= 0) return undefined; // Negative or zero — ignore
    const ms = seconds * 1000;
    return Math.min(Math.max(ms, MIN_RETRY_AFTER_MS), MAX_RETRY_AFTER_MS);
  }

  // Try HTTP-date format
  const dateMs = Date.parse(trimmed);
  if (!Number.isNaN(dateMs)) {
    const delayMs = dateMs - Date.now();
    if (delayMs <= 0) return undefined; // Date in the past
    return Math.min(Math.max(delayMs, MIN_RETRY_AFTER_MS), MAX_RETRY_AFTER_MS);
  }

  // Malformed — ignore
  return undefined;
}
