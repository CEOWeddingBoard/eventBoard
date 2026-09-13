import { z } from "zod"
import { 
  requiredStringSchema, 
  optionalStringSchema,
  futureDateSchema,
  positiveNumberSchema,
  nonNegativeNumberSchema 
} from "./common"

/**
 * Event/Wedding validation schemas
 */

export const eventBaseSchema = z.object({
  name: requiredStringSchema(1, "Nazwa wydarzenia jest wymagana"),
  ceremonyDate: futureDateSchema.optional().nullable(),
  receptionDate: futureDateSchema.optional().nullable(),
  ceremonyLocation: optionalStringSchema,
  receptionLocation: optionalStringSchema,
  estimatedGuestCount: z.number().int().positive().max(10000).optional(),
  targetBudget: positiveNumberSchema.optional(),
  budgetTolerance: nonNegativeNumberSchema.optional(),
  style: optionalStringSchema,
  priorities: optionalStringSchema,
  notes: optionalStringSchema,
})

export const createEventSchema = eventBaseSchema

export const EVENT_TYPES = ["WEDDING", "COMMUNION", "CHRISTMAS_EVE", "CORPORATE", "OTHER"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const GUEST_LIST_MODES = ["FULL", "ALLERGENS_ONLY"] as const;
export type GuestListMode = (typeof GUEST_LIST_MODES)[number];

/** Schemat dla createEvent – używany przez akcję i formularz tworzenia wesela */
export const createEventSimpleSchema = z.object({
  name: requiredStringSchema(1, "Nazwa wydarzenia jest wymagana"),
  date: z.union([
    z.date(),
    z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Nieprawidłowy format daty"),
  ]),
  eventType: z.enum(EVENT_TYPES).optional().default("WEDDING"),
  guestListMode: z.enum(GUEST_LIST_MODES).optional().default("FULL"),
  brideName: optionalStringSchema,
  groomName: optionalStringSchema,
  partnerEmail: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()),
      "Nieprawidłowy e-mail partnera"
    ),
  estimatedGuestCount: z.coerce.number().int().min(1).max(10000).optional(),
  targetBudget: z.coerce.number().positive().optional(),
  budgetCurrency: z.enum(["PLN", "EUR", "USD"]).optional(),
  publicSlug: optionalStringSchema,
  description: optionalStringSchema,
  dressCode: optionalStringSchema,
  mapLocationUrl: optionalStringSchema,
  ceremonyLocationName: optionalStringSchema,
  ceremonyLocationUrl: optionalStringSchema,
  receptionLocationName: optionalStringSchema,
  receptionLocationUrl: optionalStringSchema,
  guestPortalEnabled: z.coerce.boolean().optional(),
  notificationPhone: optionalStringSchema,
  notificationDailyEnabled: z.coerce.boolean().optional(),
  notificationWeeklyEnabled: z.coerce.boolean().optional(),
  organizerName: optionalStringSchema,
  responsiblePerson: optionalStringSchema,
  eventEndTime: z
    .union([
      z.date(),
      z.string().refine((s) => !s || !Number.isNaN(Date.parse(s)), "Nieprawidłowy format godziny zakończenia"),
    ])
    .optional()
    .nullable(),
  occasionLabel: optionalStringSchema,
  scenarioNotes: optionalStringSchema,
  isWedding: z.coerce.boolean().optional(),
  status: z.enum(["DRAFT", "CONFIRMED", "COMPLETED", "ARCHIVED"]).optional(),
  categoryId: optionalStringSchema,
  hallId: optionalStringSchema,
  customFieldValues: z.record(z.string(), z.string()).optional(),
  workflowId: optionalStringSchema,
})

export type CreateEventSimpleInput = z.infer<typeof createEventSimpleSchema>

export const updateEventSchema = eventBaseSchema.partial().extend({
  id: z.string().cuid("Nieprawidłowy identyfikator wydarzenia"),
})

export const eventQuerySchema = z.object({
  search: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
})

export type EventInput = z.infer<typeof createEventSchema>
export type EventUpdateInput = z.infer<typeof updateEventSchema>
export type EventQueryInput = z.infer<typeof eventQuerySchema>
