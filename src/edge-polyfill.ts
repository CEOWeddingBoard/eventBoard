/**
 * Edge runtime lacks `self`; some deps (e.g. next-intl) expect it.
 * Import this first in middleware.
 */
if (typeof globalThis !== "undefined" && typeof (globalThis as unknown as { self?: unknown }).self === "undefined") {
  (globalThis as unknown as { self: unknown }).self = globalThis;
}
