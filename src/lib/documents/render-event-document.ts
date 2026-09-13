import { prisma } from "@/lib/prisma";

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(d: Date): string {
  return new Date(d).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

type Slot = { id: string; fieldKey?: string; placeholder?: string; llmPrompt?: string };
type Block = { id: string; type: string; props: any; slots: Slot[] };
type Page = { blocks: Block[] };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function buildValueMap(eventId: string): Promise<Record<string, string>> {
  const [event, agendaData] = await Promise.all([
    prisma.event.findUnique({
      where: { id: eventId },
      include: {
        menuVariants: { include: { courses: true }, orderBy: { sortOrder: "asc" } },
        dayScheduleItems: { orderBy: { sortOrder: "asc" } },
        guests: { orderBy: { createdAt: "asc" } },
        category: { select: { customFieldsJson: true } },
        agendaData: { select: { dataJson: true } },
      },
    }),
    prisma.eventAgendaData.findUnique({
      where: { eventId },
      select: { dataJson: true },
    }),
  ]);

  if (!event) throw new Error("Event not found");

  // 1. Static event fields
  const values: Record<string, string> = {
    "event.name": event.name,
    "event.date": formatDate(event.date),
    "event.estimatedGuestCount":
      event.estimatedGuestCount != null ? String(event.estimatedGuestCount) : "",
    "event.organizerName": (event as Record<string, unknown>).organizerName as string ?? "",
    "event.responsiblePerson": (event as Record<string, unknown>).responsiblePerson as string ?? "",
    "event.occasionLabel": (event as Record<string, unknown>).occasionLabel as string ?? "",
    "event.receptionLocationName": (event as Record<string, unknown>).receptionLocationName as string ?? "",
    "event.scenarioNotes": (event as Record<string, unknown>).scenarioNotes as string ?? "",
    "event.description": (event as Record<string, unknown>).description as string ?? "",
    "event.menuVariants": event.menuVariants.map((v) => v.label).join(", "),
    "event.dayScheduleItems": event.dayScheduleItems
      .map((s) => `${formatTime(s.startTime)} ${s.title}`)
      .join("\n"),
    "event.guests": String(event.guests.length),
  };

  // 2. EventCategory custom fields → values from customFieldValuesJson
  if (event.category?.customFieldsJson) {
    try {
      const fieldDefs: { key: string; label: string }[] = JSON.parse(
        event.category.customFieldsJson
      );
      const fieldValues: Record<string, string> = event.customFieldValuesJson
        ? JSON.parse(event.customFieldValuesJson as string)
        : {};
      for (const def of fieldDefs) {
        values[`custom.${def.key}`] = String(fieldValues[def.key] ?? "");
      }
    } catch {
      // ignore malformed JSON
    }
  }

  // 3. EventAgendaData — data collected by process nodes (field mappings)
  const processDataJson = agendaData?.dataJson ?? (((event as Record<string, unknown>).agendaData as { dataJson?: string } | undefined)?.dataJson);
  if (processDataJson) {
    try {
      const processData: Record<string, unknown> = JSON.parse(processDataJson as string);
      for (const [key, val] of Object.entries(processData)) {
        values[key] = String(val ?? "");
      }
    } catch {
      // ignore
    }
  }

  return values;
}

export async function renderEventDocumentHtml(
  eventId: string,
  templateId: string
): Promise<string> {
  const [template, event] = await Promise.all([
    prisma.agendaDocumentTemplate.findUnique({ where: { id: templateId } }),
    prisma.event.findUnique({ where: { id: eventId }, select: { name: true } }),
  ]);

  if (!template || !event) throw new Error("Nie znaleziono eventu lub szablonu");

  const values = await buildValueMap(eventId);

  const pages: Page[] = JSON.parse(template.pagesJson);
  const eventName = values["event.name"] ?? event.name;

  const blockHtml = pages
    .map((page) => {
      const blocks = page.blocks
        .map((block) => renderBlock(block, values))
        .join("");
      return `<section class="page">${blocks}</section>`;
    })
    .join("");

  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(eventName)} — dokument</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #1f2937; background: #f3f4f6; margin: 0; padding: 24px; }
  .page { background: #fff; max-width: 820px; min-height: 1000px; margin: 0 auto 24px; padding: 40px; box-shadow: 0 1px 4px rgba(0,0,0,.12); }
  .header { text-align: center; border-bottom: 2px solid #1f2937; padding-bottom: 12px; margin-bottom: 24px; }
  .header h1 { margin: 0; font-size: 22px; }
  .header p { margin: 4px 0 0; font-size: 13px; color: #6b7280; }
  .section-title { font-size: 15px; font-weight: 700; margin: 18px 0 8px; }
  .columns { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .block { margin-bottom: 12px; }
  .field-label { font-size: 12px; color: #6b7280; }
  .field-value { font-size: 14px; white-space: pre-wrap; }
  .image-placeholder { display: flex; align-items: center; justify-content: center; background: #f9fafb; border: 1px dashed #d1d5db; color: #9ca3af; }
  .pagebreak { border-top: 2px dashed #9ca3af; text-align: center; padding: 8px 0; color: #9ca3af; font-size: 12px; }
  .spacer { width: 100%; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 13px; text-align: left; }
  @media print { body { background: #fff; padding: 0; } .page { box-shadow: none; max-width: none; margin: 0; } }
</style>
</head>
<body>${blockHtml}</body>
</html>`;
}

function resolve(slot: Slot, values: Record<string, string>): string {
  if (slot.fieldKey && values[slot.fieldKey]) return values[slot.fieldKey];
  if (slot.placeholder) return slot.placeholder;
  return "";
}

function renderBlock(block: Block, values: Record<string, string>): string {
  switch (block.type) {
    case "header":
      return `<div class="header">
        <h1>${escapeHtml(resolve(block.slots[0] ?? {} as Slot, values))}</h1>
        ${block.slots[1] ? `<p>${escapeHtml(resolve(block.slots[1], values))}</p>` : ""}
      </div>`;
    case "section":
      return `<div class="block">
        <div class="section-title">${escapeHtml(block.props?.title ?? "")}</div>
        ${block.slots.map((s) => `<div class="field-value">${escapeHtml(resolve(s, values))}</div>`).join("")}
      </div>`;
    case "text":
      return `<div class="block">${block.slots.map((s) => `<div class="field-value">${escapeHtml(resolve(s, values))}</div>`).join("")}</div>`;
    case "columns":
      return `<div class="columns" style="grid-template-columns: repeat(${block.props?.count ?? 2}, 1fr)">${block.slots
        .map((s) => `<div class="block"><span class="field-label">${escapeHtml(s.placeholder ?? "")}</span><div class="field-value">${escapeHtml(resolve(s, values))}</div></div>`)
        .join("")}</div>`;
    case "table":
      return `<table><tbody>${Array.from({ length: block.props?.rows ?? 3 })
        .map(() => `<tr>${Array.from({ length: block.props?.cols ?? 3 }).map(() => "<td>&nbsp;</td>").join("")}</tr>`)
        .join("")}</tbody></table>`;
    case "image":
      return `<div class="image-placeholder" style="height: ${block.props?.height ?? "200px"}">Obraz</div>`;
    case "spacer":
      return `<div class="spacer" style="height: ${block.props?.height ?? "20px"}"></div>`;
    case "pagebreak":
      return `<div class="pagebreak">— Nowa strona —</div>`;
    default:
      return "";
  }
}
