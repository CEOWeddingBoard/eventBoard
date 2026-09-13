import {
  CalendarCheck,
  Globe,
  Mail,
  Newspaper,
  Palette,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const weddingFeatures: { icon: LucideIcon; label: string }[] = [
  { icon: Palette, label: "Moodboard" },
  { icon: Mail, label: "Zaproszenia PDF" },
  { icon: Globe, label: "Strona weselna" },
  { icon: CalendarCheck, label: "Portal gości + RSVP" },
  { icon: Sparkles, label: "AI Planer ślubny" },
  { icon: Newspaper, label: "Magazyn" },
];

export function LandingWeddingBoard() {
  return (
    <section className="bg-[#faf9f7] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50/80 via-[#fdfbf7] to-rose-50/50 p-8 sm:p-12 lg:p-16">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" aria-hidden />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-rose-200/30 blur-3xl" aria-hidden />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-50 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-800 backdrop-blur">
              <Sparkles className="h-3 w-3 text-[#7a5f28]" />
              Moduł premium
            </span>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl lg:text-4xl">
              Wedding Board — rozszerzenie dla wesel
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-700 sm:text-base">
              Dla typu Wesele automatycznie aktywuje się dodatkowy moduł dla pary młodej:
              moodboard, zaproszenia PDF, strona weselna, portal gości z RSVP, AI planer ślubny i magazyn inspiracji.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {weddingFeatures.map((f) => (
                <span
                  key={f.label}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#b49b3d] hover:bg-amber-50/70 hover:text-[#7a5f28] hover:shadow-md"
                >
                  <f.icon className="h-4 w-4 text-[#7a5f28]" />
                  {f.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
