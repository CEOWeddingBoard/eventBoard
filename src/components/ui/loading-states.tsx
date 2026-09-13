"use client"

import { Loader2 } from "lucide-react"
import { Skeleton, SkeletonCard, SkeletonTable, SkeletonList, SkeletonForm } from "./skeleton"
import { Card, CardContent } from "./card"
import { Button } from "./button"

interface LoadingStateProps {
  message?: string
  fullScreen?: boolean
}

export function LoadingState({ message = "Ładowanie...", fullScreen = false }: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <Loader2 className="h-8 w-8 animate-spin text-gold" />
      <p className="text-sm text-ink-muted">{message}</p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50">
        {content}
      </div>
    )
  }

  return content
}

interface ErrorStateProps {
  error: string | Error
  onRetry?: () => void
  retryLabel?: string
}

export function ErrorState({ error, onRetry, retryLabel = "Spróbuj ponownie" }: ErrorStateProps) {
  const errorMessage = error instanceof Error ? error.message : error

  return (
    <Card className="border-red-500/30 bg-red-500/5">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
          <div className="text-4xl">⚠️</div>
          <div>
            <p className="font-medium text-red-400 mb-1">Wystąpił błąd</p>
            <p className="text-sm text-red-300/90">{errorMessage}</p>
          </div>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" className="border-red-500/40 hover:bg-red-500/10 text-red-400">
              {retryLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface EmptyStateProps {
  title?: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ 
  title = "Brak danych", 
  description = "Nie znaleziono żadnych elementów.",
  action 
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <div className="text-4xl opacity-50">📭</div>
          <div>
            <p className="font-serif font-medium text-ink mb-1">{title}</p>
            <p className="text-sm text-ink-muted">{description}</p>
          </div>
          {action}
        </div>
      </CardContent>
    </Card>
  )
}

// Export skeleton components
export { Skeleton, SkeletonCard, SkeletonTable, SkeletonList, SkeletonForm }
