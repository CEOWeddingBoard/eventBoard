"use client"

import { Button } from "@/components/ui/button"
import { IconAdd } from "@/components/icons"

interface PageHeaderProps {
  title: string
  subtitle: string
  actionText?: string
  onAction?: () => void
  children?: React.ReactNode
}

export function PageHeader({ title, subtitle, actionText, onAction, children }: PageHeaderProps) {
  return (
    <div className="mb-8 flex items-center justify-between border-b border-olive/25 pb-6">
      <div>
        <h1 className="font-script text-4xl font-normal tracking-tight text-ink">{title}</h1>
        <p className="mt-2 text-base font-light text-ink-muted tracking-wide">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        {children}
        {actionText && onAction && (
          <Button onClick={onAction} variant="gold">
            <IconAdd className="mr-2 h-4 w-4" />
            {actionText}
          </Button>
        )}
      </div>
    </div>
  )
}
