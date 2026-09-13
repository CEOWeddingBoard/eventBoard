"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { logError } from "@/lib/errors/error-logger"

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  componentName?: string
}

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <CardTitle className="text-red-900">Coś poszło nie tak</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-red-800">
          Wystąpił błąd podczas renderowania komponentu. Spróbuj odświeżyć stronę lub skontaktuj się z pomocą techniczną.
        </p>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-red-700 font-medium">
              Szczegóły błędu (development)
            </summary>
            <pre className="mt-2 text-xs bg-red-100 p-3 rounded border border-red-200 text-red-900 overflow-auto max-h-64">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        <Button onClick={resetError} variant="outline" className="w-full">
          Spróbuj ponownie
        </Button>
      </CardContent>
    </Card>
  )
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error with context
    logError(error, {
      component: this.props.componentName || 'Unknown',
      metadata: {
        componentStack: errorInfo.componentStack,
      },
    })

    this.setState({
      errorInfo,
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback || DefaultErrorFallback
      return <Fallback error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}
