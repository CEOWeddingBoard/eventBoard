import { z } from "zod"
import { 
  requiredStringSchema, 
  optionalStringSchema,
  emailSchema,
  phoneSchema,
  urlSchema 
} from "./common"

/**
 * Vendor validation schemas
 */

// Predefined vendor categories (same as budget categories)
export const VENDOR_CATEGORIES = [
  "Sala weselna",
  "Catering",
  "Alkohol",
  "Fotograf / Kamera",
  "Muzyka / DJ",
  "Kwiaty / Dekoracje",
  "Suknia / Garnitur",
  "Zaproszenia / Papeteria",
  "Tort",
  "Transport",
  "Uroda (fryzura, makijaż)",
  "Noclegi",
  "Inne",
] as const

// Base schema for API operations (with eventId)
export const vendorBaseSchema = z.object({
  name: requiredStringSchema(1, "Nazwa dostawcy jest wymagana"),
  category: z.enum(VENDOR_CATEGORIES, { errorMap: () => ({ message: "Wybierz kategorię z listy" }) }),
  contact: optionalStringSchema,
  email: emailSchema.optional().or(z.literal("")),
  phone: phoneSchema.or(z.literal("")),
  notes: optionalStringSchema,
  vendorDaySchedule: optionalStringSchema,
  eventId: requiredStringSchema(1, "ID wydarzenia jest wymagane"),
})

// Schema for form validation (without eventId)
export const vendorFormSchema = z.object({
  name: requiredStringSchema(1, "Nazwa dostawcy jest wymagana"),
  category: z.enum(VENDOR_CATEGORIES, { errorMap: () => ({ message: "Wybierz kategorię z listy" }) }),
  contact: optionalStringSchema,
  email: emailSchema.optional().or(z.literal("")),
  phone: phoneSchema.or(z.literal("")),
  notes: optionalStringSchema,
  vendorDaySchedule: optionalStringSchema,
})

export const createVendorSchema = vendorBaseSchema

export const updateVendorSchema = vendorBaseSchema.partial().extend({
  id: z.string().cuid("Nieprawidłowy identyfikator dostawcy").optional(),
})

export const vendorQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  minRating: z.number().int().min(1).max(5).optional(),
})

export type VendorInput = z.infer<typeof createVendorSchema>
export type VendorUpdateInput = z.infer<typeof updateVendorSchema>
export type VendorQueryInput = z.infer<typeof vendorQuerySchema>
