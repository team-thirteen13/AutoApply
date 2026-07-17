// ─────────────────────────────────────────────────────────────
// DOCX Resume Parser
// ─────────────────────────────────────────────────────────────
// Extracts text from DOCX files using mammoth and classifies
// sections from the raw content.
// ─────────────────────────────────────────────────────────────

import "server-only";

import mammoth from "mammoth";
import type {
  ResumeParser,
  ResumeParserResult,
} from "./types";
import { classifySections } from "./section-classifier";
import { mapFieldsToSnapshot } from "./field-mapper";

export class DocxResumeParser implements ResumeParser {
  async parse(buffer: Buffer): Promise<ResumeParserResult> {
    try {
      const result = await mammoth.extractRawText({ buffer });

      const rawText = result.value;

      if (!rawText || rawText.trim().length === 0) {
        return {
          success: false,
          error: {
            code: "empty_document",
            message:
              "This document appears to be empty. Please upload a document with content.",
          },
        };
      }

      // Collect any mammoth warnings (non-fatal)
      const warnings: string[] = [];
      if (result.messages.length > 0) {
        for (const msg of result.messages) {
          if (msg.type === "warning") {
            warnings.push(msg.message);
          }
        }
      }

      // Classify into sections
      const sections = classifySections(rawText);

      // Map to parsed resume structure
      const parsed = mapFieldsToSnapshot(sections, rawText);
      if (warnings.length > 0) {
        parsed.warnings = [...(parsed.warnings ?? []), ...warnings];
      }

      return { success: true, data: parsed };
    } catch {
      return {
        success: false,
        error: {
          code: "malformed_document",
          message:
            "Could not read this DOCX file. The file may be corrupted.",
        },
      };
    }
  }
}
