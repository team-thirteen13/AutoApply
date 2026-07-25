import { describe, it, expect } from "vitest";
import { parseRetryAfter } from "../retry-after";

describe("parseRetryAfter", () => {
  describe("integer seconds", () => {
    it("parses valid integer", () => {
      expect(parseRetryAfter("5")).toBe(5000);
    });

    it("parses '1'", () => {
      expect(parseRetryAfter("1")).toBe(1000);
    });

    it("parses '60'", () => {
      expect(parseRetryAfter("60")).toBe(60000);
    });

    it("caps at 60 seconds", () => {
      expect(parseRetryAfter("120")).toBe(60000);
    });

    it("enforces 1 second minimum", () => {
      expect(parseRetryAfter("0")).toBeUndefined();
    });
  });

  describe("HTTP-date", () => {
    it("parses future HTTP-date", () => {
      const future = new Date(Date.now() + 5000).toUTCString();
      const result = parseRetryAfter(future);
      expect(result).toBeGreaterThanOrEqual(4000);
      expect(result).toBeLessThanOrEqual(6000);
    });

    it("ignores past HTTP-date", () => {
      const past = new Date(Date.now() - 10000).toUTCString();
      expect(parseRetryAfter(past)).toBeUndefined();
    });
  });

  describe("malformed values", () => {
    it("returns undefined for null", () => {
      expect(parseRetryAfter(null)).toBeUndefined();
    });

    it("returns undefined for empty string", () => {
      expect(parseRetryAfter("")).toBeUndefined();
    });

    it("returns undefined for non-numeric string", () => {
      expect(parseRetryAfter("abc")).toBeUndefined();
    });

    it("returns undefined for float", () => {
      expect(parseRetryAfter("3.5")).toBeUndefined();
    });

    it("returns undefined for negative", () => {
      expect(parseRetryAfter("-5")).toBeUndefined();
    });

    it("returns undefined for extremely large value", () => {
      expect(parseRetryAfter("999999")).toBe(60000); // Capped
    });

    it("returns undefined for random text", () => {
      expect(parseRetryAfter("retry later")).toBeUndefined();
    });
  });
});
