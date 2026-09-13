import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 40;
const ROW_H = 16;
const FONT_SIZE = 10;
const HEADER_SIZE = 12;
const TITLE_SIZE = 14;

const COURSE_LABELS: Record<string, string> = {
  APPETIZER: "Przystawka",
  SOUP: "Zupa",
  MAIN: "Danie glowne",
  DESSERT: "Deser",
  CAKE: "Tort",
  DRINKS: "Napoje",
  OTHER: "Inne",
};

function formatTime(d: Date): string {
  return new Date(d).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function safeText(s: string): string {
  const pl: Record<string, string> = {
    ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
    Ą: "A", Ć: "C", Ę: "E", Ł: "L", Ń: "N", Ó: "O", Ś: "S", Ź: "Z", Ż: "Z",
  };
  return s
    .split("")
    .map((c) => pl[c] ?? (c.normalize("NFD").replace(/\p{Diacritic}/gu, "") || c))
    .join("");
}

export interface DayExportInput {
  eventName: string | null;
  eventDate: Date | null;
  schedule: { startTime: Date; endTime: Date | null; title: string; description: string | null; location: string | null }[];
  menu: { name: string; courseType: string; description: string | null }[];
  onlySchedule: boolean;
  onlyMenu: boolean;
}

export async function buildDayExportPdf(input: DayExportInput): Promise<Buffer> {
  const { eventName, eventDate, schedule, menu, onlySchedule, onlyMenu } = input;

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const dark = rgb(0.15, 0.22, 0.12);
  const muted = rgb(0.35, 0.35, 0.35);

  let page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
  let y = A4_HEIGHT - MARGIN;
  const pageBottom = MARGIN + 60;

  if (onlyMenu) {
    const menuTitle = eventName ? safeText(`Menu weselne – ${eventName}`) : safeText("Menu weselne");
    page.drawText(menuTitle, {
      x: MARGIN,
      y,
      size: TITLE_SIZE,
      font: fontBold,
      color: dark,
    });
    y -= 20;
    if (eventDate) {
      page.drawText(safeText(formatDate(eventDate)), {
        x: MARGIN,
        y,
        size: FONT_SIZE,
        font,
        color: muted,
      });
      y -= 24;
    }
    y -= 8;
  }

  if (!onlyMenu) {
    const title = onlySchedule
      ? (eventName ? safeText(`Harmonogram dnia – ${eventName}`) : safeText("Harmonogram dnia wesela"))
      : (eventName ? safeText(`Organizacja – ${eventName}`) : safeText("Organizacja"));
    page.drawText(title, {
      x: MARGIN,
      y,
      size: TITLE_SIZE,
      font: fontBold,
      color: dark,
    });
    y -= 20;

    if (eventDate) {
      page.drawText(safeText(formatDate(eventDate)), {
        x: MARGIN,
        y,
        size: FONT_SIZE,
        font,
        color: muted,
      });
      y -= 24;
    }

    page.drawText(safeText("Harmonogram dnia"), {
      x: MARGIN,
      y,
      size: HEADER_SIZE,
      font: fontBold,
      color: dark,
    });
    y -= ROW_H + 4;

    if (schedule.length === 0) {
      page.drawText(safeText("Brak punktow harmonogramu."), {
        x: MARGIN,
        y,
        size: FONT_SIZE,
        font,
        color: muted,
      });
      y -= ROW_H * 2;
    } else {
      for (const item of schedule) {
        if (y < pageBottom) {
          page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
          y = A4_HEIGHT - MARGIN;
        }
        const timeStr =
          item.endTime
            ? `${formatTime(item.startTime)} – ${formatTime(item.endTime)}`
            : formatTime(item.startTime);
        page.drawText(safeText(timeStr), {
          x: MARGIN,
          y,
          size: FONT_SIZE,
          font: fontBold,
          color: dark,
        });
        page.drawText(safeText(item.title), {
          x: MARGIN + 85,
          y,
          size: FONT_SIZE,
          font: fontBold,
          color: dark,
        });
        y -= ROW_H;
        if (item.location) {
          page.drawText(safeText(`  Gdzie: ${item.location}`), {
            x: MARGIN,
            y,
            size: FONT_SIZE,
            font,
            color: muted,
          });
          y -= ROW_H;
        }
        if (item.description) {
          const desc = item.description.slice(0, 90) + (item.description.length > 90 ? "..." : "");
          page.drawText(safeText(`  ${desc}`), {
            x: MARGIN,
            y,
            size: FONT_SIZE - 1,
            font,
            color: muted,
          });
          y -= ROW_H;
        }
        y -= 6;
      }
    }

    if (onlySchedule) {
      return Buffer.from(await doc.save());
    }

    y -= 16;
    if (y < pageBottom + 80) {
      page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
      y = A4_HEIGHT - MARGIN;
    }
    page.drawText(safeText("Menu weselne"), {
      x: MARGIN,
      y,
      size: HEADER_SIZE,
      font: fontBold,
      color: dark,
    });
    y -= ROW_H + 4;
  }

  if (menu.length === 0) {
    page.drawText(safeText("Brak pozycji menu."), {
      x: MARGIN,
      y,
      size: FONT_SIZE,
      font,
      color: muted,
    });
    y -= ROW_H * 2;
  } else {
    for (const course of menu) {
      if (y < pageBottom) {
        page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
        y = A4_HEIGHT - MARGIN;
      }
      const typeLabel = COURSE_LABELS[course.courseType] ?? course.courseType;
      page.drawText(safeText(typeLabel), {
        x: MARGIN,
        y,
        size: FONT_SIZE - 1,
        font,
        color: muted,
      });
      page.drawText(safeText(course.name), {
        x: MARGIN + 75,
        y,
        size: FONT_SIZE,
        font: fontBold,
        color: dark,
      });
      y -= ROW_H;
      if (course.description) {
        const desc = course.description.slice(0, 85) + (course.description.length > 85 ? "..." : "");
        page.drawText(safeText(`  ${desc}`), {
          x: MARGIN,
          y,
          size: FONT_SIZE - 1,
          font,
          color: muted,
        });
        y -= ROW_H;
      }
      y -= 2;
    }
  }

  return Buffer.from(await doc.save());
}
