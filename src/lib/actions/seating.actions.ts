"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Table, Guest } from "@prisma/client"

type SeatingRuleType = "MUST_SIT_TOGETHER" | "CANNOT_SIT_TOGETHER" | "SAME_TABLE" | "PREFER_SIT_TOGETHER"
import { getCurrentUser } from "@/lib/auth/utils"
import { canAccessEvent } from "@/lib/auth/event-access"
import { generateSeatingPlanWithAI } from "@/lib/ai/seating-ai"

// --- CRUD for Seating Rules ---
export async function createSeatingRule(data: { eventId: string; type: SeatingRuleType; guestIds: string[] }) {
  const rule = await prisma.seatingRule.create({
    data: {
      eventId: data.eventId,
      type: data.type,
      guestIds: JSON.stringify(data.guestIds),
    },
  })
  revalidatePath(`/pl/seating`)
  revalidatePath(`/en/seating`)
  return rule
}

export async function deleteSeatingRule(ruleId: string) {
  const rule = await prisma.seatingRule.delete({
    where: { id: ruleId },
  })
  revalidatePath(`/pl/seating`)
  revalidatePath(`/en/seating`)
  return rule
}

// --- CRUD for Tables ---
export async function syncTables(eventId: string, tables: Partial<Table & { type?: string }>[]) {
  try {
    // Delete existing tables for the event
    await prisma.table.deleteMany({
      where: { eventId }
    });

    // Create new tables
    const createdTables = await prisma.$transaction(
      tables.map(table =>
        prisma.table.create({
          data: {
            name: table.name || `Stół ${table.id}`,
            capacity: table.capacity || 8,
            type: (table.type as string) || "ROUND",
            notes: table.notes || undefined,
            isCoupleTable: table.isCoupleTable ?? false,
            eventId,
          },
        })
      )
    );

    revalidatePath(`/pl/seating`)
    revalidatePath(`/en/seating`)
    return createdTables;
  } catch (error) {
    console.error("Error syncing tables:", error);
    throw new Error("Failed to sync tables");
  }
}

// --- Optimized AI Seating Plan Generation ---
export async function generateSeatingPlan(eventId: string) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        guests: { where: { status: "CONFIRMED" } },
        tables: { orderBy: { capacity: 'desc' } },
        rules: true,
      },
    });

    if (!event) return { success: false, error: "Event not found" };

    const { guests, tables, rules } = event;
    const guestTables = tables.filter(t => !t.isCoupleTable);
    const plan: Record<string, Guest[]> = Object.fromEntries(tables.map(t => [t.id, []]));
    const unseatedGuestIds = new Set(guests.map(g => g.id));
    const guestMap = new Map(guests.map(g => [g.id, g]));
    const brokenRules: string[] = [];

    // Pre-process conflicts for O(1) lookup
    const conflictMap = new Map<string, Set<string>>();
    rules.filter(r => r.type === 'CANNOT_SIT_TOGETHER').forEach(r => {
      let ids: string[] = [];
      if (r.guestIds && typeof r.guestIds === 'string') {
        try {
          // Try parsing as JSON first
          ids = JSON.parse(r.guestIds) as string[];
          if (!Array.isArray(ids)) ids = [];
        } catch {
          // Fall back to comma-separated string
          ids = r.guestIds.split(',').map(id => id.trim()).filter(Boolean);
        }
      }
      ids.forEach(id => {
        if (!conflictMap.has(id)) conflictMap.set(id, new Set());
        ids.forEach(otherId => {
          if (id !== otherId) conflictMap.get(id)!.add(otherId);
        });
      });
    });

    const hasConflict = (guestId: string, tableGuests: Guest[]) => {
      const conflicts = conflictMap.get(guestId);
      if (!conflicts) return false;
      for (const seatedGuest of tableGuests) {
        if (conflicts.has(seatedGuest.id)) return true;
      }
      return false;
    };

    // Seat groups first
    const mustSitTogetherRules = rules.filter(r => r.type === 'SAME_TABLE' || r.type === 'MUST_SIT_TOGETHER');
    for (const rule of mustSitTogetherRules) {
      let groupIds: string[] = [];
      if (rule.guestIds && typeof rule.guestIds === 'string') {
        try {
          // Try parsing as JSON first
          groupIds = JSON.parse(rule.guestIds) as string[];
          if (!Array.isArray(groupIds)) groupIds = [];
        } catch {
          // Fall back to comma-separated string
          groupIds = rule.guestIds.split(',').map(id => id.trim()).filter(Boolean);
        }
      }
      if (groupIds.length === 0 || groupIds.every(id => !unseatedGuestIds.has(id))) continue; // Skip if group already seated or empty

      const group = groupIds.map(id => guestMap.get(id)).filter(Boolean) as Guest[];
      if (group.length !== groupIds.length) continue;

      let seated = false;
      for (const table of guestTables) {
        if (plan[table.id].length + group.length <= table.capacity) {
          if (!group.some(guest => hasConflict(guest.id, plan[table.id]))) {
            plan[table.id].push(...group);
            group.forEach(g => unseatedGuestIds.delete(g.id));
            seated = true;
            break;
          }
        }
      }
      if (!seated) brokenRules.push(`Nie udało się usadzić grupy: ${group.map(g => g.name).join(', ')}`);
    }

    // Seat remaining guests, sorted by number of conflicts
    const sortedUnseatedIds = Array.from(unseatedGuestIds).sort((a, b) => (conflictMap.get(b)?.size || 0) - (conflictMap.get(a)?.size || 0));

    for (const guestId of sortedUnseatedIds) {
      const guest = guestMap.get(guestId)!;
      for (const table of guestTables) {
        if (plan[table.id].length < table.capacity && !hasConflict(guest.id, plan[table.id])) {
          plan[table.id].push(guest);
          unseatedGuestIds.delete(guest.id);
          break;
        }
      }
    }

    if (unseatedGuestIds.size > 0) {
      brokenRules.push(`Nie udało się usadzić ${unseatedGuestIds.size} gości.`);
    }

    // Database update
    await prisma.guest.updateMany({ where: { eventId }, data: { tableId: null } });
    if (Object.values(plan).some(g => g.length > 0)) {
      await prisma.$transaction(
        Object.entries(plan).flatMap(([tableId, seatedGuests]) =>
          seatedGuests.map(guest => prisma.guest.update({ where: { id: guest.id }, data: { tableId } }))
        )
      );
    }

    revalidatePath("/pl/seating")
    revalidatePath("/en/seating")

    if (brokenRules.length > 0) {
       return { success: false, error: brokenRules.join('\n') };
    }

    return { success: true, plan };
  } catch (error) {
    console.error("Error generating seating plan:", error);
    return { success: false, error: "Internal server error" };
  }
}

// AI-powered seating plan generation
export async function generateSeatingPlanAI(eventId: string) {
  try {
    if (!(await canAccessEvent(eventId))) throw new Error("Unauthorized");

    const event = await prisma.event.findFirst({
      where: { id: eventId },
      include: {
        guests: { where: { status: "CONFIRMED" } },
        tables: { orderBy: { capacity: 'desc' } },
        rules: true,
      },
    });

    if (!event) return { success: false, error: "Event not found" };

    const aiInput = {
      guests: event.guests.map(g => ({
        id: g.id,
        name: g.name,
        group: g.householdId || undefined,
        dietaryRestrictions: g.dietaryRestrictions || undefined,
        foodPreference: g.foodPreference || undefined,
        seatingNotes: g.seatingNotes || undefined,
        seatingPreference: g.seatingPreference || undefined,
        relationship: undefined,
        age: undefined,
      })),
      tables: event.tables.map(t => ({
        id: t.id,
        name: t.name,
        capacity: t.capacity,
        isCoupleTable: t.isCoupleTable ?? false,
      })),
      rules: event.rules.map(r => ({
        id: r.id,
        type: (r.type === "PREFER_SIT_TOGETHER" ? "MUST_SIT_TOGETHER" : r.type) as "MUST_SIT_TOGETHER" | "CANNOT_SIT_TOGETHER" | "SAME_TABLE",
        guestIds: r.guestIds ? (JSON.parse(r.guestIds) as string[]) : [],
      })),
      eventName: event.name,
    };

    const aiResult = await generateSeatingPlanWithAI(aiInput);

    if (!aiResult.success) {
      return aiResult;
    }

    // Apply AI-generated plan to database
    await prisma.guest.updateMany({ where: { eventId }, data: { tableId: null } });

    if (aiResult.plan && Object.keys(aiResult.plan).length > 0) {
      await prisma.$transaction(
        Object.entries(aiResult.plan || {}).flatMap(([tableId, seatedGuests]) =>
          seatedGuests.map(guest =>
            prisma.guest.update({
              where: { id: guest.id },
              data: { tableId }
            })
          )
        )
      );
    }

    revalidatePath(`/pl/seating`)
    revalidatePath(`/en/seating`)

    return {
      success: true,
      plan: aiResult.plan,
      warnings: aiResult.warnings,
      suggestions: aiResult.suggestions
    };

  } catch (error) {
    console.error("Error generating AI seating plan:", error);
    return { success: false, error: "Failed to generate AI seating plan" };
  }
}
