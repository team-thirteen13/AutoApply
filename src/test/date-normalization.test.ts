/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import {
  normalizeToISODate,
  normalizeSnapshotDates,
  toMonthInputValue,
  fromMonthInputValue,
} from "@/lib/date-normalize";
import { experienceEntrySchema, educationEntrySchema } from "@/lib/validation/builder";
import type { ResumeSnapshot } from "@/types/resume";

// ════════════════════════════════════════════════════════════
// normalizeToISODate
// ════════════════════════════════════════════════════════════

describe("normalizeToISODate", () => {
  // ── Already canonical ────────────────────────────────────

  it("returns YYYY-MM-DD unchanged", () => {
    expect(normalizeToISODate("2025-01-15")).toBe("2025-01-15");
  });

  it("returns another valid YYYY-MM-DD unchanged", () => {
    expect(normalizeToISODate("2020-06-30")).toBe("2020-06-30");
  });

  // ── Month precision ──────────────────────────────────────

  it("converts YYYY-MM to YYYY-MM-01", () => {
    expect(normalizeToISODate("2025-01")).toBe("2025-01-01");
  });

  it("converts another YYYY-MM to YYYY-MM-01", () => {
    expect(normalizeToISODate("2020-12")).toBe("2020-12-01");
  });

  // ── Full month name ──────────────────────────────────────

  it('converts "January 2025" to 2025-01-01', () => {
    expect(normalizeToISODate("January 2025")).toBe("2025-01-01");
  });

  it('converts "June 2026" to 2026-06-01', () => {
    expect(normalizeToISODate("June 2026")).toBe("2026-06-01");
  });

  it('converts "July 2026" to 2026-07-01', () => {
    expect(normalizeToISODate("July 2026")).toBe("2026-07-01");
  });

  it('converts "September 2018" to 2018-09-01', () => {
    expect(normalizeToISODate("September 2018")).toBe("2018-09-01");
  });

  // ── Abbreviated month name ───────────────────────────────

  it('converts "Jan 2025" to 2025-01-01', () => {
    expect(normalizeToISODate("Jan 2025")).toBe("2025-01-01");
  });

  it('converts "Dec 2020" to 2020-12-01', () => {
    expect(normalizeToISODate("Dec 2020")).toBe("2020-12-01");
  });

  it('converts "Jun 2026" to 2026-06-01', () => {
    expect(normalizeToISODate("Jun 2026")).toBe("2026-06-01");
  });

  // ── Case insensitivity ───────────────────────────────────

  it('converts "JANUARY 2025" (uppercase) to 2025-01-01', () => {
    expect(normalizeToISODate("JANUARY 2025")).toBe("2025-01-01");
  });

  it('converts "jan 2025" (lowercase) to 2025-01-01', () => {
    expect(normalizeToISODate("jan 2025")).toBe("2025-01-01");
  });

  // ── Empty/null/undefined ─────────────────────────────────

  it("returns undefined for undefined input", () => {
    expect(normalizeToISODate(undefined)).toBeUndefined();
  });

  it("returns null for null input", () => {
    expect(normalizeToISODate(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(normalizeToISODate("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(normalizeToISODate("   ")).toBeNull();
  });

  // ── Invalid dates ────────────────────────────────────────

  it("throws for completely invalid string", () => {
    expect(() => normalizeToISODate("not a date")).toThrow(
      'Cannot normalize date: "not a date"',
    );
  });

  it("throws for invalid month name", () => {
    expect(() => normalizeToISODate("Smarch 2025")).toThrow(
      'Cannot normalize date: "Smarch 2025"',
    );
  });

  it("throws for reversed format", () => {
    expect(() => normalizeToISODate("2025 January")).toThrow(
      'Cannot normalize date: "2025 January"',
    );
  });
});

// ════════════════════════════════════════════════════════════
// normalizeSnapshotDates
// ════════════════════════════════════════════════════════════

describe("normalizeSnapshotDates", () => {
  const makeSnapshot = (
    overrides: Partial<ResumeSnapshot> = {},
  ): ResumeSnapshot => ({
    profile: { name: "Test" },
    ...overrides,
  });

  // ── Experience dates ─────────────────────────────────────

  it("normalizes experience display dates to YYYY-MM-DD", () => {
    const snapshot = makeSnapshot({
      experiences: [
        {
          company: "Acme",
          title: "Engineer",
          startDate: "January 2025",
          endDate: "June 2026",
        },
      ],
    });

    const normalized = normalizeSnapshotDates(snapshot);
    expect(normalized.experiences![0].startDate).toBe("2025-01-01");
    expect(normalized.experiences![0].endDate).toBe("2026-06-01");
  });

  it("normalizes experience abbreviated month dates", () => {
    const snapshot = makeSnapshot({
      experiences: [
        {
          company: "Acme",
          title: "Engineer",
          startDate: "Jan 2025",
          endDate: "Jun 2026",
        },
      ],
    });

    const normalized = normalizeSnapshotDates(snapshot);
    expect(normalized.experiences![0].startDate).toBe("2025-01-01");
    expect(normalized.experiences![0].endDate).toBe("2026-06-01");
  });

  it("preserves valid experience YYYY-MM-DD dates", () => {
    const snapshot = makeSnapshot({
      experiences: [
        {
          company: "Acme",
          title: "Engineer",
          startDate: "2025-01-15",
          endDate: "2026-06-30",
        },
      ],
    });

    const normalized = normalizeSnapshotDates(snapshot);
    expect(normalized.experiences![0].startDate).toBe("2025-01-15");
    expect(normalized.experiences![0].endDate).toBe("2026-06-30");
  });

  it("converts experience YYYY-MM to YYYY-MM-01", () => {
    const snapshot = makeSnapshot({
      experiences: [
        {
          company: "Acme",
          title: "Engineer",
          startDate: "2025-01",
          endDate: "2026-06",
        },
      ],
    });

    const normalized = normalizeSnapshotDates(snapshot);
    expect(normalized.experiences![0].startDate).toBe("2025-01-01");
    expect(normalized.experiences![0].endDate).toBe("2026-06-01");
  });

  // ── Education dates ──────────────────────────────────────

  it("normalizes education display dates to YYYY-MM-DD", () => {
    const snapshot = makeSnapshot({
      education: [
        {
          university: "MIT",
          degree: "BS CS",
          startDate: "January 2024",
          endDate: "July 2026",
        },
      ],
    });

    const normalized = normalizeSnapshotDates(snapshot);
    expect(normalized.education![0].startDate).toBe("2024-01-01");
    expect(normalized.education![0].endDate).toBe("2026-07-01");
  });

  it("normalizes education abbreviated month dates", () => {
    const snapshot = makeSnapshot({
      education: [
        {
          university: "MIT",
          degree: "BS CS",
          startDate: "Jan 2024",
          endDate: "Jul 2026",
        },
      ],
    });

    const normalized = normalizeSnapshotDates(snapshot);
    expect(normalized.education![0].startDate).toBe("2024-01-01");
    expect(normalized.education![0].endDate).toBe("2026-07-01");
  });

  // ── Optional end dates ───────────────────────────────────

  it("preserves undefined optional endDate", () => {
    const snapshot = makeSnapshot({
      experiences: [
        {
          company: "Acme",
          title: "Engineer",
          startDate: "January 2025",
          endDate: undefined,
          isCurrent: true,
        },
      ],
    });

    const normalized = normalizeSnapshotDates(snapshot);
    expect(normalized.experiences![0].startDate).toBe("2025-01-01");
    expect(normalized.experiences![0].endDate).toBeUndefined();
  });

  it("preserves null optional endDate", () => {
    const snapshot = makeSnapshot({
      experiences: [
        {
          company: "Acme",
          title: "Engineer",
          startDate: "January 2025",
          endDate: null,
          isCurrent: true,
        },
      ],
    });

    const normalized = normalizeSnapshotDates(snapshot);
    expect(normalized.experiences![0].startDate).toBe("2025-01-01");
    expect(normalized.experiences![0].endDate).toBeNull();
  });

  // ── Current-role / current-study ─────────────────────────

  it("current-role entry with no endDate remains valid", () => {
    const snapshot = makeSnapshot({
      experiences: [
        {
          company: "Acme",
          title: "Engineer",
          startDate: "January 2025",
          isCurrent: true,
        },
      ],
    });

    const normalized = normalizeSnapshotDates(snapshot);
    expect(normalized.experiences![0].startDate).toBe("2025-01-01");
    expect(normalized.experiences![0].isCurrent).toBe(true);

    // Validate against builder schema
    const result = experienceEntrySchema.safeParse(normalized.experiences![0]);
    expect(result.success).toBe(true);
  });

  it("current-study entry with no endDate remains valid", () => {
    const snapshot = makeSnapshot({
      education: [
        {
          university: "MIT",
          degree: "BS CS",
          startDate: "January 2024",
          isCurrent: true,
        },
      ],
    });

    const normalized = normalizeSnapshotDates(snapshot);
    expect(normalized.education![0].startDate).toBe("2024-01-01");
    expect(normalized.education![0].isCurrent).toBe(true);

    // Validate against builder schema
    const result = educationEntrySchema.safeParse(normalized.education![0]);
    expect(result.success).toBe(true);
  });

  // ── Passes Phase 3 validation ────────────────────────────

  it("normalized experience dates pass Phase 3 validation", () => {
    const snapshot = makeSnapshot({
      experiences: [
        {
          company: "Acme",
          title: "Engineer",
          startDate: "January 2025",
          endDate: "June 2026",
          isCurrent: false,
        },
      ],
    });

    const normalized = normalizeSnapshotDates(snapshot);
    const result = experienceEntrySchema.safeParse(normalized.experiences![0]);
    expect(result.success).toBe(true);
  });

  it("normalized education dates pass Phase 3 validation", () => {
    const snapshot = makeSnapshot({
      education: [
        {
          university: "MIT",
          degree: "BS CS",
          startDate: "January 2024",
          endDate: "July 2026",
          isCurrent: false,
        },
      ],
    });

    const normalized = normalizeSnapshotDates(snapshot);
    const result = educationEntrySchema.safeParse(normalized.education![0]);
    expect(result.success).toBe(true);
  });

  // ── Projects and certificates ────────────────────────────

  it("normalizes project dates", () => {
    const snapshot = makeSnapshot({
      projects: [
        {
          title: "Project X",
          startDate: "January 2025",
          endDate: "June 2026",
        },
      ],
    });

    const normalized = normalizeSnapshotDates(snapshot);
    expect(normalized.projects![0].startDate).toBe("2025-01-01");
    expect(normalized.projects![0].endDate).toBe("2026-06-01");
  });

  it("normalizes certificate dates", () => {
    const snapshot = makeSnapshot({
      certificates: [
        {
          name: "AWS Cert",
          startDate: "January 2025",
          endDate: "January 2028",
        },
      ],
    });

    const normalized = normalizeSnapshotDates(snapshot);
    expect(normalized.certificates![0].startDate).toBe("2025-01-01");
    expect(normalized.certificates![0].endDate).toBe("2028-01-01");
  });

  // ── No mutation ──────────────────────────────────────────

  it("does not mutate the original snapshot", () => {
    const snapshot = makeSnapshot({
      experiences: [
        {
          company: "Acme",
          title: "Engineer",
          startDate: "January 2025",
        },
      ],
    });

    normalizeSnapshotDates(snapshot);
    expect(snapshot.experiences![0].startDate).toBe("January 2025");
  });

  // ── Empty arrays ─────────────────────────────────────────

  it("handles snapshot with no date arrays", () => {
    const snapshot = makeSnapshot();
    const normalized = normalizeSnapshotDates(snapshot);
    expect(normalized).toEqual(snapshot);
  });

  // ── Invalid date throws ──────────────────────────────────

  it("throws for invalid experience date", () => {
    const snapshot = makeSnapshot({
      experiences: [
        {
          company: "Acme",
          title: "Engineer",
          startDate: "not a date",
        },
      ],
    });

    expect(() => normalizeSnapshotDates(snapshot)).toThrow(
      'Cannot normalize date: "not a date"',
    );
  });
});

// ════════════════════════════════════════════════════════════
// MockAIProvider emits canonical dates
// ════════════════════════════════════════════════════════════

describe("MockAIProvider date normalization", () => {
  it("emits canonical YYYY-MM-DD dates for experiences", async () => {
    const { MockAIProvider } = await import("@/lib/ai/mock-provider");
    const provider = new MockAIProvider();

    const result = await provider.generateResume({
      experiences: [
        {
          company: "Acme",
          title: "Engineer",
          startDate: "January 2025",
          endDate: "June 2026",
        },
      ],
    });

    expect(result.data.snapshot.experiences![0].startDate).toBe("2025-01-01");
    expect(result.data.snapshot.experiences![0].endDate).toBe("2026-06-01");
  });

  it("emits canonical YYYY-MM-DD dates for education", async () => {
    const { MockAIProvider } = await import("@/lib/ai/mock-provider");
    const provider = new MockAIProvider();

    const result = await provider.generateResume({
      education: [
        {
          university: "MIT",
          degree: "BS CS",
          startDate: "January 2024",
          endDate: "July 2026",
        },
      ],
    });

    expect(result.data.snapshot.education![0].startDate).toBe("2024-01-01");
    expect(result.data.snapshot.education![0].endDate).toBe("2026-07-01");
  });

  it("preserves valid YYYY-MM-DD dates", async () => {
    const { MockAIProvider } = await import("@/lib/ai/mock-provider");
    const provider = new MockAIProvider();

    const result = await provider.generateResume({
      experiences: [
        {
          company: "Acme",
          title: "Engineer",
          startDate: "2025-01-15",
          endDate: "2026-06-30",
        },
      ],
    });

    expect(result.data.snapshot.experiences![0].startDate).toBe("2025-01-15");
    expect(result.data.snapshot.experiences![0].endDate).toBe("2026-06-30");
  });

  it("normalizes YYYY-MM to YYYY-MM-01", async () => {
    const { MockAIProvider } = await import("@/lib/ai/mock-provider");
    const provider = new MockAIProvider();

    const result = await provider.generateResume({
      experiences: [
        {
          company: "Acme",
          title: "Engineer",
          startDate: "2025-01",
          endDate: "2026-06",
        },
      ],
    });

    expect(result.data.snapshot.experiences![0].startDate).toBe("2025-01-01");
    expect(result.data.snapshot.experiences![0].endDate).toBe("2026-06-01");
  });
});

// ════════════════════════════════════════════════════════════
// toMonthInputValue (YYYY-MM-DD → YYYY-MM for <input type="month">)
// ════════════════════════════════════════════════════════════

describe("toMonthInputValue", () => {
  // ── Canonical YYYY-MM-DD → YYYY-MM ──────────────────────

  it("converts YYYY-MM-DD to YYYY-MM", () => {
    expect(toMonthInputValue("2025-01-15")).toBe("2025-01");
  });

  it("converts another YYYY-MM-DD to YYYY-MM", () => {
    expect(toMonthInputValue("2020-06-30")).toBe("2020-06");
  });

  // ── Already YYYY-MM ──────────────────────────────────────

  it("returns YYYY-MM unchanged", () => {
    expect(toMonthInputValue("2025-01")).toBe("2025-01");
  });

  // ── Empty/null/undefined ─────────────────────────────────

  it("returns empty string for undefined", () => {
    expect(toMonthInputValue(undefined)).toBe("");
  });

  it("returns empty string for null", () => {
    expect(toMonthInputValue(null)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(toMonthInputValue("")).toBe("");
  });

  // ── Invalid values ───────────────────────────────────────

  it("returns empty string for invalid string", () => {
    expect(toMonthInputValue("not a date")).toBe("");
  });

  it("returns empty string for display-formatted date", () => {
    expect(toMonthInputValue("January 2025")).toBe("");
  });
});

// ════════════════════════════════════════════════════════════
// fromMonthInputValue (YYYY-MM → YYYY-MM-01 for storage)
// ════════════════════════════════════════════════════════════

describe("fromMonthInputValue", () => {
  // ── YYYY-MM → YYYY-MM-01 ────────────────────────────────

  it("converts YYYY-MM to YYYY-MM-01", () => {
    expect(fromMonthInputValue("2025-01")).toBe("2025-01-01");
  });

  it("converts another YYYY-MM to YYYY-MM-01", () => {
    expect(fromMonthInputValue("2020-12")).toBe("2020-12-01");
  });

  // ── Empty values ─────────────────────────────────────────

  it("returns null for empty string", () => {
    expect(fromMonthInputValue("")).toBeNull();
  });

  it("returns null for null", () => {
    expect(fromMonthInputValue(null)).toBeNull();
  });

  it("returns undefined for undefined", () => {
    expect(fromMonthInputValue(undefined)).toBeUndefined();
  });

  // ── Invalid values ───────────────────────────────────────

  it("returns null for invalid string", () => {
    expect(fromMonthInputValue("not a date")).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════
// Month-input round-trip: store → display → store
// ════════════════════════════════════════════════════════════

describe("month-input round-trip", () => {
  it("YYYY-MM-DD displays as YYYY-MM and stores back as YYYY-MM-01", () => {
    const stored = "2025-06-15";
    const display = toMonthInputValue(stored);
    expect(display).toBe("2025-06");
    const backToStore = fromMonthInputValue(display);
    expect(backToStore).toBe("2025-06-01");
  });

  it("empty stored value displays as empty and stores back as null", () => {
    const stored = null;
    const display = toMonthInputValue(stored);
    expect(display).toBe("");
    const backToStore = fromMonthInputValue(display);
    expect(backToStore).toBeNull();
  });
});
