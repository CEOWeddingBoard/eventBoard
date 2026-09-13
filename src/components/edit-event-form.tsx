"use client";

import { useState } from "react";
import { updateEvent } from "@/lib/actions/event.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Heart, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface EditEventFormProps {
  event: {
    id: string;
    name: string;
    date: Date;
    brideName?: string;
    groomName?: string;
    estimatedGuestCount?: number;
    targetBudget?: number;
    budgetCurrency?: string | null;
    ceremonyLocationName?: string | null;
    ceremonyLocationUrl?: string | null;
    receptionLocationName?: string | null;
    receptionLocationUrl?: string | null;
    organizerName?: string | null;
    responsiblePerson?: string | null;
    eventEndTime?: Date | string | null;
    occasionLabel?: string | null;
    scenarioNotes?: string | null;
  };
  onClose: () => void;
}

export function EditEventForm({ event, onClose }: EditEventFormProps) {
  const t = useTranslations("Events");
  const tc = useTranslations("common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get("name") as string)?.trim();
    const date = formData.get("date") as string;
    const brideName = (formData.get("brideName") as string)?.trim();
    const groomName = (formData.get("groomName") as string)?.trim();
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
      toast.error(t("editForm.fillRequiredFields"));
      return;
    }

    const payload: {
      name?: string;
      date?: string;
      brideName?: string;
      groomName?: string;
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
    } = {};

    if (name !== event.name) payload.name = name;
    if (date !== event.date.toISOString().split('T')[0]) payload.date = date;
    if (brideName !== (event.brideName || "")) payload.brideName = brideName;
    if (groomName !== (event.groomName || "")) payload.groomName = groomName;

    const guestNum = rawGuests ? parseInt(rawGuests, 10) : NaN;
    if (!isNaN(guestNum) && guestNum !== event.estimatedGuestCount) payload.estimatedGuestCount = guestNum;

    const budgetNum = rawBudget ? parseFloat(rawBudget.replace(/\s/g, "").replace(",", ".")) : NaN;
    if (!isNaN(budgetNum) && budgetNum !== event.targetBudget) payload.targetBudget = budgetNum;
    if (budgetCurrency && budgetCurrency !== (event.budgetCurrency || "PLN")) {
      payload.budgetCurrency = budgetCurrency;
    }
    if (ceremonyLocationName !== (event.ceremonyLocationName || "")) {
      payload.ceremonyLocationName = ceremonyLocationName;
    }
    if (ceremonyLocationUrl !== (event.ceremonyLocationUrl || "")) {
      payload.ceremonyLocationUrl = ceremonyLocationUrl;
    }
    if (receptionLocationName !== (event.receptionLocationName || "")) {
      payload.receptionLocationName = receptionLocationName;
    }
    if (receptionLocationUrl !== (event.receptionLocationUrl || "")) {
      payload.receptionLocationUrl = receptionLocationUrl;
    }
    if (organizerName !== (event.organizerName || "")) {
      payload.organizerName = organizerName;
    }
    if (responsiblePerson !== (event.responsiblePerson || "")) {
      payload.responsiblePerson = responsiblePerson;
    }
    if (occasionLabel !== (event.occasionLabel || "")) {
      payload.occasionLabel = occasionLabel;
    }
    if (scenarioNotes !== (event.scenarioNotes || "")) {
      payload.scenarioNotes = scenarioNotes;
    }
    const prevEndTime = event.eventEndTime
      ? new Date(event.eventEndTime)
      : null;
    const prevEndLocal = prevEndTime && !isNaN(prevEndTime.getTime())
      ? `${String(prevEndTime.getHours()).padStart(2, "0")}:${String(prevEndTime.getMinutes()).padStart(2, "0")}`
      : "";
    if (endTime !== prevEndLocal) {
      payload.eventEndTime = eventEndTime ?? "";
    }

    // If no changes, just close
    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      await updateEvent(event.id, payload);
      toast.success(t("editForm.weddingUpdated"));
      onClose();
      router.refresh();
    } catch (error) {
      toast.error(t("editForm.updateError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center pb-6 border-b border-olive/25">
        <div className="mx-auto w-14 h-14 rounded-full bg-olive-muted flex items-center justify-center mb-4">
          <Heart className="h-7 w-7 text-olive" strokeWidth={1.5} />
        </div>
        <h2 className="font-serif text-4xl font-medium text-ink">{t("editForm.editWedding")}</h2>
        <p className="text-ink-muted mt-2 font-light tracking-wide text-lg">{t("editForm.updateBrideGroomDetails")}</p>
      </div>
      <div className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium text-ink mb-2">{t("form.brideName")}</label>
              <Input
                name="brideName"
                placeholder={t("form.bridePlaceholder")}
                defaultValue={event.brideName || ""}
                className="elegant-input"
              />
            </div>
            <div>
              <label className="block text-base font-medium text-ink mb-2">{t("form.groomName")}</label>
              <Input
                name="groomName"
                placeholder={t("form.groomPlaceholder")}
                defaultValue={event.groomName || ""}
                className="elegant-input"
              />
            </div>
          </div>
          <div>
            <label className="block text-base font-medium text-ink mb-2">{t("form.eventName")}</label>
            <Input
              name="name"
              placeholder={t("form.eventPlaceholder")}
              required
              defaultValue={event.name}
              className="elegant-input"
            />
          </div>
          <div>
            <label className="block text-base font-medium text-ink mb-2">{t("form.weddingDate")}</label>
            <Input
              name="date"
              type="date"
              required
              defaultValue={event.date.toISOString().split('T')[0]}
              className="elegant-input"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div>
              <label className="block text-base font-medium text-ink mb-2">{t("form.estimatedGuests")}</label>
              <Input
                name="estimatedGuestCount"
                type="number"
                min={1}
                max={10000}
                placeholder={t("form.guestsPlaceholder")}
                defaultValue={event.estimatedGuestCount || ""}
                className="elegant-input"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 items-end">
              <div>
                <label className="block text-base font-medium text-ink mb-2">{t("form.targetBudget")}</label>
                <Input
                  name="targetBudget"
                  type="number"
                  min={0}
                  step={1000}
                  placeholder={t("form.budgetPlaceholder")}
                  defaultValue={event.targetBudget || ""}
                  className="elegant-input"
                />
              </div>
              <div className="md:pb-[2px]">
                <label className="block text-base font-medium text-ink mb-2 md:mb-2.5">{t("form.budgetCurrency")}</label>
                <select
                  name="budgetCurrency"
                  defaultValue={event.budgetCurrency || "PLN"}
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
            <h3 className="font-serif text-xl font-medium text-ink">Lokalizacje wydarzenia</h3>
            <p className="text-sm text-ink-muted">
              Ustaw oddzielnie ceremonię i przyjęcie, aby goście oraz asystent AI podawali poprawne linki.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-medium text-ink mb-2">
                  {t("form.ceremonyLocationName")}
                </label>
                <Input
                  name="ceremonyLocationName"
                  defaultValue={event.ceremonyLocationName || ""}
                  placeholder={t("form.ceremonyLocationNamePlaceholder")}
                  className="elegant-input"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-ink mb-2">
                  {t("form.ceremonyLocationUrl")}
                </label>
                <Input
                  name="ceremonyLocationUrl"
                  defaultValue={event.ceremonyLocationUrl || ""}
                  placeholder="https://maps.google.com/..."
                  className="elegant-input"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-ink mb-2">
                  {t("form.receptionLocationName")}
                </label>
                <Input
                  name="receptionLocationName"
                  defaultValue={event.receptionLocationName || ""}
                  placeholder={t("form.receptionLocationNamePlaceholder")}
                  className="elegant-input"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-ink mb-2">
                  {t("form.receptionLocationUrl")}
                </label>
                <Input
                  name="receptionLocationUrl"
                  defaultValue={event.receptionLocationUrl || ""}
                  placeholder="https://maps.google.com/..."
                  className="elegant-input"
                />
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
                <Input
                  name="organizerName"
                  defaultValue={event.organizerName || ""}
                  placeholder="Np. Astra Zeneca, Studniówka LO 2ka"
                  className="elegant-input"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-ink mb-2">Odpowiedzialny</label>
                <Input
                  name="responsiblePerson"
                  defaultValue={event.responsiblePerson || ""}
                  placeholder="Imię i nazwisko"
                  className="elegant-input"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-ink mb-2">Okoliczność</label>
                <Input
                  name="occasionLabel"
                  defaultValue={event.occasionLabel || ""}
                  placeholder="Np. bal, studniówka, spotkanie firmowe"
                  className="elegant-input"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-ink mb-2">Zakończenie imprezy</label>
                <Input
                  name="eventEndTime"
                  type="time"
                  defaultValue={
                    event.eventEndTime && !isNaN(new Date(event.eventEndTime).getTime())
                      ? `${String(new Date(event.eventEndTime).getHours()).padStart(2, "0")}:${String(
                          new Date(event.eventEndTime).getMinutes()
                        ).padStart(2, "0")}`
                      : ""
                  }
                  className="elegant-input"
                />
              </div>
            </div>
            <div>
              <label className="block text-base font-medium text-ink mb-2">Scenariusz (sprzęt, logistyka)</label>
              <textarea
                name="scenarioNotes"
                rows={4}
                defaultValue={event.scenarioNotes || ""}
                placeholder={"Np. DJ własny, światło własne, projektor, panele LED x6, płatność na miejscu — zabrać terminal"}
                className="elegant-input w-full resize-y"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" className="flex-1 btn-gold" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tc("save")}
                </>
              ) : (
                tc("save")
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}