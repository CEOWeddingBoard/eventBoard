import { X, Check } from "lucide-react";

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
  "Na jednym ekranie widać, kto ma następny ruch",
];


export function LandingBeforeAfter() {
  return (
    <section className="bg-[#f6f7f9] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8a6a22]">Zanim / po</p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-slate-900 sm:text-4xl">
            Ten sam zespół, o połowę mniej zamieszania
          </h2>
          <p className="mt-4 text-base text-slate-600">
            Nie dokładamy pracy — zabieramy ją. Zobacz różnicę na jednym przyjęciu.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Bez systemu</h3>
            <ul className="mt-5 space-y-3">
              {chaos.map((c) => (
                <li key={c} className="flex items-start gap-3 text-sm text-slate-600">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                    <X className="h-3 w-3" />
                  </span>
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border-2 border-[#0b1220] bg-[#0b1220] p-7 text-white shadow-2xl shadow-slate-900/25">
            <h3 className="text-sm font-bold uppercase tracking-wide text-[#e2c46b]">Z EventBoard</h3>
            <ul className="mt-5 space-y-3">
              {order.map((c) => (
                <li key={c} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <Check className="h-3 w-3" />
                  </span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
}
