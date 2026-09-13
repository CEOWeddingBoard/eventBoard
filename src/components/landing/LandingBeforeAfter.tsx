import { X, Check, Building2, Utensils, Warehouse } from "lucide-react";

const chaos = [
  "Ustalenia rozsypane po mailach, SMS-ach i karteczkach",
  "Menu i liczba porcji przepisywane ręcznie kilka razy",
  "Agenda dla kuchni składana w Wordzie w noc przed imprezą",
  "Pominięta alergia albo zdublowany termin",
  "Nikt nie wie, na jakim etapie jest dane przyjęcie",
];

const order = [
  "Jeden proces prowadzi obsługę krok po kroku",
  "Klient sam wybiera menu i podaje diety w swoim portalu",
  "Agenda składa się automatycznie z zebranych ustaleń",
  "Alergie i porcje spisane raz — widoczne dla kuchni i obsługi",
  "Na wskroś widać, kto ma następny ruch",
];

const segments = [
  { icon: Building2, label: "Sale weselne i domy weselne" },
  { icon: Utensils, label: "Restauracje z salą bankietową" },
  { icon: Warehouse, label: "Obiekty wielosalowe i eventowe" },
];

export function LandingBeforeAfter() {
  return (
    <section className="bg-[#faf9f7] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7a5f28]">Zanim / po</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            Ten sam zespół, o połowę mniej zamieszania
          </h2>
          <p className="mt-4 text-base text-stone-700">
            Nie dokładamy pracy — zabieramy ją. Zobacz różnicę na jednym przyjęciu.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wide text-stone-500">Bez systemu</h3>
            <ul className="mt-5 space-y-3">
              {chaos.map((c) => (
                <li key={c} className="flex items-start gap-3 text-sm text-stone-600">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                    <X className="h-3 w-3" />
                  </span>
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border-2 border-[#0f172a] bg-[#0f172a] p-7 text-white shadow-2xl shadow-slate-900/25">
            <h3 className="text-sm font-bold uppercase tracking-wide text-amber-200">Z EventBoard</h3>
            <ul className="mt-5 space-y-3">
              {order.map((c) => (
                <li key={c} className="flex items-start gap-3 text-sm text-stone-200">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <Check className="h-3 w-3" />
                  </span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[#7a5f28]">Dla kogo</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {segments.map((s) => (
              <span key={s.label} className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm">
                <s.icon className="h-4 w-4 text-[#7a5f28]" />
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
