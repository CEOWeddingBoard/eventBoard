"use client";

import { useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Globe, ChevronDown } from "lucide-react";
import { resolvePathForLocaleSwitch } from "@/lib/locale-switch";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('LanguageSwitcher');
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const switchLocale = useCallback(
    (newLocale: string) => {
      const newPathname = resolvePathForLocaleSwitch(pathname, locale, newLocale);
      router.push(newPathname);
      setIsOpen(false);
    },
    [locale, pathname, router],
  );

  const currentLangLabel = locale === 'pl' ? 'PL' : 'EN';

  return (
    <div className="relative z-[70]">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-8 items-center gap-1.5 px-3 text-xs font-medium text-ink-muted hover:text-ink rounded-full border border-olive/20 bg-white/70 hover:bg-olive/5 shadow-sm transition-all duration-200"
        aria-label={t("changeLanguage")}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="h-4 w-4" strokeWidth={1.5} />
        <span className="hidden sm:inline leading-none">{currentLangLabel}</span>
        <ChevronDown
          className="h-3 w-3 transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-24 rounded-2xl bg-white/95 border border-olive/25 shadow-md py-1 z-[80] overflow-hidden">
          <button
            onClick={() => switchLocale('pl')}
            className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
              locale === 'pl'
                ? 'text-ink bg-olive/15'
                : 'text-ink-muted hover:bg-olive/10'
            }`}
          >
            PL
          </button>
          <button
            onClick={() => switchLocale('en')}
            className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
              locale === 'en'
                ? 'text-ink bg-olive/15'
                : 'text-ink-muted hover:bg-olive/10'
            }`}
          >
            EN
          </button>
        </div>
      )}
    </div>
  );
}