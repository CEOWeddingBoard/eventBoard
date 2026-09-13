"use server";

import { PDFDocument, rgb, StandardFonts, PageSizes } from "pdf-lib";
import type { ContractFillData } from "./types";
import { STATUS_LABELS, TYPE_LABELS } from "./types";

interface ContractPdfOptions {
  title: string;
  contractType: string;
  filledData: ContractFillData;
  venueName: string;
  coupleName: string;
  signatureDataUrl?: string;
  signedByName?: string;
  signatureDate?: string;
}

export async function buildContractPreviewPdf(
  options: ContractPdfOptions,
): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const fontItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);

  const page = doc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  const margin = 60;
  let y = height - margin;

  const drawText = (text: string, size: number, opts?: { bold?: boolean; italic?: boolean; color?: { r: number; g: number; b: number } }) => {
    const f = opts?.bold ? fontBold : opts?.italic ? fontItalic : font;
    const c = opts?.color || { r: 0, g: 0, b: 0 };
    page.drawText(text, { x: margin, y, size, font: f, color: rgb(c.r, c.g, c.b) });
    y -= size + 6;
  };

  const drawLine = () => {
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      color: rgb(0.6, 0.6, 0.6),
      thickness: 0.5,
    });
    y -= 16;
  };

  drawText(options.title || "Umowa", 20, { bold: true, color: { r: 0.25, g: 0.3, b: 0.25 } });
  drawText(`${options.venueName}`, 12, { italic: true, color: { r: 0.4, g: 0.4, b: 0.4 } });
  y -= 4;
  drawLine();
  drawText(`Typ: ${TYPE_LABELS[options.contractType] || options.contractType}`, 11, { bold: true });
  y -= 8;

  const filled = options.filledData;
  const keys = Object.keys(filled).filter((k) => filled[k] !== "" && filled[k] != null);

  if (keys.length > 0) {
    for (const key of keys) {
      const value = String(filled[key]);
      if (y < margin + 60) {
        page.drawText("...", { x: width / 2, y: margin, size: 10, font });
        break;
      }
      drawText(`${key}:`, 10, { bold: true });
      drawText(`  ${value}`, 10);
      y -= 4;
    }
  } else {
    drawText("(Brak wypełnionych danych — szablon wymaga uzupełnienia)", 10, { italic: true });
    y -= 8;
  }

  if (options.signatureDataUrl) {
    y -= 20;
    if (y < margin + 180) {
      y = margin;
    }
    drawLine();
    drawText("Podpis:", 12, { bold: true });
    drawText(options.signedByName || "Para Młoda", 12);
    if (options.signatureDate) {
      drawText(`Data: ${options.signatureDate}`, 10, { italic: true });
    }

    try {
      const sigBytes = Buffer.from(
        options.signatureDataUrl.replace(/^data:image\/png;base64,/, ""),
        "base64",
      );
      const sigImage = await doc.embedPng(sigBytes);
      const sigDims = sigImage.scale(1);
      const sigWidth = Math.min(sigDims.width * 0.6, 180);
      const sigHeight = (sigWidth / sigDims.width) * sigDims.height;
      page.drawImage(sigImage, {
        x: margin,
        y: y - sigHeight - 10,
        width: sigWidth,
        height: sigHeight,
      });
      y -= sigHeight + 30;
    } catch {
      // signature rendering failed, skip
    }
  }

  y -= 20;
  if (y > margin + 40) {
    drawLine();
    drawText("Dokument wygenerowano przez Wedding Planner", 9, {
      italic: true,
      color: { r: 0.5, g: 0.5, b: 0.5 },
    });
    drawText(
      `Data generowania: ${new Date().toLocaleDateString("pl-PL")}`,
      8,
      { italic: true, color: { r: 0.5, g: 0.5, b: 0.5 } },
    );
  }

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

export async function stampSignatureOnPdf(
  pdfBuffer: Buffer,
  signatureDataUrl: string,
  signedByName: string,
  signatureDate: string,
): Promise<Buffer> {
  const doc = await PDFDocument.load(pdfBuffer);
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold);

  const page = doc.addPage();
  const { width } = page.getSize();
  const margin = 60;
  let y = page.getSize().height - margin;

  page.drawText("POTWIERDZENIE PODPISU", {
    x: margin,
    y,
    size: 16,
    font: fontBold,
    color: rgb(0.25, 0.3, 0.25),
  });
  y -= 30;

  page.drawText(`Podpisujący: ${signedByName}`, {
    x: margin,
    y,
    size: 12,
    font,
  });
  y -= 20;

  page.drawText(`Data podpisu: ${signatureDate}`, {
    x: margin,
    y,
    size: 12,
    font,
  });
  y -= 30;

  try {
    const sigBytes = Buffer.from(
      signatureDataUrl.replace(/^data:image\/png;base64,/, ""),
      "base64",
    );
    const sigImage = await doc.embedPng(sigBytes);
    const sigDims = sigImage.scale(1);
    const sigWidth = Math.min(sigDims.width * 0.6, 200);
    const sigHeight = (sigWidth / sigDims.width) * sigDims.height;
    page.drawImage(sigImage, {
      x: margin,
      y: y - sigHeight,
      width: sigWidth,
      height: sigHeight,
    });
    y -= sigHeight + 10;
  } catch {
    // skip
  }

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
