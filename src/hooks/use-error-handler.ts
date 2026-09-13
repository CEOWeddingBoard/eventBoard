"use client"

import { useCallback } from "react"
import { toast } from "sonner"
import { logError, handleApiError } from "@/lib/errors/error-logger"
import { isRetryableError } from "@/lib/utils/retry"

interface UseErrorHandlerOptions {
  showToast?: boolean
  logError?: boolean
  context?: {
    component?: string
    action?: string
  }
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const {
    showToast = true,
    logError: shouldLog = true,
    context,
  } = options

  const handleError = useCallback((error: unknown, customMessage?: string) => {
    const appError = handleApiError(error)
    
    // Log error if enabled
    if (shouldLog) {
      logError(appError, context)
    }

    // Show toast notification
    if (showToast) {
      const message = customMessage || appError.message || "Wystąpił nieoczekiwany błąd"
      toast.error(message)
    }

    return appError
  }, [showToast, shouldLog, context])

  const handleAsyncError = useCallback(async <T,>(
    fn: () => Promise<T>,
    customMessage?: string
  ): Promise<T | null> => {
    try {
      return await fn()
    } catch (error) {
      handleError(error, customMessage)
      return null
    }
  }, [handleError])

  return {
    handleError,
    handleAsyncError,
  }
}

export function useRetryableErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { handleError } = useErrorHandler(options)

  const handleWithRetry = useCallback(async <T,>(
    fn: () => Promise<T>,
    maxRetries = 3
  ): Promise<T | null> => {
    let lastError: unknown
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break
        }

        // Only retry if error is retryable
        if (!isRetryableError(error)) {
          break
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    // Handle error after all retries failed
    handleError(lastError)
    return null
  }, [handleError])

  return {
    handleWithRetry,
  }
}
