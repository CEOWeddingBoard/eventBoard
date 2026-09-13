"use client";

import { Calendar } from "lucide-react";
import { buildGoogleCalendarUrl, type CalendarEventInput } from "@/lib/calendar";

interface AddToGoogleCalendarButtonProps {
  event: CalendarEventInput;
  label?: string;
  className?: string;
}

export function AddToGoogleCalendarButton({
  event,
  label = "Dodaj do Google Kalendarza",
  className,
}: AddToGoogleCalendarButtonProps) {
  const url = buildGoogleCalendarUrl(event);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "inline-flex items-center gap-2 rounded-xl border border-olive/30 bg-olive-muted px-4 py-2.5 text-sm font-medium text-olive-light hover:bg-olive/20 hover:border-olive/50 transition-all duration-300"
      }
    >
      <Calendar className="h-4 w-4" />
      {label}
    </a>
  );
}
