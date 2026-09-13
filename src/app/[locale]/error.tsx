'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-wedding-gradient flex items-center justify-center p-4">
      <div className="bg-wedding-card backdrop-blur-xl border border-olive/25 rounded-2xl shadow-wedding p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-script font-normal text-ink mb-2">
            Wystąpił błąd
          </h1>
          <p className="text-ink-muted text-sm">
            Przepraszamy za niedogodności. Spróbuj odświeżyć stronę lub wróć później.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-gold text-ink font-medium py-3 px-6 rounded-xl shadow-gold-soft hover:bg-gold-soft transition-all duration-300"
          >
            Spróbuj ponownie
          </button>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full border border-olive/40 text-olive hover:border-gold hover:text-gold py-3 px-6 rounded-xl transition-all duration-300"
          >
            Wróć do strony głównej
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-ink-muted hover:text-ink">
              Szczegóły błędu (tylko w development)
            </summary>
            <pre className="mt-2 text-xs bg-black/40 p-3 rounded border border-olive/25 text-red-300 overflow-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}