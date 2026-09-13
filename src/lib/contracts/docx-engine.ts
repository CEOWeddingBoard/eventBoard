"use server";

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import type { ContractFillData } from "./types";

function extractPlaceholdersFromDocx(zip: PizZip): string[] {
  const xml = zip.file("word/document.xml");
  if (!xml) return [];

  const content = xml.asText();
  const regex = /\{([^{}]+)\}/g;
  const matches = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const key = match[1].trim();
    if (key && !key.startsWith("#") && !key.startsWith("/") && !key.startsWith(">") && !key.startsWith("<")) {
      matches.add(key);
    }
  }

  regex.lastIndex = 0;

  const headerFooterPattern = /word\/(header|footer)\d+\.xml/;
  const headerFooterFiles = Object.keys(zip.files).filter((f) => headerFooterPattern.test(f));

  for (const hf of headerFooterFiles) {
    const hfXml = zip.file(hf);
    if (!hfXml) continue;
    const hfContent = hfXml.asText();
    let hfMatch: RegExpExecArray | null;
    while ((hfMatch = regex.exec(hfContent)) !== null) {
      const key = hfMatch[1].trim();
      if (key && !key.startsWith("#") && !key.startsWith("/") && !key.startsWith(">") && !key.startsWith("<")) {
        matches.add(key);
      }
    }
  }

  return Array.from(matches);
}

export async function parseDocxTemplate(
  buffer: Buffer,
): Promise<{ placeholders: string[] }> {
  const zip = new PizZip(buffer);
  const placeholders = extractPlaceholdersFromDocx(zip);
  return { placeholders };
}

export async function fillDocxTemplate(
  buffer: Buffer,
  data: ContractFillData,
): Promise<Buffer> {
  const zip = new PizZip(buffer);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
  });

  doc.setData(data);

  try {
    doc.render();
  } catch (error) {
    const e = error as Error & { properties?: { explanation?: string } };
    const details = e.properties?.explanation || e.message;
    throw new Error(`Błąd wypełniania szablonu: ${details}`);
  }

  const filled = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return filled;
}

export async function docxToBase64(buffer: Buffer): Promise<string> {
  return buffer.toString("base64");
}

export async function base64ToDocx(base64: string): Promise<Buffer> {
  return Buffer.from(base64, "base64");
}
