import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, verifyEventAccess, handleApiError } from "@/lib/api/auth-helper";
import { generateAIResponse } from "@/lib/ai";

const bodySchema = z.object({
  query: z.string().min(3, "Query too short").max(300, "Query too long"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireAuth(req);

    if (!(await verifyEventAccess(user.id, id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rawBody = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { query } = parsed.data;

    const [event, vendors] = await Promise.all([
      prisma.event.findUnique({
        where: { id },
        select: {
          name: true,
          date: true,
          description: true,
          style: true,
          mapLocationUrl: true,
        },
      }),
      prisma.vendor.findMany({
        where: { eventId: id },
        select: {
          id: true,
          name: true,
          category: true,
          email: true,
          phone: true,
          website: true,
          notes: true,
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    if (vendors.length === 0) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const vendorBlocks = vendors.map((v, idx) => {
      const lines = [
        `Vendor #${idx + 1}`,
        `id: ${v.id}`,
        `name: ${v.name}`,
        `category: ${v.category}`,
      ];
      if (v.notes) lines.push(`notes: ${v.notes}`);
      if (v.website) lines.push(`website: ${v.website}`);
      return lines.join("\n");
    });

    const weddingContext = event
      ? `Wesele: ${event.name || "brak nazwy"}
Data: ${
        event.date
          ? event.date.toISOString().slice(0, 10)
          : "nieokreślona"
      }
Styl / klimat: ${event.style || "brak"}
Opis: ${event.description || "brak"}
Lokalizacja (link / mapa): ${event.mapLocationUrl || "brak"}`
      : "Brak dodatkowego kontekstu wesela.";

    const prompt = `
Jesteś asystentem pary młodej w Wedding Board.

Masz:
- krótki kontekst wesela (styl, opis, lokalizacja),
- listę zapisanych w Wedding Board usługodawców (vendorów),
- zapytanie użytkownika (czego szuka).

Twoje zadanie:
- wybrać maksymalnie 5 NAJLEPIEJ pasujących usługodawców z listy,
- dla każdego podać krótko DLACZEGO pasuje (reason),
- jeśli to ma sens, w reason dodaj też frazę, którą para może wkleić w wyszukiwarkę internetową, np. "wyszukaj: fotograf ślubny boho Kraków".

WAŻNE:
- Odpowiedz wyłącznie w formacie JSON: {"results":[{"id":"<VENDOR_ID>","score":0.0-1.0,"reason":"krótkie uzasadnienie + ewentualna fraza do wyszukiwarki"}]}
- Używaj tylko identyfikatorów id przekazanych w danych wejściowych.
- score to ogólna ocena dopasowania (0.0 = słabe, 1.0 = idealne).

Kontekst wesela:
${weddingContext}

Zapytanie użytkownika:
"""${query}"""

Lista usługodawców:
${vendorBlocks.join("\n\n")}
`;

    let aiResults: { id: string; score: number; reason: string }[] | null = null;
    try {
      const { content } = await generateAIResponse(prompt, { jsonMode: true });
      const parsedJson = JSON.parse(content || "{}") as {
        results?: { id?: string; score?: number; reason?: string }[];
      };
      if (Array.isArray(parsedJson.results)) {
        aiResults = parsedJson.results
          .filter(
            (r): r is { id: string; score: number; reason: string } =>
              Boolean(r.id) && typeof r.id === "string",
          )
          .map((r) => ({
            id: r.id!,
            score:
              typeof r.score === "number" && !Number.isNaN(r.score) && r.score >= 0
                ? Math.min(1, Math.max(0, r.score))
                : 0.5,
            reason: r.reason || "",
          }));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[vendor-search-ai] AI failed, falling back to basic search", error);
    }

    if (!aiResults || aiResults.length === 0) {
      const q = query.toLowerCase();
      const basicMatches = vendors
        .filter((v) => {
          const haystack = `${v.name} ${v.category} ${v.notes ?? ""}`.toLowerCase();
          return haystack.includes(q);
        })
        .slice(0, 5)
        .map((v) => ({
          id: v.id,
          score: 0.5,
          reason: "Dopasowanie po nazwie, kategorii lub notatkach.",
        }));

      aiResults = basicMatches;
    }

    const vendorById = new Map(vendors.map((v) => [v.id, v]));
    const responseResults = (aiResults || [])
      .filter((r) => vendorById.has(r.id))
      .sort((a, b) => b.score - a.score)
      .map((r) => {
        const v = vendorById.get(r.id)!;
        return {
          id: v.id,
          name: v.name,
          category: v.category,
          reason: r.reason,
        };
      });

    return NextResponse.json({ results: responseResults }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

