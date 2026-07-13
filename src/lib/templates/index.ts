export type { ResumeTemplateId, ResumeTemplate } from "./types";
export {
  TEMPLATES,
  DEFAULT_TEMPLATE_ID,
  getTemplate,
  resolveTemplate,
  isValidTemplateId,
} from "./registry";
export { normalizeSnapshotTemplate, getEffectiveTemplateId } from "./normalize";
