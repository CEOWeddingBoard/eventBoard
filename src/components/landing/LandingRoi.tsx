"use client";

import { useState } from "react";
import { Clock, TrendingUp, Wallet, AlertTriangle } from "lucide-react";

const MONTHS_FREE = 2;
const zl = (n: number) => `${Math.round(n).toLocaleString("pl-PL")} zł`;

const plans = [
  { name: "Start · 1 sala", monthly: 249 },
  { name: "Pro · do 5 sal", monthly: 599 },
];

function Field({
  label,
  hint,
  value,
  display,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-sm font-semibold text-slate-600">{label}</label>
        <span className="text-sm font-bold tabular-nums text-slate-900">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#0b1220]"
      />
      {hint && <p className="mt-1.5 text-[11.5px] leading-snug text-slate-500">{hint}</p>}
    </div>
  );
}

export function LandingRoi() {
  const [events, setEvents] = useState(6);
  const [hours, setHours] = useState(4);
  const [rate, setRate] = useState(60);
  const [errors, setErrors] = useState(500);
  const [plan, setPlan] = useState(599);

  const totalHours = events * hours;
  const timeSave = totalHours * rate;
  const totalSave = timeSave + errors;
  const net = totalSave - plan;
  const roi = plan > 0 ? Math.round((net / plan) * 100) : 0;
  const days = totalSave > 0 ? Math.max(1, Math.round((plan / totalSave) * 30)) : 30;
  const ratio = totalSave > 0 ? Math.min(100, Math.round((plan / totalSave) * 100)) : 100;
  const effMonthly = Math.round((plan * (12 - MONTHS_FREE)) / 12);

  return (
    <section id="kalkulator" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8a6a22]">Kalkulator</p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-slate-900 sm:text-4xl">
            Policz, ile realnie oszczędza Twoja sala
          </h2>
          <p className="mt-4 text-base text-slate-600">
            Przesuń suwaki pod swój obiekt. Zobaczysz, ile kosztuje Cię ręczna koordynacja
            i pomyłki — i jak to wygląda przy cenie systemu.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-[1.05fr_.95fr]">
          {/* Inputs */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
            <h3 className="text-base font-bold text-slate-900">Twój obiekt</h3>
            <p className="mt-1 text-sm text-slate-500">Podaj przybliżone wartości — wynik liczy się od razu.</p>

            <div className="mt-6 space-y-6">
              <Field label="Eventy miesięcznie" value={events} display={`${events}`} min={1} max={30} onChange={setEvents} />
              <Field
                label="Godziny koordynacji na event"
                hint="Telefony, maile, przepisywanie ustaleń, składanie agendy dla kuchni i obsługi."
                value={hours}
                display={`${hours} h`}
                min={1}
                max={16}
                onChange={setHours}
              />
              <Field label="Koszt godziny pracy" value={rate} display={`${rate} zł/h`} min={30} max={150} step={5} onChange={setRate} />
              <Field
                label="Koszt pomyłek miesięcznie"
                hint="Źle policzone menu, pominięta alergia, dublowany termin, poprawki na gorąco."
                value={errors}
                display={zl(errors)}
                min={0}
                max={3000}
                step={100}
                onChange={setErrors}
              />

              <div>
                <label className="text-sm font-semibold text-slate-600">Plan EventBoard</label>
                <div className="mt-2 inline-flex gap-1 rounded-full bg-slate-100 p-1">
                  {plans.map((p) => (
                    <button
                      key={p.monthly}
                      type="button"
                      onClick={() => setPlan(p.monthly)}
                      aria-pressed={plan === p.monthly}
                      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                        plan === p.monthly ? "bg-[#0b1220] text-white" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11.5px] text-slate-500">
                  Rozliczenie roczne (2 mies. gratis): <b>{zl(effMonthly)}/mies.</b>
                </p>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
            <div
              className={`rounded-xl border p-5 ${
                net >= 0 ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-[#fdf8ec]"
              }`}
            >
              <p className={`text-xs font-bold uppercase tracking-wider ${net >= 0 ? "text-emerald-700" : "text-[#8a6a22]"}`}>
                Zysk netto miesięcznie
              </p>
              <p className="mt-1 text-4xl font-bold tracking-[-0.02em] text-slate-900 sm:text-5xl">
                {net >= 0 ? `+${zl(net)}` : zl(net)}
              </p>
              <p className="mt-1.5 text-sm text-slate-600">
                {net >= 0 ? (
                  <>
                    To <b>{roi}%</b> zwrotu z kosztu systemu — zwraca się po ~<b>{days}</b> dniach.
                  </>
                ) : (
                  <>Przy tej skali oszczędności nie pokrywają jeszcze kosztu — zwykle wystarczy kilka eventów więcej.</>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Stat icon={<Clock className="h-4 w-4" />} k="Oszczędność czasu" v={zl(timeSave)} />
              <Stat icon={<AlertTriangle className="h-4 w-4" />} k="Uniknięte pomyłki" v={zl(errors)} />
              <Stat icon={<TrendingUp className="h-4 w-4" />} k="Łączna wartość / mies." v={zl(totalSave)} />
              <Stat icon={<Wallet className="h-4 w-4" />} k="Koszt planu / mies." v={zl(plan)} muted />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Koszt systemu na tle oszczędności</span>
                <span className="text-slate-500">{totalHours} h odzyskane / mies.</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[#b45309] transition-all" style={{ width: `${ratio}%` }} />
              </div>
            </div>
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-slate-500">
          Kalkulator służy do oszacowania i opiera się na danych, które podajesz. Rzeczywiste
          oszczędności zależą od skali i sposobu pracy obiektu.
        </p>
      </div>
    </section>
  );
}

function Stat({ icon, k, v, muted }: { icon: React.ReactNode; k: string; v: string; muted?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center gap-1.5 text-slate-500">
        {icon}
        <span className="text-[11.5px] font-semibold">{k}</span>
      </div>
      <p className={`mt-1 text-xl font-extrabold tabular-nums ${muted ? "text-slate-600" : "text-slate-900"}`}>{v}</p>
    </div>
  );
}
