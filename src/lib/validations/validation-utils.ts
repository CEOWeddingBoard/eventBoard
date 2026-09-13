import { z } from "zod"
import { AppError } from "@/lib/errors/error-logger"

/**
 * Validation utilities for consistent error handling
 */

export interface ValidationErrorItem {
  field: string
  message: string
  code?: string
}

export class ValidationError extends Error {
  constructor(
    public errors: ValidationErrorItem[],
    message = "Błąd walidacji"
  ) {
    super(message)
    this.name = "ValidationError"
  }
}

/**
 * Parse and validate data with Zod schema
 * Returns validated data or throws ValidationError
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: { action?: string; component?: string }
): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors: ValidationErrorItem[] = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code,
      }))

      throw new ValidationError(validationErrors)
    }

    throw new AppError(
      "Wystąpił błąd podczas walidacji",
      "VALIDATION_ERROR",
      400,
      context
    )
  }
}

/**
 * Safe parse - returns result instead of throwing
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: ValidationErrorItem[] } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors: ValidationErrorItem[] = result.error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
    code: err.code,
  }))

  return { success: false, errors }
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationErrorItem[]): string {
  return errors.map((err) => `${err.field}: ${err.message}`).join(", ")
}

/**
 * Get first validation error message
 */
export function getFirstValidationError(errors: ValidationErrorItem[]): string {
  return errors[0]?.message || "Błąd walidacji"
}

/**
 * Check if error is validation error
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError
}
