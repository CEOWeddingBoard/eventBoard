import { getEvents } from "@/lib/actions/event.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateEventForm } from "./create-event-form";
import Link from "next/link";

export async function EventList() {
  const events = await getEvents();
  const locale = "pl"; // Temporary fixed locale

  return (
    <div className="space-y-6">
      <CreateEventForm />

      <Card>
        <CardHeader>
          <CardTitle>Twoje Wydarzenia</CardTitle>
        </CardHeader>
        <CardContent>
          {events && events.length === 0 && <p>Nie masz jeszcze żadnych wydarzeń.</p>}
          {events && events.length > 0 && (
            <ul className="space-y-2">
              {events.map((event: { id: string; name: string; date: Date | string | null }) => (
                <li key={event.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <Link href={`/${locale}/event/${event.id}`} className="block">
                    <p className="font-medium text-ink">{event.name}</p>
                    <p className="text-sm text-gray-500">
                      {event.date ? new Date(event.date).toLocaleDateString() : "Brak daty"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
