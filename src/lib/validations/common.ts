import { z } from "zod"

/**
 * Common validation schemas used across the application
 */

// Email validation
export const emailSchema = z.string().email("Nieprawidłowy adres email")

// Phone validation (Polish format)
export const phoneSchema = z.string().regex(
  /^(\+48)?[1-9]\d{8}$/,
  "Nieprawidłowy numer telefonu (format: +48123456789 lub 123456789)"
).optional()

// Date validation
export const dateSchema = z.date({
  required_error: "Data jest wymagana",
  invalid_type_error: "Nieprawidłowy format daty",
})

// Future date validation
export const futureDateSchema = dateSchema.min(new Date(), {
  message: "Data nie może być w przeszłości",
})

// Past date validation
export const pastDateSchema = dateSchema.max(new Date(), {
  message: "Data nie może być w przyszłości",
})

// Positive number validation
export const positiveNumberSchema = z.number().positive("Wartość musi być dodatnia")

// Non-negative number validation
export const nonNegativeNumberSchema = z.number().min(0, "Wartość nie może być ujemna")

// String with min length
export const requiredStringSchema = (minLength = 1, message = "To pole jest wymagane") =>
  z.string().min(minLength, message)

// Optional string
export const optionalStringSchema = z.string().optional()

// ID validation (CUID format)
export const idSchema = z.string().cuid("Nieprawidłowy identyfikator")

// URL validation
export const urlSchema = z.string().url("Nieprawidłowy adres URL").optional()

// Status enum schemas
export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE", "SKIPPED"], {
  errorMap: () => ({ message: "Nieprawidłowy status zadania" }),
})

export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"], {
  errorMap: () => ({ message: "Nieprawidłowy priorytet zadania" }),
})

export const guestStatusSchema = z.enum([
  "PENDING",
  "PENDING_INVITE",
  "INVITED",
  "TENTATIVE",
  "CONFIRMED",
  "ATTENDING",
  "DECLINED"
], {
  errorMap: () => ({ message: "Nieprawidłowy status gościa" }),
})

export const budgetItemStatusSchema = z.enum(["PLANNED", "PAID", "PENDING", "OVER_BUDGET"], {
  errorMap: () => ({ message: "Nieprawidłowy status pozycji budżetowej" }),
})

// Table type schema
export const tableTypeSchema = z.enum(["ROUND", "RECTANGULAR", "SQUARE"], {
  errorMap: () => ({ message: "Nieprawidłowy typ stołu" }),
})

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
})

export type PaginationInput = z.infer<typeof paginationSchema>

// Sort schemas
export const sortOrderSchema = z.enum(["asc", "desc"], {
  errorMap: () => ({ message: "Nieprawidłowy kierunek sortowania" }),
})

export const sortSchema = z.object({
  field: z.string(),
  order: sortOrderSchema.default("asc"),
})

export type SortInput = z.infer<typeof sortSchema>
