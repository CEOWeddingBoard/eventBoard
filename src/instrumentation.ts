/**
 * Hook uruchamiany przy starcie serwera. Wypisuje dzienny kod dostępu admina
 * do logów, żeby był dostępny od razu po deployu/restarcie (bez czekania na cron).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logDailyAdminCode } = await import("@/lib/auth/admin-access-code");
    logDailyAdminCode("boot");
  }
}
