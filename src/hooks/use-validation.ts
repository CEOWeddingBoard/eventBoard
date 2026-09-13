"use client"

import { useCallback } from "react"
import { z } from "zod"
import { toast } from "sonner"
import { 
  validate, 
  safeValidate, 
  formatValidationErrors,
  getFirstValidationError,
  isValidationError
} from "@/lib/validations/validation-utils"
import { useErrorHandler } from "./use-error-handler"

interface UseValidationOptions {
  showToast?: boolean
  showAllErrors?: boolean
}

/**
 * Hook for form validation with consistent error handling
 */
export function useValidation<T>(schema: z.ZodSchema<T>, options: UseValidationOptions = {}) {
  const { showToast = true, showAllErrors = false } = options
  const { handleError } = useErrorHandler({
    context: { component: "Validation", action: "validate" },
    showToast: false, // We handle toasts ourselves
  })

  const validateData = useCallback((data: unknown): T => {
    try {
      return validate(schema, data)
    } catch (error) {
      if (isValidationError(error)) {
        const errorMessage = showAllErrors 
          ? formatValidationErrors(error.errors)
          : getFirstValidationError(error.errors)

        if (showToast) {
          toast.error(errorMessage)
        }

        throw error
      }

      handleError(error)
      throw error
    }
  }, [schema, showToast, showAllErrors, handleError])

  const safeValidateData = useCallback((data: unknown) => {
    return safeValidate(schema, data)
  }, [schema])

  return {
    validate: validateData,
    safeValidate: safeValidateData,
    isValidationError,
  }
}
