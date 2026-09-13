"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useErrorHandler } from "./use-error-handler"

interface OptimisticUpdateOptions<TData, TVariables, TContext = unknown> {
  queryKey: string[]
  optimisticUpdate: (variables: TVariables) => TData
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: Error, variables: TVariables, context: TContext | undefined) => void
  errorMessage?: string
}

/**
 * Hook for optimistic mutations with automatic query invalidation
 * Provides optimistic updates and rollback on error
 */
export function useOptimisticMutation<
  TData = unknown,
  TVariables = unknown,
  TContext = unknown
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: OptimisticUpdateOptions<TData, TVariables, TContext>
) {
  const queryClient = useQueryClient()
  const { handleError } = useErrorHandler({
    context: { action: 'mutation' },
  })

  const { queryKey, optimisticUpdate, onSuccess, onError, errorMessage } = options

  return useMutation<TData, Error, TVariables, TContext>({
    mutationFn,
    
    // Optimistic update
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TData[]>(queryKey)

      // Optimistically update
      const optimisticData = optimisticUpdate(variables)
      queryClient.setQueryData<TData[]>(queryKey, (old = []) => {
        // Handle both array and single value updates
        if (Array.isArray(old)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const existing = old.find((item: any) => 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (item as any).id === (optimisticData as any).id
          )
          if (existing) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return old.map((item: any) => 
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (item as any).id === (optimisticData as any).id ? optimisticData : item
            )
          }
          return [optimisticData, ...old]
        }
        return optimisticData as TData[]
      })

      // Return context for rollback
      return { previousData } as TContext
    },

    // On error, rollback
    onError: (error, variables, context) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (context && (context as any).previousData !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        queryClient.setQueryData(queryKey, (context as any).previousData)
      }
      
      handleError(error, errorMessage)
      if (onError) {
        onError(error, variables, context)
      }
    },

    // On success, invalidate queries
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey })
      if (onSuccess) {
        onSuccess(data, variables)
      }
    },

    // On settled, always invalidate to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}
