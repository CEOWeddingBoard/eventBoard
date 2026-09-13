"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium font-sans tracking-wide ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-subtle/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-white border border-olive/20 text-ink shadow-wedding hover:border-olive/40 hover:-translate-y-0.5 hover:shadow-wedding-hover active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]",
        gold: "bg-gold-soft text-ink shadow-gold-soft hover:bg-gold hover:-translate-y-0.5 hover:shadow-wedding-hover active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-olive/40 bg-transparent text-olive hover:border-olive hover:bg-olive-muted",
        "outline-gold": "border border-gold-subtle/60 bg-transparent text-gold hover:bg-gold-muted hover:border-gold-soft hover:text-gold",
        secondary: "bg-olive-muted text-olive border border-olive/20 hover:bg-olive-muted/80 hover:border-olive/30",
        ghost: "hover:bg-olive-muted hover:text-ink",
        link: "text-olive underline-offset-4 hover:text-olive-dark hover:underline",
      },
      size: {
        default: "h-12 px-7 py-3.5",
        sm: "h-9 rounded-xl px-4",
        lg: "h-14 rounded-xl px-10",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, children, ...props }, ref) => {
    const compClassName = cn(buttonVariants({ variant, size }), className)
    if (asChild && React.Children.count(children) === 1 && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>
      return React.cloneElement(child, {
        ...props,
        className: cn(compClassName, child.props?.className),
        ref,
      })
    }
    return (
      <button
        className={compClassName}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
