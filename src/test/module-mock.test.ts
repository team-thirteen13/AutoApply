import { describe, it, expect, vi } from "vitest";

// ── Smoke test: vi.mock can replace a local module ─────────
// Proves that Vitest module mocking works with @/ paths.

vi.mock("@/test/fixtures/example", () => ({
  GREETING: "mocked greeting",
  add: vi.fn(() => 42),
}));

import { GREETING, add } from "@/test/fixtures/example";

describe("module mocking", () => {
  it("replaces the constant with the mock value", () => {
    expect(GREETING).toBe("mocked greeting");
  });

  it("replaces the function with the mock implementation", () => {
    expect(add(1, 1)).toBe(42);
    expect(add).toHaveBeenCalledWith(1, 1);
  });
});
