import { prisma } from "@/lib/prisma"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

const OLIVE = rgb(0.49, 0.555, 0.431)
const GOLD = rgb(0.604, 0.522, 0.329)
const INK = rgb(0.176, 0.22, 0.141)
const LIGHT_GRAY = rgb(0.93, 0.93, 0.93)
const WHITE = rgb(1, 1, 1)

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("pl-PL")} PLN`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export async function generateWeddingReport(eventId: string): Promise<Buffer> {
  const [event, tasks, guests, vendors, budget, tables] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId } }),
    prisma.task.findMany({ where: { eventId }, orderBy: { dueDate: "asc" } }),
    prisma.guest.findMany({ where: { eventId }, orderBy: { name: "asc" } }),
    prisma.vendor.findMany({ where: { eventId }, orderBy: { category: "asc" } }),
    prisma.budgetItem.findMany({ where: { eventId } }),
    prisma.table.findMany({
      where: { eventId },
      include: { guests: { select: { id: true, name: true } } },
    }),
  ])

  if (!event) throw new Error("Event not found")

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let page = pdfDoc.addPage([595, 842])
  const { width, height } = page.getSize()
  const margin = 50
  let y = height - margin

  function addText(
    text: string,
    size: number,
    color: typeof INK = INK,
    opts?: { bold?: boolean; center?: boolean }
  ) {
    const f = opts?.bold ? fontBold : font
    const textWidth = f.widthOfTextAtSize(text, size)
    const x = opts?.center ? (width - textWidth) / 2 : margin
    if (y < margin + 40) {
      page = pdfDoc.addPage([595, 842])
      y = height - margin
    }
    page.drawText(text, { x, y, size, font: f, color })
    y -= size + 6
  }

  function addLine() {
    y -= 4
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 0.5,
      color: OLIVE,
    })
    y -= 10
  }

  function newPage() {
    page = pdfDoc.addPage([595, 842])
    y = height - margin
  }

  function addTable(headers: string[], rows: string[][]) {
    const colWidths = headers.map(
      (_, i) => (width - margin * 2) / headers.length
    )
    const rowHeight = 18

    if (y < margin + rowHeight * 3) newPage()

    headers.forEach((h, i) => {
      page.drawText(h, {
        x: margin + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
        y,
        size: 9,
        font: fontBold,
        color: WHITE,
      })
    })
    page.drawRectangle({
      x: margin,
      y: y - 2,
      width: width - margin * 2,
      height: rowHeight,
      color: OLIVE,
    })
    y -= rowHeight + 4

    for (const row of rows) {
      if (y < margin + rowHeight) newPage()

      row.forEach((cell, i) => {
        page.drawText(cell, {
          x: margin + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 2,
          y: y + 3,
          size: 8,
          font,
          color: INK,
        })
      })

      y -= rowHeight
      page.drawLine({
        start: { x: margin, y },
        end: { x: width - margin, y },
        thickness: 0.3,
        color: LIGHT_GRAY,
      })
    }
    y -= 12
  }

  // COVER PAGE
  addText("PLAN WESELA", 28, OLIVE, { bold: true, center: true })
  y -= 8
  addLine()
  addText(event.name, 22, GOLD, { bold: true, center: true })
  y -= 6
  addText(formatDate(event.date), 14, INK, { center: true })
  y -= 6
  if (event.brideName && event.groomName) {
    addText(`${event.brideName} & ${event.groomName}`, 16, INK, {
      center: true,
    })
    y -= 6
  }
  addText(`Wygenerowano: ${formatDate(new Date())}`, 10, INK, { center: true })

  // BUDGET SUMMARY
  newPage()
  addText("PODSUMOWANIE BUDŻETU", 18, OLIVE, { bold: true })
  addLine()

  const totalPlanned = budget.reduce((s, b) => s + b.plannedAmount, 0)
  const totalActual = budget.reduce((s, b) => s + (b.actualAmount ?? 0), 0)

  addText(`Budżet całkowity: ${formatCurrency(totalPlanned)}`, 12, INK, {
    bold: true,
  })
  addText(`Wydano: ${formatCurrency(totalActual)}`, 12, INK)
  addText(
    `Pozostało: ${formatCurrency(totalPlanned - totalActual)}`,
    12,
    INK,
    { bold: true }
  )
  y -= 8

  const budgetRows = budget.map((b) => [
    b.name,
    b.category,
    formatCurrency(b.plannedAmount),
    formatCurrency(b.actualAmount ?? 0),
    b.status,
  ])
  addTable(
    ["Nazwa", "Kategoria", "Planowane", "Rzeczywiste", "Status"],
    budgetRows
  )

  // GUEST LIST
  newPage()
  addText("LISTA GOŚCI", 18, OLIVE, { bold: true })
  addLine()
  addText(
    `Łącznie: ${guests.length} | Potwierdzone: ${guests.filter((g) => g.isAttending === true).length} | Oczekujące: ${guests.filter((g) => g.status === "PENDING").length}`,
    11,
    INK
  )
  y -= 4

  const guestRows = guests.map((g) => [
    g.name,
    g.email ?? "-",
    g.phone ?? "-",
    g.isAttending === true ? "Tak" : g.isAttending === false ? "Nie" : "?",
    g.dietaryRestrictions ?? "-",
    g.status,
  ])
  addTable(
    ["Imię i nazwisko", "Email", "Telefon", "Obecność", "Dieta", "Status"],
    guestRows
  )

  // SEATING PLAN
  newPage()
  addText("PLAN USADZENIA", 18, OLIVE, { bold: true })
  addLine()

  for (const table of tables) {
    addText(
      `${table.name} (${table.type ?? "OKRĄGŁY"}, ${table.capacity} os.)`,
      12,
      INK,
      { bold: true }
    )
    const assignedGuests = table.guests.map((g) => g.name)
    if (assignedGuests.length === 0) {
      addText("  (brak przypisanych gości)", 9, INK)
    } else {
      for (const gName of assignedGuests) {
        addText(`  ${gName}`, 9, INK)
      }
    }
    y -= 4
  }

  // VENDOR CONTACTS
  newPage()
  addText("KONTAKTY DO DOSTAWCÓW", 18, OLIVE, { bold: true })
  addLine()

  const vendorRows = vendors.map((v) => [
    v.name,
    v.category,
    v.contact ?? v.email ?? v.phone ?? "-",
    v.phone ?? "-",
    v.notes ?? "-",
  ])
  addTable(
    ["Nazwa", "Kategoria", "Kontakt", "Telefon", "Uwagi"],
    vendorRows
  )

  // TASK SUMMARY
  newPage()
  addText("LISTA ZADAŃ", 18, OLIVE, { bold: true })
  addLine()

  const completed = tasks.filter((t) => t.status === "DONE").length
  const total = tasks.length
  addText(`Ukończono: ${completed} / ${total} (${total > 0 ? Math.round((completed / total) * 100) : 0}%)`, 12, INK, { bold: true })
  y -= 4

  const taskRows = tasks.map((t) => [
    t.title,
    t.category ?? "-",
    t.priority,
    t.status,
    t.dueDate ? formatDate(t.dueDate) : "-",
    t.assigneeRole ?? "-",
  ])
  addTable(
    ["Zadanie", "Kategoria", "Priorytet", "Status", "Termin", "Osoba"],
    taskRows
  )

  // TIMELINE
  newPage()
  addText("OŚ CZASU", 18, OLIVE, { bold: true })
  addLine()

  const groupedByCategory = new Map<string, typeof tasks>()
  for (const t of tasks) {
    const cat = t.category ?? "Inne"
    if (!groupedByCategory.has(cat)) groupedByCategory.set(cat, [])
    groupedByCategory.get(cat)!.push(t)
  }

  for (const [category, catTasks] of groupedByCategory) {
    addText(category, 14, GOLD, { bold: true })
    for (const t of catTasks) {
      const statusIcon = t.status === "DONE" ? "[✓]" : t.status === "IN_PROGRESS" ? "[•]" : "[ ]"
      const dueStr = t.dueDate ? ` (do ${formatDate(t.dueDate)})` : ""
      addText(
        `  ${statusIcon} ${t.title}${dueStr}`,
        9,
        t.status === "DONE" ? OLIVE : INK
      )
    }
    y -= 6
  }

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}
