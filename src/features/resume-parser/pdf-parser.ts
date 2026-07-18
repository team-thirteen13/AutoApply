// ─────────────────────────────────────────────────────────────
// PDF Resume Parser
// ─────────────────────────────────────────────────────────────
// Extracts text from text-based PDFs and classifies sections.
// Does NOT handle scanned/image-only PDFs — returns an error
// for documents with insufficient extractable text.
// ─────────────────────────────────────────────────────────────

import "server-only";

import { PDFParse } from "pdf-parse";
import type {
  ResumeParser,
  ResumeParserResult,
} from "./types";
import { classifySections } from "./section-classifier";
import { mapFieldsToSnapshot } from "./field-mapper";

/** Minimum extractable text length to consider a PDF non-scanned. */
const MIN_TEXT_LENGTH = 50;

export class PdfResumeParser implements ResumeParser {
  async parse(buffer: Buffer): Promise<ResumeParserResult> {
    try {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();

      // Check for empty or nearly-empty document
      if (!result.text || result.text.trim().length < MIN_TEXT_LENGTH) {
        return {
          success: false,
          error: {
            code: "scanned_pdf",
            message:
              "This PDF appears to be scanned or image-based. Please upload a text-based PDF or a DOCX file.",
          },
        };
      }

      const rawText = result.text;

      // Classify into sections
      const sections = classifySections(rawText);

      // Map to parsed resume structure
      const parsed = mapFieldsToSnapshot(sections, rawText);

      return { success: true, data: parsed };
    } catch {
      return {
        success: false,
        error: {
          code: "malformed_document",
          message:
            "Could not read this PDF file. The file may be corrupted or password-protected.",
        },
      };
    }
  }
}
