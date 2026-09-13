import { z } from "zod"
import { 
  requiredStringSchema, 
  optionalStringSchema,
  tableTypeSchema 
} from "./common"

/**
 * Table validation schemas
 */

export const tableBaseSchema = z.object({
  name: requiredStringSchema(1, "Nazwa stołu jest wymagana"),
  capacity: z.number().int().positive().min(1).max(100),
  type: tableTypeSchema.default("ROUND"),
  notes: optionalStringSchema,
  positionX: z.number().optional().nullable(),
  positionY: z.number().optional().nullable(),
  width: z.number().positive().optional().nullable(),
  height: z.number().positive().optional().nullable(),
  isCoupleTable: z.boolean().optional().nullable(),
  eventId: requiredStringSchema(1, "ID wydarzenia jest wymagane"),
})

export const createTableSchema = tableBaseSchema

export const updateTableSchema = tableBaseSchema.partial().extend({
  id: z.string().cuid("Nieprawidłowy identyfikator stołu"),
})

export type TableInput = z.infer<typeof createTableSchema>
export type TableUpdateInput = z.infer<typeof updateTableSchema>
