/**
 * Strony prawne: regulamin, RODO i bramka akceptacji.
 *
 * Leżą poza panelem (`.eb-ui`) i poza landingiem (`.landing-clean`), więc
 * bez własnej klasy dostawały globalny krój: kaligraficzny nagłówek H1
 * i szeryfowe podtytuły. Regulamin w krojach od zaproszeń ślubnych wygląda
 * jak pomyłka, a to ekran, na którym klient podejmuje formalną decyzję.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <div className="legal-page min-h-screen bg-[#faf9f7]">{children}</div>;
}
