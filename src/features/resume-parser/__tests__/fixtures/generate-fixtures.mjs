#!/usr/bin/env node
// Generate minimal test fixtures for resume parser integration tests.
// Run: node generate-fixtures.mjs
// Creates: valid.pdf, short.pdf, empty.pdf, valid.docx, malformed.pdf, malformed.docx

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Minimal PDF generation ──────────────────────────────────

function createMinimalPdf(textLines) {
  // Build text operators for PDF
  const textOps = textLines
    .map((line, i) => `BT /F1 12 Tf 72 ${720 - i * 18} Td (${escapePdf(line)}) Tj ET`)
    .join("\n");

  const stream = textOps;
  const streamLength = Buffer.byteLength(stream);

  let pdf = "%PDF-1.0\n";
  const offsets = [];

  // Object 1: Catalog
  offsets.push(pdf.length);
  pdf += "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";

  // Object 2: Pages
  offsets.push(pdf.length);
  pdf += "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";

  // Object 3: Page
  offsets.push(pdf.length);
  pdf += "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n";

  // Object 4: Font
  offsets.push(pdf.length);
  pdf += "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";

  // Object 5: Content stream
  offsets.push(pdf.length);
  pdf += `5 0 obj\n<< /Length ${streamLength} >>\nstream\n${stream}\nendstream\nendobj\n`;

  // Cross-reference table
  const xrefStart = pdf.length;
  pdf += "xref\n";
  pdf += `0 6\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }

  // Trailer
  pdf += "trailer\n<< /Size 6 /Root 1 0 R >>\n";
  pdf += `startxref\n${xrefStart}\n`;
  pdf += "%%EOF\n";

  return Buffer.from(pdf, "latin1");
}

function escapePdf(str) {
  return str.replace(/[\\()]/g, "\\$&");
}

// ── Minimal DOCX generation ─────────────────────────────────

async function createMinimalDocx(text) {
  // DOCX is a ZIP file with XML contents
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  // [Content_Types].xml
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  // _rels/.rels
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // word/_rels/document.xml.rels
  zip.file(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`
  );

  // word/document.xml with text content
  const paragraphs = text
    .split("\n")
    .map(
      (line) =>
        `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`
    )
    .join("\n      ");

  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
      ${paragraphs}
    <w:sectPr/>
  </w:body>
</w:document>`
  );

  return zip.generateAsync({ type: "nodebuffer" });
}

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ── Generate fixtures ───────────────────────────────────────

const RESUME_TEXT = [
  "Alex Example",
  "alex@example.test",
  "+1 555-0123",
  "https://github.com/alexexample",
  "https://linkedin.com/in/alexexample",
  "",
  "Professional Summary",
  "Software engineer with 5 years of experience in full-stack development.",
  "",
  "Work Experience",
  "Senior Developer at Example Labs",
  "January 2022 - March 2024",
  "• Led development of microservices platform",
  "• Improved API performance by 40%",
  "",
  "Developer at Test Corp",
  "June 2019 - December 2021",
  "• Built REST APIs using Node.js and Express",
  "• Maintained PostgreSQL databases",
  "",
  "Education",
  "Bachelor of Computer Science at Example University",
  "September 2015 - May 2019",
  "",
  "Technical Skills",
  "TypeScript, React, Node.js, PostgreSQL, Docker, AWS",
  "",
  "Certifications",
  "AWS Solutions Architect Associate",
  "Amazon Web Services",
  "2023-06",
  "",
  "Projects",
  "Open Source Dashboard",
  "Built a real-time analytics dashboard",
  "Technologies: React, TypeScript, WebSocket",
  "",
  "Languages",
  "English - Native",
  "Spanish - Conversational",
].join("\n");

const SHORT_TEXT = [
  "Alex Example",
  "alex@example.test",
  "Software Engineer",
].join("\n");

async function main() {
  // 1. Valid PDF with resume text
  const validPdf = createMinimalPdf(RESUME_TEXT.split("\n"));
  writeFileSync(join(__dirname, "valid.pdf"), validPdf);
  console.log(`Created valid.pdf (${validPdf.length} bytes)`);

  // 2. Short but valid PDF
  const shortPdf = createMinimalPdf(SHORT_TEXT.split("\n"));
  writeFileSync(join(__dirname, "short.pdf"), shortPdf);
  console.log(`Created short.pdf (${shortPdf.length} bytes)`);

  // 3. Empty/minimal PDF (minimal structure, no meaningful text)
  const emptyPdf = createMinimalPdf(["X"]);
  writeFileSync(join(__dirname, "empty.pdf"), emptyPdf);
  console.log(`Created empty.pdf (${emptyPdf.length} bytes)`);

  // 4. Valid DOCX with resume text
  const validDocx = await createMinimalDocx(RESUME_TEXT);
  writeFileSync(join(__dirname, "valid.docx"), validDocx);
  console.log(`Created valid.docx (${validDocx.length} bytes)`);

  // 5. Short DOCX
  const shortDocx = await createMinimalDocx(SHORT_TEXT);
  writeFileSync(join(__dirname, "short.docx"), shortDocx);
  console.log(`Created short.docx (${shortDocx.length} bytes)`);

  // 6. Malformed PDF (not a valid PDF)
  writeFileSync(join(__dirname, "malformed.pdf"), Buffer.from("NOT A PDF FILE"));
  console.log("Created malformed.pdf");

  // 7. Malformed DOCX (not a valid ZIP/DOCX)
  writeFileSync(join(__dirname, "malformed.docx"), Buffer.from("NOT A DOCX FILE"));
  console.log("Created malformed.docx");

  // 8. Empty file
  writeFileSync(join(__dirname, "empty-file.pdf"), Buffer.alloc(0));
  console.log("Created empty-file.pdf");
}

main().catch(console.error);
