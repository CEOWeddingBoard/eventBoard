import PizZip from "pizzip";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function paragraphXml(text: string, opts?: { bold?: boolean; center?: boolean }): string {
  const rPr = opts?.bold ? '<w:rPr><w:b/><w:sz w:val="24"/></w:rPr>' : '<w:rPr><w:sz w:val="22"/></w:rPr>';
  const pPr = opts?.center ? '<w:pPr><w:jc w:val="center"/></w:pPr>' : "";
  return `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const DOCUMENT_TEMPLATE = (body: string) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
${body}
<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>
</w:body>
</w:document>`;

const BRAND = "1F2937"; // grafit
const ACCENT = "B45309"; // ciepły brąz — akcent restauracyjny

/** Duży, wyśrodkowany tytuł dokumentu. */
function titleXml(text: string): string {
  return `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="40"/></w:pPr><w:r><w:rPr><w:b/><w:caps/><w:color w:val="${BRAND}"/><w:sz w:val="44"/></w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

/** Cienka linia pod tytułem / sekcją. */
function ruleXml(color = BRAND, size = 12): string {
  return `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="${size}" w:space="1" w:color="${color}"/></w:pBdr><w:spacing w:after="120"/></w:pPr></w:p>`;
}

/** Nagłówek sekcji: wersaliki, akcent, odstęp i podkreślenie. */
function sectionXml(text: string): string {
  return `<w:p><w:pPr><w:spacing w:before="240" w:after="60"/><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="2" w:color="D1D5DB"/></w:pBdr></w:pPr><w:r><w:rPr><w:b/><w:caps/><w:color w:val="${ACCENT}"/><w:sz w:val="24"/></w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

/** Wiersz „Etykieta: wartość" — etykieta pogrubiona, wartość zwykła. */
function kvXml(label: string, value: string): string {
  return `<w:p><w:pPr><w:spacing w:after="20"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="${BRAND}"/><w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">${escapeXml(label)}: </w:t></w:r><w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">${escapeXml(value)}</w:t></w:r></w:p>`;
}

/** Pozycja harmonogramu: godzina pogrubiona + opis. */
function scheduleXml(time: string, title: string): string {
  return `<w:p><w:pPr><w:spacing w:after="20"/><w:ind w:left="220"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="${ACCENT}"/><w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">${escapeXml(time)}   </w:t></w:r><w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">${escapeXml(title)}</w:t></w:r></w:p>`;
}

const SECTION_HEADERS = new Set([
  "HARMONOGRAM", "MENU", "UWAGI", "ROZLICZENIE", "AGENDA:",
  "GOŚCIE", "GOŚCIE (ALERGIE / DIETY)", "ZAKOŃCZENIE",
  "SCENARIUSZ", "USTALENIA Z PROCESU", "AKCEPTACJE",
]);

/**
 * Buduje profesjonalny plik .docx z treści tekstowej agendy:
 * tytuł, linia, nagłówki sekcji z podkreśleniem, wiersze „etykieta: wartość"
 * z pogrubioną etykietą oraz czytelny harmonogram.
 */
function agendaBodyParts(text: string): string[] {
  const lines = text.split("\n");
  const parts: string[] = [];
  let titleDone = false;

  for (const raw of lines) {
    const t = raw.trim();
    if (!t) {
      parts.push(paragraphXml(" "));
      continue;
    }
    if (!titleDone && (t === "Agenda" || t === "AGENDA")) {
      parts.push(titleXml("Agenda wydarzenia"));
      parts.push(ruleXml());
      titleDone = true;
      continue;
    }
    // Pozycja harmonogramu: "GG:MM — opis"
    const sched = t.match(/^(\d{1,2}:\d{2})\s*[—-]\s*(.+)$/);
    if (sched) {
      parts.push(scheduleXml(sched[1], sched[2]));
      continue;
    }
    // Nagłówek sekcji: linia zakończona ":" bez wartości
    const kv = t.match(/^(.+?):\s*(.*)$/);
    if (kv && kv[2] === "") {
      parts.push(sectionXml(kv[1]));
      continue;
    }
    if (kv) {
      parts.push(kvXml(kv[1], kv[2]));
      continue;
    }
    if (SECTION_HEADERS.has(t.toUpperCase())) {
      parts.push(sectionXml(t));
      continue;
    }
    parts.push(paragraphXml(t));
  }
  return parts;
}

export function buildAgendaDocx(text: string): Buffer {
  return buildDocxFromBody(agendaBodyParts(text).join(""));
}

export type AgendaImage = { caption: string; dataUrl: string };

function parseDataUrl(dataUrl: string): { bytes: Buffer; ext: string } | null {
  const m = dataUrl.match(/^data:image\/(png|jpe?g);base64,([A-Za-z0-9+/=]+)$/i);
  if (!m) return null;
  const ext = /png/i.test(m[1]) ? "png" : "jpg";
  return { bytes: Buffer.from(m[2], "base64"), ext };
}

/** Wymiary obrazu (px) z nagłówka pliku — PNG (IHDR) i JPEG (SOF). */
function imageDims(bytes: Buffer, ext: string): { w: number; h: number } {
  try {
    if (ext === "png") {
      return { w: bytes.readUInt32BE(16), h: bytes.readUInt32BE(20) };
    }
    let o = 2;
    while (o + 9 < bytes.length) {
      if (bytes[o] !== 0xff) { o++; continue; }
      const marker = bytes[o + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { h: bytes.readUInt16BE(o + 5), w: bytes.readUInt16BE(o + 7) };
      }
      o += 2 + bytes.readUInt16BE(o + 2);
    }
  } catch {
    // fallback niżej
  }
  return { w: 1000, h: 700 };
}

function drawingXml(rid: string, cx: number, cy: number, id: number): string {
  return `<w:p><w:pPr><w:spacing w:after="120"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="${id}" name="Skan ${id}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="Skan ${id}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

/** Buduje agendę DOCX z osadzonymi skanami menu pod każdym wariantem. */
export function buildAgendaDocxWithImages(text: string, images: AgendaImage[]): Buffer {
  const parts = agendaBodyParts(text);
  const media: { name: string; bytes: Buffer; rid: string }[] = [];

  const valid = images.map((img) => ({ img, p: parseDataUrl(img.dataUrl) })).filter((x) => x.p);
  if (valid.length > 0) {
    parts.push(sectionXml("Menu — skany"));
    valid.forEach(({ img, p }, i) => {
      const rid = `rIdImg${i + 1}`;
      const name = `image${i + 1}.${p!.ext}`;
      media.push({ name, bytes: p!.bytes, rid });
      parts.push(kvXml("Wariant", img.caption));
      const { w, h } = imageDims(p!.bytes, p!.ext);
      const maxW = 5029200; // ~5,5 cala w EMU
      const cx = Math.min(maxW, Math.round(w * 9525));
      const cy = Math.round(cx * (h / Math.max(1, w)));
      parts.push(drawingXml(rid, cx, cy, 1000 + i));
    });
  }

  if (media.length === 0) {
    return buildDocxFromBody(parts.join(""));
  }
  return buildDocxWithMedia(parts.join(""), media);
}

export type DocxLine = { text: string; bold?: boolean; center?: boolean };

/** Uniwersalny budowniczy DOCX — linie z opcjami pogrubienia/wyśrodkowania. */
export function buildSimpleDocx(lines: DocxLine[]): Buffer {
  const body = lines
    .map((line) =>
      line.text.trim()
        ? paragraphXml(line.text, { bold: line.bold, center: line.center })
        : paragraphXml(" "),
    )
    .join("");
  return buildDocxFromBody(body);
}

function buildDocxFromBody(body: string): Buffer {
  const zip = new PizZip();
  zip.file("[Content_Types].xml", CONTENT_TYPES);
  zip.file("_rels/.rels", RELS);
  zip.file("word/document.xml", DOCUMENT_TEMPLATE(body));

  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}

const CONTENT_TYPES_MEDIA = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Default Extension="png" ContentType="image/png"/>
<Default Extension="jpg" ContentType="image/jpeg"/>
<Default Extension="jpeg" ContentType="image/jpeg"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const DOCUMENT_TEMPLATE_MEDIA = (body: string) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>
${body}
<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>
</w:body>
</w:document>`;

function buildDocxWithMedia(
  body: string,
  media: { name: string; bytes: Buffer; rid: string }[],
): Buffer {
  const zip = new PizZip();
  zip.file("[Content_Types].xml", CONTENT_TYPES_MEDIA);
  zip.file("_rels/.rels", RELS);
  zip.file("word/document.xml", DOCUMENT_TEMPLATE_MEDIA(body));

  const rels = media
    .map(
      (m) =>
        `<Relationship Id="${m.rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${m.name}"/>`,
    )
    .join("");
  zip.file(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>`,
  );

  for (const m of media) {
    zip.file(`word/media/${m.name}`, m.bytes);
  }

  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
