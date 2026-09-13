import { z } from "zod"
import { 
  requiredStringSchema, 
  positiveNumberSchema,
  nonNegativeNumberSchema,
  budgetItemStatusSchema 
} from "./common"

/**
 * Budget validation schemas
 */

export const budgetItemBaseSchema = z.object({
  name: requiredStringSchema(1, "Nazwa pozycji budżetowej jest wymagana"),
  category: requiredStringSchema(1, "Kategoria jest wymagana"),
  plannedAmount: positiveNumberSchema,
  actualAmount: nonNegativeNumberSchema.optional().nullable(),
  status: budgetItemStatusSchema.default("PLANNED"),
  eventId: requiredStringSchema(1, "ID wydarzenia jest wymagane"),
})

export const createBudgetItemSchema = budgetItemBaseSchema

export const updateBudgetItemSchema = budgetItemBaseSchema.partial().extend({
  id: z.string().cuid("Nieprawidłowy identyfikator pozycji budżetowej").optional(),
})

export const budgetQuerySchema = z.object({
  category: z.string().optional(),
  status: budgetItemStatusSchema.optional(),
  minAmount: nonNegativeNumberSchema.optional(),
  maxAmount: nonNegativeNumberSchema.optional(),
  search: z.string().optional(),
})

export type BudgetItemInput = z.infer<typeof createBudgetItemSchema>
export type BudgetItemUpdateInput = z.infer<typeof updateBudgetItemSchema>
export type BudgetQueryInput = z.infer<typeof budgetQuerySchema>
