import { z } from "zod"
import { 
  emailSchema, 
  phoneSchema, 
  requiredStringSchema, 
  optionalStringSchema,
  guestStatusSchema 
} from "./common"

/**
 * Guest validation schemas
 */

export const guestBaseSchema = z.object({
  name: requiredStringSchema(1, "Imię jest wymagane"),
  firstName: optionalStringSchema,
  lastName: optionalStringSchema,
  email: emailSchema.optional().or(z.literal("")),
  phone: z
    .union([phoneSchema, z.literal("")])
    .optional()
    .transform((s) => (s === "" ? undefined : s)),
  status: guestStatusSchema.default("PENDING"),
  notes: optionalStringSchema,
  isAttending: z.boolean().optional(),
  needsHotel: z.boolean().optional(),
  needsTransport: z.boolean().optional(),
  transportDetails: optionalStringSchema,
  foodPreference: optionalStringSchema,
  allergies: optionalStringSchema,
  dietaryRestrictions: optionalStringSchema,
  seatingNotes: optionalStringSchema,
  seatingPreference: optionalStringSchema,
  accommodationPreference: optionalStringSchema,
  alcoholPreference: optionalStringSchema,
  eventId: requiredStringSchema(1, "ID wydarzenia jest wymagane"),
  householdId: optionalStringSchema,
})

export const createGuestSchema = guestBaseSchema

export const updateGuestSchema = guestBaseSchema.partial().extend({
  id: z.string().cuid("Nieprawidłowy identyfikator gościa"),
})

export const guestQuerySchema = z.object({
  status: guestStatusSchema.optional(),
  householdId: z.string().optional(),
  search: z.string().optional(),
})

export type GuestInput = z.infer<typeof createGuestSchema>
export type GuestUpdateInput = z.infer<typeof updateGuestSchema>
export type GuestQueryInput = z.infer<typeof guestQuerySchema>
