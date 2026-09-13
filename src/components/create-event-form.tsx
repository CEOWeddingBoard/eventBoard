"use client";

import { useState } from "react";
import { createEvent } from "@/lib/actions/event.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Heart, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

const EVENT_TYPE_OPTIONS = [
  { value: "WEDDING", label: "Wesele", icon: "💒" },
  { value: "COMMUNION", label: "Komunia", icon: "🕊️" },
  { value: "CHRISTMAS_EVE", label: "Wigilia", icon: "🎄" },
  { value: "CORPORATE", label: "Firmowa", icon: "🏢" },
  { value: "OTHER", label: "Inne", icon: "🎉" },
] as const;

interface CreateEventFormProps {
  redirectTo?: string;
}

export function CreateEventForm({ redirectTo }: CreateEventFormProps) {
  const t = useTranslations("Events");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [eventType, setEventType] = useState<string>("WEDDING");
  const [guestListMode, setGuestListMode] = useState<string>("FULL");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get("name") as string)?.trim();
    const date = formData.get("date") as string;
    const brideName = (formData.get("brideName") as string)?.trim();
    const groomName = (formData.get("groomName") as string)?.trim();
    const partnerEmail = (formData.get("partnerEmail") as string)?.trim();
    const rawGuests = formData.get("estimatedGuestCount") as string;
    const rawBudget = formData.get("targetBudget") as string;
    const budgetCurrency = (formData.get("budgetCurrency") as string) || "PLN";
    const ceremonyLocationName = (formData.get("ceremonyLocationName") as string)?.trim();
    const ceremonyLocationUrl = (formData.get("ceremonyLocationUrl") as string)?.trim();
    const receptionLocationName = (formData.get("receptionLocationName") as string)?.trim();
    const receptionLocationUrl = (formData.get("receptionLocationUrl") as string)?.trim();
    const organizerName = (formData.get("organizerName") as string)?.trim();
    const responsiblePerson = (formData.get("responsiblePerson") as string)?.trim();
    const occasionLabel = (formData.get("occasionLabel") as string)?.trim();
    const scenarioNotes = (formData.get("scenarioNotes") as string)?.trim();
    const endTime = (formData.get("eventEndTime") as string)?.trim();

    let eventEndTime: string | undefined;
    if (date && endTime) {
      const dt = new Date(`${date}T${endTime}:00`);
      if (!isNaN(dt.getTime())) eventEndTime = dt.toISOString();
    }

    if (!name || !date) {
      toast.error(t("form.fillRequiredFields"));
      return;
    }

    const payload: {
      name: string;
      date: string;
      eventType: string;
      guestListMode: string;
      brideName?: string;
      groomName?: string;
      partnerEmail?: string;
      estimatedGuestCount?: number;
      targetBudget?: number;
      budgetCurrency?: string;
      ceremonyLocationName?: string;
      ceremonyLocationUrl?: string;
      receptionLocationName?: string;
      receptionLocationUrl?: string;
      organizerName?: string;
      responsiblePerson?: string;
      eventEndTime?: string;
      occasionLabel?: string;
      scenarioNotes?: string;
    } = { name, date, eventType, guestListMode };

    if (brideName) payload.brideName = brideName;
    if (groomName) payload.groomName = groomName;
    if (partnerEmail) payload.partnerEmail = partnerEmail;
    const guestNum = rawGuests ? parseInt(rawGuests, 10) : NaN;
    if (!isNaN(guestNum) && guestNum > 0) payload.estimatedGuestCount = guestNum;
    const budgetNum = rawBudget ? parseFloat(rawBudget.replace(/\s/g, "").replace(",", ".")) : NaN;
    if (!isNaN(budgetNum) && budgetNum > 0) payload.targetBudget = budgetNum;
    if (budgetCurrency) payload.budgetCurrency = budgetCurrency as string;
    if (ceremonyLocationName) payload.ceremonyLocationName = ceremonyLocationName;
    if (ceremonyLocationUrl) payload.ceremonyLocationUrl = ceremonyLocationUrl;
    if (receptionLocationName) payload.receptionLocationName = receptionLocationName;
    if (receptionLocationUrl) payload.receptionLocationUrl = receptionLocationUrl;
    if (organizerName) payload.organizerName = organizerName;
    if (responsiblePerson) payload.responsiblePerson = responsiblePerson;
    if (eventEndTime) payload.eventEndTime = eventEndTime;
    if (occasionLabel) payload.occasionLabel = occasionLabel;
    if (scenarioNotes) payload.scenarioNotes = scenarioNotes;

    setLoading(true);
    try {
      await createEvent(payload);
      toast.success(t("form.weddingCreated"));
      if (redirectTo) {
        window.location.href = redirectTo;
        return;
      }
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("form.creationError");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="elegant-card max-w-2xl mx-auto relative overflow-hidden">
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <Loader2 className="h-6 w-6 animate-spin text-olive mb-3" />
          <p className="text-sm text-ink font-medium">Tworzę Twoje wesele…</p>
          <p className="mt-1 text-xs text-ink-muted px-8 text-center">
            Konfiguruję bazę i przygotowuję panel. To może potrwać kilkanaście sekund przy pierwszym uruchomieniu.
          </p>
        </div>
      )}
      <CardHeader className="text-center pb-6 border-b border-olive/25">
        <div className="mx-auto w-14 h-14 rounded-full bg-olive-muted flex items-center justify-center mb-4">
          <Heart className="h-7 w-7 text-olive" strokeWidth={1.5} />
        </div>
        <CardTitle className="font-serif text-4xl font-medium text-ink">{t("form.newWedding")}</CardTitle>
        <p className="text-ink-muted mt-2 font-light tracking-wide text-lg">{t("form.brideAndGroomInfo")}</p>
      </CardHeader>
      <CardContent className="pt-6">
        <form
          onSubmit={handleSubmit}
          className={`space-y-6 transition-opacity ${loading ? "opacity-60 pointer-events-none" : ""}`}
        >
          {eventType === "WEDDING" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-medium text-ink mb-2">{t("form.brideName")}</label>
                <Input name="brideName" placeholder={t("form.bridePlaceholder")} className="elegant-input" />
              </div>
              <div>
                <label className="block text-base font-medium text-ink mb-2">{t("form.groomName")}</label>
                <Input name="groomName" placeholder={t("form.groomPlaceholder")} className="elegant-input" />
              </div>
            </div>
          )}
          {eventType === "CORPORATE" && (
            <div>
              <label className="block text-base font-medium text-ink mb-2">Nazwa firmy</label>
              <Input name="organizerName" placeholder="Nazwa firmy" className="elegant-input" />
            </div>
          )}
          <div>
            <label className="block text-base font-medium text-ink mb-2">{t("form.partnerEmail")}</label>
            <Input
              name="partnerEmail"
              type="email"
              placeholder={t("form.partnerEmailPlaceholder")}
              className="elegant-input"
            />
            <p className="text-xs text-ink-muted mt-1.5">{t("form.partnerEmailHint")}</p>
          </div>
          <div>
            <label className="block text-base font-medium text-ink mb-2">{t("form.eventName")}</label>
            <Input name="name" placeholder={t("form.eventPlaceholder")} required className="elegant-input" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium text-ink mb-2">{t("form.eventType") || "Typ eventu"}</label>
              <div className="grid grid-cols-5 gap-2">
                {EVENT_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEventType(opt.value)}
                    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border-2 text-xs transition-all ${
                      eventType === opt.value
                        ? "border-olive bg-olive-muted/40 text-olive font-semibold"
                        : "border-olive/20 text-ink-muted hover:border-olive/50"
                    }`}
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <span className="leading-tight text-center">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-base font-medium text-ink mb-2">Lista gości</label>
              <select
                value={guestListMode}
                onChange={(e) => setGuestListMode(e.target.value)}
                className="elegant-input h-11 w-full"
              >
                <option value="FULL">Pełna lista gości</option>
                <option value="ALLERGENS_ONLY">Tylko alergeny</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-base font-medium text-ink mb-2">{t("form.weddingDate")}</label>
            <Input name="date" type="date" required className="elegant-input" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium text-ink mb-2">{t("form.ceremonyLocationName")}</label>
              <Input name="ceremonyLocationName" placeholder={t("form.ceremonyLocationNamePlaceholder")} className="elegant-input" />
            </div>
            <div>
              <label className="block text-base font-medium text-ink mb-2">{t("form.ceremonyLocationUrl")}</label>
              <Input name="ceremonyLocationUrl" placeholder="https://maps.google.com/..." className="elegant-input" />
            </div>
            <div>
              <label className="block text-base font-medium text-ink mb-2">{t("form.receptionLocationName")}</label>
              <Input name="receptionLocationName" placeholder={t("form.receptionLocationNamePlaceholder")} className="elegant-input" />
            </div>
            <div>
              <label className="block text-base font-medium text-ink mb-2">{t("form.receptionLocationUrl")}</label>
              <Input name="receptionLocationUrl" placeholder="https://maps.google.com/..." className="elegant-input" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="md:col-span-1">
              <label className="block text-base font-medium text-ink mb-2">{t("form.estimatedGuests")}</label>
              <Input name="estimatedGuestCount" type="number" min={1} max={10000} placeholder={t("form.guestsPlaceholder")} className="elegant-input" />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 items-end">
              <div>
                <label className="block text-base font-medium text-ink mb-2">{t("form.targetBudget")}</label>
                <Input name="targetBudget" type="number" min={0} step={1000} placeholder={t("form.budgetPlaceholder")} className="elegant-input" />
              </div>
              <div className="md:pb-[2px]">
                <label className="block text-base font-medium text-ink mb-2 md:mb-2.5">{t("form.budgetCurrency")}</label>
                <select
                  name="budgetCurrency"
                  defaultValue="PLN"
                  className="elegant-input h-11"
                >
                  <option value="PLN">PLN</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
          </div>
          <div className="border-t border-olive/20 pt-6 space-y-4">
            <h3 className="font-serif text-xl font-medium text-ink">Dane do agendy</h3>
            <p className="text-sm text-ink-muted">
              Te informacje trafiają do agendy imprezy (Organizator, Odpowiedzialny, Okoliczność, Scenariusz).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-medium text-ink mb-2">Organizator</label>
                <Input name="organizerName" placeholder="Np. Astra Zeneca, Studniówka LO 2ka" className="elegant-input" />
              </div>
              <div>
                <label className="block text-base font-medium text-ink mb-2">Odpowiedzialny</label>
                <Input name="responsiblePerson" placeholder="Imię i nazwisko" className="elegant-input" />
              </div>
              <div>
                <label className="block text-base font-medium text-ink mb-2">Okoliczność</label>
                <Input name="occasionLabel" placeholder="Np. bal, studniówka, spotkanie firmowe" className="elegant-input" />
              </div>
              <div>
                <label className="block text-base font-medium text-ink mb-2">Zakończenie imprezy</label>
                <Input name="eventEndTime" type="time" className="elegant-input" />
              </div>
            </div>
            <div>
              <label className="block text-base font-medium text-ink mb-2">Scenariusz (sprzęt, logistyka)</label>
              <textarea
                name="scenarioNotes"
                rows={4}
                placeholder={"Np. DJ własny, światło własne, projektor, panele LED x6, płatność na miejscu — zabrać terminal"}
                className="elegant-input w-full resize-y"
              />
            </div>
          </div>
          <Button type="submit" className="w-full btn-gold" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("form.saving")}
              </>
            ) : (
              t("form.createWedding")
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
