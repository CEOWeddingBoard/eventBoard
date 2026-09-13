import { JSDOM } from "jsdom"
import DOMPurify from "dompurify"

const window = new JSDOM("").window
const purify = DOMPurify(window as unknown as Window)

/**
 * Sanitize user input by stripping HTML tags and XSS vectors using DOMPurify.
 * SERVER-ONLY: uses jsdom which cannot be bundled for the browser.
 * React already escapes output by default; this is a defense-in-depth measure
 * for user-generated content stored in the database.
 */
export function sanitizeString(input: string): string {
  return purify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim()
}

export function sanitizeStrings<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj }
  for (const key of Object.keys(sanitized)) {
    if (typeof sanitized[key] === "string") {
      sanitized[key as keyof T] = sanitizeString(sanitized[key] as string) as T[keyof T]
    }
  }
  return sanitized
}

export { purify as domPurify }
