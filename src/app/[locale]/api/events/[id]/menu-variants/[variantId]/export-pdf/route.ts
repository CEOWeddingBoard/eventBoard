import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const { variantId } = await params;

    const variant = await prisma.menuVariant.findUnique({
      where: { id: variantId },
      include: {
        courses: { orderBy: { sortOrder: "asc" } },
        event: { select: { name: true, date: true } },
      },
    });

    if (!variant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const courseLabels: Record<string, string> = {
      APPETIZER: "Przystawka",
      SOUP: "Zupa",
      MAIN: "Danie główne",
      DESSERT: "Deser",
      CAKE: "Tort",
      DRINKS: "Napoje",
      OTHER: "Inne",
    };

    const lines = [
      variant.event.name.toUpperCase(),
      variant.label,
      new Date(variant.event.date).toLocaleDateString("pl-PL", {
        year: "numeric", month: "long", day: "numeric",
      }),
      "",
      ...variant.courses.map(
        (c) => {
          const cat = courseLabels[c.courseType] ?? c.courseType;
          let allergens = "";
          try {
            const a = c.allergens ? JSON.parse(c.allergens) : {};
            const tags = [];
            if (a.vege) tags.push("Vege");
            if (a.gluten) tags.push("Gluten");
            if (a.bezgluten) tags.push("Bezgluten");
            if (a.inne) tags.push(a.inne);
            if (tags.length) allergens = `  [${tags.join(", ")}]`;
          } catch {}
          return `${cat}: ${c.name}${allergens}${c.description ? `\n    ${c.description}` : ""}`;
        }
      ),
    ];

    const text = lines.join("\n");

    return new NextResponse(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="menu-${variant.label.replace(/\s+/g, "-").toLowerCase()}.txt"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
