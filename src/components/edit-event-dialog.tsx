"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditEventForm } from "@/components/edit-event-form";
import { Button } from "@/components/ui/button";
import { Edit3 } from "lucide-react";
import { useTranslations } from "next-intl";

interface EditEventDialogProps {
  event: {
    id: string;
    name: string;
    date: Date;
    brideName?: string;
    groomName?: string;
    estimatedGuestCount?: number;
    targetBudget?: number;
    budgetCurrency?: string | null;
    publicSlug?: string | null;
    description?: string | null;
    dressCode?: string | null;
    mapLocationUrl?: string | null;
    ceremonyLocationName?: string | null;
    ceremonyLocationUrl?: string | null;
    receptionLocationName?: string | null;
    receptionLocationUrl?: string | null;
    guestPortalEnabled?: boolean | null;
    organizerName?: string | null;
    responsiblePerson?: string | null;
    eventEndTime?: Date | string | null;
    occasionLabel?: string | null;
    scenarioNotes?: string | null;
  };
  trigger?: React.ReactNode;
}

export function EditEventDialog({ event, trigger }: EditEventDialogProps) {
  const t = useTranslations("Events");
  const [open, setOpen] = useState(false);

  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <Edit3 className="h-4 w-4" />
      {t("editForm.editYourWedding")}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{t("editForm.editWedding")}</DialogTitle>
        </DialogHeader>
        <EditEventForm event={event} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}