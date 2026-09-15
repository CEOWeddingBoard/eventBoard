"use client";

import { useState } from "react";
import { Eye, PencilLine, Trash2, ShieldCheck, ArrowRight, ArrowLeft, Check } from "lucide-react";

/**
 * Kreator podłączania kalendarza Google.
 *
 * Wcześniej był tu jeden przycisk, który od razu prosił Google o pełne prawa
 * do kalendarza. Obiekt oddaje nam dostęp do swojego kalendarza firmowego,
 * więc musi najpierw zobaczyć, o co dokładnie prosimy i dlaczego — i móc
 * to zawęzić.
 *
 * Uczciwość w opisach jest tu funkcją, nie uprzejmością: Google nie zna
 * uprawnienia „zapisuj, ale nie kasuj”, więc przy poziomie środkowym prosimy
 * o ten sam zakres co przy pełnym, a różnicę egzekwuje EventBoard. Mówimy
 * o tym wprost, zamiast sugerować, że pilnuje tego Google.
 */

type Poziom = "READ" | "WRITE" | "FULL";

const POZIOMY: {
  value: Poziom;
  label: string;
  icon: typeof Eye;
  opis: string;
  czyliMozemy: string[];
  czyliNieMozemy: string[];
  /** Kto realnie pilnuje granicy — to różnica, którą trzeba pokazać. */
  pilnuje: string;
}[] = [
  {
    value: "READ",
    label: "Tylko podgląd",
    icon: Eye,
    opis: "Rezerwacje z Google widać na grafiku i blokują terminy. EventBoard niczego tam nie zapisuje.",
    czyliMozemy: ["Czytać terminy", "Pokazywać je na grafiku", "Ostrzegać o kolizjach"],
    czyliNieMozemy: ["Dodawać wpisów", "Zmieniać istniejących", "Usuwać czegokolwiek"],
    pilnuje: "Google — prosimy o węższy zakres, zapis jest technicznie niemożliwy.",
  },
  {
    value: "WRITE",
    label: "Podgląd i zapis",
    icon: PencilLine,
    opis: "Przyjęcia z EventBoarda trafiają do kalendarza i aktualizują się przy zmianie terminu. Nic nie znika.",
    czyliMozemy: ["Wszystko z podglądu", "Dodawać przyjęcia", "Aktualizować przy zmianie daty"],
    czyliNieMozemy: ["Usuwać wpisów — odwołane przyjęcie zostaje oznaczone jako „[odwołane]”"],
    pilnuje: "EventBoard — Google nie zna takiego stopnia, więc to nasza reguła, nie jego.",
  },
  {
    value: "FULL",
    label: "Pełna synchronizacja",
    icon: Trash2,
    opis: "Jak wyżej, a dodatkowo zarchiwizowane przyjęcie znika z kalendarza i zwalnia termin.",
    czyliMozemy: ["Wszystko z zapisu", "Usuwać wpis po zarchiwizowaniu przyjęcia"],
    czyliNieMozemy: ["Dotykać wpisów, których sam nie utworzył"],
    pilnuje: "EventBoard — kasujemy wyłącznie wpisy założone przez nas.",
  },
];

export function GoogleConnectWizard({
  locale,
  configured,
  onClose,
}: {
  locale: string;
  configured: boolean;
  onClose: () => void;
}) {
  const [krok, setKrok] = useState(1);
  const [poziom, setPoziom] = useState<Poziom>("FULL");
  const wybrany = POZIOMY.find((p) => p.value === poziom)!;

  return (
    <div className="mt-4 rounded-lg border border-neutral-300 bg-white">
      {/* Pasek kroków */}
      <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-2.5">
        {["Czego dotyczy", "Poziom dostępu", "Potwierdzenie"].map((nazwa, i) => {
          const numer = i + 1;
          const aktywny = krok === numer;
          const zrobiony = krok > numer;
          return (
            <div key={nazwa} className="flex items-center gap-2">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  zrobiony
                    ? "bg-emerald-100 text-emerald-700"
                    : aktywny
                      ? "bg-[#0f172a] text-white"
                      : "bg-neutral-200 text-neutral-500"
                }`}
              >
                {zrobiony ? <Check className="h-3 w-3" /> : numer}
              </span>
              <span
                className={`text-xs ${aktywny ? "font-semibold text-neutral-800" : "text-neutral-500"}`}
              >
                {nazwa}
              </span>
              {numer < 3 && <span className="mx-1 h-px w-5 bg-neutral-200" />}
            </div>
          );
        })}
      </div>

      <div className="p-4">
        {krok === 1 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-neutral-800">Co się właściwie podłącza</h3>
            <p className="text-xs leading-relaxed text-neutral-600">
              Podłączasz <b>jedno konto Google</b> i jego kalendarz podstawowy. Dostęp należy do
              przestrzeni obiektu, nie do osoby, która klika — kalendarz działa dalej, gdy ta osoba
              odejdzie z pracy. Możesz podłączyć kilka kont, każde w swoim kolorze, i przypisać je
              do konkretnych sal.
            </p>
            <ul className="space-y-1.5 text-xs text-neutral-600">
              {[
                "Zaraz przeniesiemy Cię na ekran logowania Google — to strona Google, nie nasza.",
                "Hasła do konta Google nie widzimy i nie przechowujemy.",
                "Dostęp możesz cofnąć w każdej chwili: u nas przyciskiem odłączenia, a po stronie Google w ustawieniach konta.",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {krok === 2 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-neutral-800">Ile dostępu nam dajesz</h3>
            <p className="text-xs text-neutral-600">
              Wybierz najmniej, ile wystarczy. Poziom da się później podnieść, ale wymaga wtedy
              ponownego zalogowania do Google.
            </p>

            <div className="space-y-2">
              {POZIOMY.map((p) => {
                const zaznaczony = poziom === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPoziom(p.value)}
                    className={`flex w-full gap-3 rounded-md border p-3 text-left transition-colors ${
                      zaznaczony
                        ? "border-[#0f172a] bg-neutral-50"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <p.icon
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        zaznaczony ? "text-[#0f172a]" : "text-neutral-400"
                      }`}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-neutral-800">{p.label}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-neutral-600">
                        {p.opis}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {krok === 3 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-neutral-800">
              Potwierdź: {wybrany.label.toLowerCase()}
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                  EventBoard będzie mógł
                </p>
                <ul className="mt-1.5 space-y-1 text-xs text-emerald-900">
                  {wybrany.czyliMozemy.map((t) => (
                    <li key={t}>• {t}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-600">
                  Nie będzie mógł
                </p>
                <ul className="mt-1.5 space-y-1 text-xs text-neutral-700">
                  {wybrany.czyliNieMozemy.map((t) => (
                    <li key={t}>• {t}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Kto pilnuje granicy — przy poziomie środkowym to nie Google. */}
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <b>Kto tego pilnuje:</b> {wybrany.pilnuje}
            </p>

            <p className="text-xs text-neutral-500">
              Każda operacja na kalendarzu trafia do dziennika poniżej — z nazwiskiem osoby
              z EventBoarda i adresem konta Google, na którym się wydarzyła.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-neutral-200 px-4 py-3">
        <button
          type="button"
          onClick={() => (krok === 1 ? onClose() : setKrok(krok - 1))}
          className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {krok === 1 ? "Anuluj" : "Wstecz"}
        </button>

        {krok < 3 ? (
          <button
            type="button"
            onClick={() => setKrok(krok + 1)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#0f172a] px-3 py-2 text-xs font-medium text-white hover:bg-[#1e293b]"
          >
            Dalej
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : configured ? (
          <a
            href={`/${locale}/api/google/oauth?locale=${locale}&mode=${poziom}`}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#0f172a] px-3 py-2 text-xs font-medium text-white hover:bg-[#1e293b]"
          >
            Przejdź do Google
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md bg-neutral-200 px-3 py-2 text-xs font-medium text-neutral-500"
            title="Serwer nie ma jeszcze kluczy Google"
          >
            Przejdź do Google
          </span>
        )}
      </div>
    </div>
  );
}
