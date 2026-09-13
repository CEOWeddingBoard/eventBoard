/**
 * @jest-environment node
 */
/**
 * Generator dokumentu agendy.
 *
 * Agenda ma zaszyty układ — nie korzysta z szablonów dokumentów. Plik .docx
 * składamy tu ręcznie z XML-a, więc niezamknięty znacznik albo nieuciekniony
 * znak specjalny daje plik, którego Word nie otworzy. Tego nie widać inaczej
 * niż otwierając dokument, dlatego rozpakowujemy go w teście.
 */

import PizZip from "pizzip";
import { buildSimpleDocx, buildAgendaDocx } from "@/lib/agenda/agenda-docx";

function documentXml(buffer: Buffer): string {
  return new PizZip(buffer).file("word/document.xml")!.asText();
}

describe("buildSimpleDocx", () => {
  it("zwraca archiwum ZIP z kompletem części wymaganych przez Worda", () => {
    const buf = buildSimpleDocx([{ text: "Agenda przyjęcia" }]);

    expect(Buffer.isBuffer(buf)).toBe(true);
    // Sygnatura ZIP — .docx to spakowany katalog OOXML.
    expect(buf.subarray(0, 2).toString()).toBe("PK");

    const zip = new PizZip(buf);
    expect(zip.file("[Content_Types].xml")).toBeTruthy();
    expect(zip.file("_rels/.rels")).toBeTruthy();
    expect(zip.file("word/document.xml")).toBeTruthy();
  });

  it("przenosi treść wierszy do dokumentu", () => {
    const xml = documentXml(
      buildSimpleDocx([
        { text: "Wesele Kowalskich" },
        { text: "Sala Kominkowa" },
      ]),
    );

    expect(xml).toContain("Wesele Kowalskich");
    expect(xml).toContain("Sala Kominkowa");
  });

  it("ucieka znaki, które inaczej rozwaliłyby XML", () => {
    const xml = documentXml(buildSimpleDocx([{ text: 'Tort <bez orzechów> & "polewa"' }]));

    expect(xml).toContain("&lt;bez orzechów&gt;");
    expect(xml).toContain("&amp;");
    expect(xml).toContain("&quot;polewa&quot;");
    // Surowy nawias trójkątny z treści nie może trafić do dokumentu.
    expect(xml).not.toContain("<bez orzechów>");
  });

  it("oznacza wiersze pogrubione i wyśrodkowane", () => {
    const zwykly = documentXml(buildSimpleDocx([{ text: "zwykły" }]));
    const wyrozniony = documentXml(buildSimpleDocx([{ text: "nagłówek", bold: true, center: true }]));

    expect(zwykly).not.toContain("<w:b/>");
    expect(wyrozniony).toContain("<w:b/>");
    expect(wyrozniony).toContain('<w:jc w:val="center"/>');
  });

  it("radzi sobie z pustą listą wierszy", () => {
    const buf = buildSimpleDocx([]);
    expect(new PizZip(buf).file("word/document.xml")).toBeTruthy();
  });

  it("zachowuje polskie znaki", () => {
    const xml = documentXml(buildSimpleDocx([{ text: "Żurek, śledź, gołąbki — ćwikła" }]));
    expect(xml).toContain("Żurek, śledź, gołąbki — ćwikła");
  });
});

describe("buildAgendaDocx", () => {
  it("rozpoznaje wiersz harmonogramu i wyróżnia samą godzinę", () => {
    const xml = documentXml(buildAgendaDocx("HARMONOGRAM\n15:30 — Powitanie\n17:00 — Obiad"));

    expect(xml).toContain("HARMONOGRAM");
    // Godzina idzie własnym, pogrubionym fragmentem, opis zwykłym — dzięki temu
    // kuchnia czyta godziny w kolumnie, a nie w ciągu tekstu.
    expect(xml).toMatch(/<w:b\/>.*?15:30/s);
    expect(xml).toContain("Powitanie");
    expect(xml).toContain("Obiad");
    // Trzy wiersze wejściowe = co najmniej trzy akapity.
    expect((xml.match(/<w:p>/g) || []).length).toBeGreaterThanOrEqual(3);
  });
});
