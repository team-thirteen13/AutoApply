/**
 * Tiny local module used by smoke tests.
 * Exports a pure function and a constant — no side effects, no deps.
 */

export const GREETING = "hello from fixture";

export function add(a: number, b: number): number {
  return a + b;
}
