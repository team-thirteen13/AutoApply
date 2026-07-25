// ─────────────────────────────────────────────────────────────
// ATS Resume Optimization Module
// ─────────────────────────────────────────────────────────────
// Public API for the ATS resume optimization service.
// Import from here to access the optimization service,
// providers, and types.
// ─────────────────────────────────────────────────────────────

export type {
  OptimizationMode,
  ProviderErrorCode,
  ProviderError,
  ProviderRequestContext,
  OptimizeResumeRequest,
  ChangeReasonCategory,
  OptimizationChange,
  OptimizeResumeProviderResult,
  ResumeOptimizationProvider,
  OptimizationMetadata,
  OptimizeResumeResult,
  OptimizeResumeError,
  OptimizeResumeOperationResult,
  RetryPolicy,
  ProviderConfig,
  OptimizationServiceConfig,
} from "./types";

export { GroqResumeOptimizationProvider } from "./groq-provider";
export { OpenRouterResumeOptimizationProvider } from "./openrouter-provider";
export { MockResumeOptimizationProvider } from "./mock-provider";
export { ProviderManager } from "./provider-manager";
export { optimizeResume } from "./service";
export { validateFactualPreservation } from "./factual-preservation";
export {
  validateProviderOutput,
  resumeSnapshotSchema,
  providerOutputSchema,
} from "./validation";
export {
  getOptimizationConfig,
  resetOptimizationConfig,
} from "./config";
