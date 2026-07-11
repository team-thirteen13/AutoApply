import { describe, it, expect } from "vitest";

// ── Smoke test: @/ alias resolves correctly ────────────────
// Proves that vitest.config.ts maps @/ to src/.
// No mocks — this imports the real module.

import { GREETING, add } from "@/test/fixtures/example";

describe("path alias resolution", () => {
  it("imports a constant via @/ alias", () => {
    expect(GREETING).toBe("hello from fixture");
  });

  it("imports a function via @/ alias and calls it", () => {
    expect(add(2, 3)).toBe(5);
  });
});
