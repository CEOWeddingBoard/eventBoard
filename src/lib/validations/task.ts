import { z } from "zod"
import { 
  requiredStringSchema, 
  optionalStringSchema,
  dateSchema,
  taskStatusSchema,
  taskPrioritySchema 
} from "./common"

/**
 * Task validation schemas
 */

export const ASSIGNEE_ROLES = ["TOGETHER", "BRIDE", "GROOM", "PARENTS", "WITNESSES", "OTHER"] as const;
export type AssigneeRole = (typeof ASSIGNEE_ROLES)[number];

export const assigneeRoleSchema = z.enum(ASSIGNEE_ROLES).optional().nullable();

export const taskBaseSchema = z.object({
  title: requiredStringSchema(1, "Tytuł zadania jest wymagany"),
  description: optionalStringSchema,
  category: requiredStringSchema(1, "Kategoria jest wymagana"),
  status: taskStatusSchema.default("TODO"),
  priority: taskPrioritySchema.default("MEDIUM"),
  dueDate: dateSchema.optional().nullable(),
  assigneeRole: assigneeRoleSchema,
  assignedTo: optionalStringSchema,
  eventId: requiredStringSchema(1, "ID wydarzenia jest wymagane"),
})

export const createTaskSchema = taskBaseSchema

export const updateTaskSchema = taskBaseSchema.partial().extend({
  id: z.string().cuid("Nieprawidłowy identyfikator zadania"),
})

export const taskQuerySchema = z.object({
  status: taskStatusSchema.optional(),
  category: z.string().optional(),
  priority: taskPrioritySchema.optional(),
  search: z.string().optional(),
})

export type TaskInput = z.infer<typeof createTaskSchema>
export type TaskUpdateInput = z.infer<typeof updateTaskSchema>
export type TaskQueryInput = z.infer<typeof taskQuerySchema>
