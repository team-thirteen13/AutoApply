import { describe, it, expect } from "vitest";
import {
  TEMPLATES,
  DEFAULT_TEMPLATE_ID,
  getTemplate,
  resolveTemplate,
  isValidTemplateId,
} from "../registry";
import { normalizeSnapshotTemplate, getEffectiveTemplateId } from "../normalize";
import type { ResumeTemplateId } from "../types";

// ── Template Registry ──────────────────────────────────────

describe("template registry", () => {
  it("has exactly three templates", () => {
    expect(TEMPLATES).toHaveLength(3);
  });

  it("has classic, modern, and minimal templates", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(ids).toContain("classic");
    expect(ids).toContain("modern");
    expect(ids).toContain("minimal");
  });

  it("each template has required fields", () => {
    for (const template of TEMPLATES) {
      expect(template.id).toBeTruthy();
      expect(template.name).toBeTruthy();
      expect(template.description).toBeTruthy();
      expect(template.thumbnailStyle).toBeDefined();
    }
  });

  it("default template is classic", () => {
    expect(DEFAULT_TEMPLATE_ID).toBe("classic");
  });
});

// ── Template Lookup ─────────────────────────────────────────

describe("getTemplate", () => {
  it("returns template for valid ID", () => {
    const template = getTemplate("classic");
    expect(template).toBeDefined();
    expect(template?.id).toBe("classic");
  });

  it("returns undefined for undefined", () => {
    expect(getTemplate(undefined)).toBeUndefined();
  });

  it("returns undefined for invalid ID", () => {
    expect(getTemplate("invalid" as ResumeTemplateId)).toBeUndefined();
  });
});

describe("resolveTemplate", () => {
  it("returns template for valid ID", () => {
    const template = resolveTemplate("modern");
    expect(template.id).toBe("modern");
  });

  it("returns default for undefined", () => {
    const template = resolveTemplate(undefined);
    expect(template.id).toBe(DEFAULT_TEMPLATE_ID);
  });

  it("returns default for invalid ID", () => {
    const template = resolveTemplate("invalid" as ResumeTemplateId);
    expect(template.id).toBe(DEFAULT_TEMPLATE_ID);
  });
});

describe("isValidTemplateId", () => {
  it("returns true for valid IDs", () => {
    expect(isValidTemplateId("classic")).toBe(true);
    expect(isValidTemplateId("modern")).toBe(true);
    expect(isValidTemplateId("minimal")).toBe(true);
  });

  it("returns false for invalid IDs", () => {
    expect(isValidTemplateId("invalid")).toBe(false);
    expect(isValidTemplateId("")).toBe(false);
    expect(isValidTemplateId("Professional")).toBe(false);
  });
});

// ── Template Normalization ──────────────────────────────────

describe("normalizeSnapshotTemplate", () => {
  it("adds default templateId when missing", () => {
    const snapshot = { profile: { name: "John" } } as Parameters<typeof normalizeSnapshotTemplate>[0];
    const result = normalizeSnapshotTemplate(snapshot);
    expect(result.templateId).toBe("classic");
  });

  it("preserves valid templateId", () => {
    const snapshot = { templateId: "modern" as ResumeTemplateId } as Parameters<typeof normalizeSnapshotTemplate>[0];
    const result = normalizeSnapshotTemplate(snapshot);
    expect(result.templateId).toBe("modern");
  });

  it("replaces invalid templateId with default", () => {
    const snapshot = { templateId: "invalid" } as unknown as Parameters<typeof normalizeSnapshotTemplate>[0];
    const result = normalizeSnapshotTemplate(snapshot);
    expect(result.templateId).toBe("classic");
  });

  it("does not mutate original snapshot", () => {
    const snapshot = { profile: { name: "John" } } as Parameters<typeof normalizeSnapshotTemplate>[0];
    const result = normalizeSnapshotTemplate(snapshot);
    expect((snapshot as Record<string, unknown>).templateId).toBeUndefined();
    expect(result.templateId).toBe("classic");
  });

  it("preserves other snapshot fields", () => {
    const snapshot = {
      profile: { name: "John" },
      summary: "Developer",
      experiences: [{ company: "Acme", title: "Engineer", startDate: "2020-01-15" }],
    };
    const result = normalizeSnapshotTemplate(snapshot);
    expect(result.profile).toEqual(snapshot.profile);
    expect(result.summary).toBe(snapshot.summary);
    expect(result.experiences).toEqual(snapshot.experiences);
  });
});

describe("getEffectiveTemplateId", () => {
  it("returns valid template ID", () => {
    expect(getEffectiveTemplateId("modern")).toBe("modern");
  });

  it("returns default for undefined", () => {
    expect(getEffectiveTemplateId(undefined)).toBe("classic");
  });

  it("returns default for invalid string", () => {
    expect(getEffectiveTemplateId("invalid")).toBe("classic");
  });

  it("returns default for non-string", () => {
    expect(getEffectiveTemplateId(123)).toBe("classic");
    expect(getEffectiveTemplateId(null)).toBe("classic");
  });
});
