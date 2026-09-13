"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Download, Loader2, Smartphone, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadIcsOnlySectionProps {
  locale: string;
  feedUrl?: string | null;
}

export function DownloadIcsOnlySection({ locale, feedUrl }: DownloadIcsOnlySectionProps) {
  const t = useTranslations("GoogleCalendar");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyFeedUrl = () => {
    if (!feedUrl) return;
    void navigator.clipboard.writeText(feedUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/${locale}/api/calendar/export`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) throw new Error("Brak wydarzenia");
        throw new Error("Błąd pobierania");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^";]+)"?/);
      const filename = match?.[1] ?? "wesele.ics";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Nie udało się pobrać pliku.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-olive/20 bg-wedding-card p-6 shadow-wedding">
        <p className="text-ink-muted mb-4">
          {t("icsOnly.description")}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={handleDownload}
            disabled={loading}
            className="inline-flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {t("icsOnly.downloadButton")}
          </Button>
        </div>
      </section>

      {feedUrl && (
        <section className="rounded-2xl border border-olive/20 bg-wedding-card p-6 shadow-wedding">
          <h2 className="font-serif text-base font-medium text-ink mb-2 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-olive" />
            {t("icsOnly.feedSubscribeTitle")}
          </h2>
          <p className="text-ink-muted text-sm mb-3">
            {t("icsOnly.feedSubscribeDescription")}
          </p>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <code className="flex-1 min-w-0 text-xs bg-olive-muted/30 text-ink rounded px-2 py-1.5 break-all">
              {feedUrl}
            </code>
            <Button type="button" variant="outline" size="sm" onClick={copyFeedUrl} className="shrink-0 gap-1">
              {copied ? <Check className="h-4 w-4" /> : null}
              {copied ? t("icsOnly.feedCopied") : t("icsOnly.feedCopyLink")}
            </Button>
          </div>
          <ul className="text-sm text-ink-muted space-y-1">
            <li>{t("icsOnly.feedInstructionGoogle")}</li>
            <li>{t("icsOnly.feedInstructionApple")}</li>
            <li>{t("icsOnly.feedInstructionOutlook")}</li>
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-olive/15 bg-olive-muted/20 p-6">
        <h2 className="font-serif text-base font-medium text-ink mb-2 flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-olive" />
          {t("icsOnly.importTitle")}
        </h2>
        <p className="text-sm text-ink-muted mb-2">
          {t("icsOnly.importAndroid")}
        </p>
        <p className="text-sm text-ink-muted">
          {t("icsOnly.importIos")}
        </p>
      </section>
    </div>
  );
}
