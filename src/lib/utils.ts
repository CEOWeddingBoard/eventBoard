import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "PLN") {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatDate(date: Date | string, locale: string = "pl-PL") {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}
