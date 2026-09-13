"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ToggleProps {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: "default" | "sm" | "lg";
  children?: React.ReactNode;
}

const sizeClasses: Record<NonNullable<ToggleProps["size"]>, string> = {
  default: "h-10 w-10",
  sm: "h-8 w-8",
  lg: "h-12 w-12",
};

function Toggle({
  pressed = false,
  onPressedChange,
  disabled,
  className,
  size = "default",
  children,
}: ToggleProps) {
  return (
    <button
      type="button"
      data-state={pressed ? "on" : "off"}
      disabled={disabled}
      onClick={() => onPressedChange?.(!pressed)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-subtle/40 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "border border-olive/20 hover:border-olive/40",
        "text-ink-muted hover:text-ink",
        sizeClasses[size],
        className
      )}
    >
      {children}
    </button>
  );
}

export { Toggle };
export type { ToggleProps };
