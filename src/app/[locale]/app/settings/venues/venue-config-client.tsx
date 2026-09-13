"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Building2, DoorOpen } from "lucide-react";
import { toast } from "sonner";
import {
  createVenue,
  updateVenue,
  deleteVenue,
  createVenueHall,
  updateVenueHall,
  deleteVenueHall,
} from "@/lib/actions/venue-config.actions";

type Hall = { id: string; name: string; capacity: number };
type Venue = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  capacity: number | null;
  description: string | null;
  halls: Hall[];
};

export function VenueConfigClient({ initialVenues }: { initialVenues: Venue[] }) {
  const [venues, setVenues] = useState(initialVenues);
  const [venueDialogOpen, setVenueDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [venueForm, setVenueForm] = useState({
    name: "",
    address: "",
    city: "",
    capacity: "",
    description: "",
  });
  const [busy, setBusy] = useState(false);

  const [hallDialogOpen, setHallDialogOpen] = useState(false);
  const [hallVenueId, setHallVenueId] = useState<string | null>(null);
  const [editingHall, setEditingHall] = useState<Hall | null>(null);
  const [hallForm, setHallForm] = useState({ name: "", capacity: "" });

  const handleOpenVenueDialog = (venue?: Venue) => {
    if (venue) {
      setEditingVenue(venue);
      setVenueForm({
        name: venue.name,
        address: venue.address || "",
        city: venue.city || "",
        capacity: venue.capacity?.toString() || "",
        description: venue.description || "",
      });
    } else {
      setEditingVenue(null);
      setVenueForm({ name: "", address: "", city: "", capacity: "", description: "" });
    }
    setVenueDialogOpen(true);
  };

  const handleSaveVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueForm.name.trim()) {
      toast.error("Podaj nazwę obiektu");
      return;
    }
    setBusy(true);
    try {
      const input = {
        name: venueForm.name,
        address: venueForm.address || undefined,
        city: venueForm.city || undefined,
        capacity: venueForm.capacity ? parseInt(venueForm.capacity) : undefined,
        description: venueForm.description || undefined,
      };

      if (editingVenue) {
        await updateVenue(editingVenue.id, input);
        toast.success("Obiekt zaktualizowany");
      } else {
        await createVenue(input);
        toast.success("Obiekt utworzony");
      }
      setVenueDialogOpen(false);
      window.location.reload();
    } catch {
      toast.error("Błąd zapisu");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteVenue = async (venueId: string) => {
    if (!confirm("Usunąć obiekt i wszystkie jego sale?")) return;
    setBusy(true);
    try {
      await deleteVenue(venueId);
      toast.success("Obiekt usunięty");
      setVenues((prev) => prev.filter((v) => v.id !== venueId));
    } catch {
      toast.error("Błąd usuwania");
    } finally {
      setBusy(false);
    }
  };

  const handleOpenHallDialog = (venueId: string, hall?: Hall) => {
    setHallVenueId(venueId);
    if (hall) {
      setEditingHall(hall);
      setHallForm({ name: hall.name, capacity: hall.capacity.toString() });
    } else {
      setEditingHall(null);
      setHallForm({ name: "", capacity: "" });
    }
    setHallDialogOpen(true);
  };

  const handleSaveHall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hallVenueId || !hallForm.name.trim() || !hallForm.capacity) {
      toast.error("Podaj nazwę i pojemność sali");
      return;
    }
    setBusy(true);
    try {
      const input = {
        name: hallForm.name,
        capacity: parseInt(hallForm.capacity),
      };

      if (editingHall) {
        await updateVenueHall(editingHall.id, input);
        toast.success("Sala zaktualizowana");
      } else {
        await createVenueHall(hallVenueId, input);
        toast.success("Sala dodana");
      }
      setHallDialogOpen(false);
      window.location.reload();
    } catch {
      toast.error("Błąd zapisu");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteHall = async (hallId: string) => {
    if (!confirm("Usunąć salę?")) return;
    setBusy(true);
    try {
      await deleteVenueHall(hallId);
      toast.success("Sala usunięta");
      window.location.reload();
    } catch {
      toast.error("Błąd usuwania");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-neutral-800">Obiekty i sale</h1>
          <p className="text-sm text-neutral-500">
            Zarządzaj obiektami (sale weselne, restauracje) i ich salami
          </p>
        </div>
        <Button size="sm" onClick={() => handleOpenVenueDialog()}>
          <Plus className="mr-1.5 h-4 w-4" />
          Dodaj obiekt
        </Button>
      </div>

      {venues.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-neutral-300" />
            <p className="mt-4 text-sm text-neutral-500">
              Brak obiektów. Dodaj pierwszy obiekt aby rozpocząć.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {venues.map((venue) => (
            <Card key={venue.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-neutral-400 mt-0.5" />
                    <div>
                      <CardTitle className="text-base">{venue.name}</CardTitle>
                      {(venue.address || venue.city) && (
                        <p className="text-xs text-neutral-500 mt-1">
                          {venue.address}
                          {venue.address && venue.city && ", "}
                          {venue.city}
                        </p>
                      )}
                      {venue.capacity && (
                        <p className="text-xs text-neutral-500">
                          Pojemność: {venue.capacity} osób
                        </p>
                      )}
                      {venue.description && (
                        <p className="text-xs text-neutral-600 mt-2">{venue.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenVenueDialog(venue)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteVenue(venue.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="border-t border-neutral-100 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-neutral-700">Sale</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenHallDialog(venue.id)}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Dodaj salę
                    </Button>
                  </div>
                  {venue.halls.length === 0 ? (
                    <p className="text-xs text-neutral-400">Brak sal</p>
                  ) : (
                    <div className="space-y-1">
                      {venue.halls.map((hall) => (
                        <div
                          key={hall.id}
                          className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-neutral-50"
                        >
                          <div className="flex items-center gap-2">
                            <DoorOpen className="h-3.5 w-3.5 text-neutral-400" />
                            <span className="text-sm text-neutral-700">{hall.name}</span>
                            <span className="text-xs text-neutral-500">
                              ({hall.capacity} os.)
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7"
                              onClick={() => handleOpenHallDialog(venue.id, hall)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7"
                              onClick={() => handleDeleteHall(hall.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog obiektu */}
      <Dialog open={venueDialogOpen} onOpenChange={setVenueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVenue ? "Edytuj obiekt" : "Nowy obiekt"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveVenue} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Nazwa obiektu
              </label>
              <Input
                value={venueForm.name}
                onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
                placeholder="Np. Villa Marlena"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Adres
                </label>
                <Input
                  value={venueForm.address}
                  onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })}
                  placeholder="ul. Przykładowa 10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Miasto
                </label>
                <Input
                  value={venueForm.city}
                  onChange={(e) => setVenueForm({ ...venueForm, city: e.target.value })}
                  placeholder="Warszawa"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Pojemność (osób)
              </label>
              <Input
                type="number"
                value={venueForm.capacity}
                onChange={(e) => setVenueForm({ ...venueForm, capacity: e.target.value })}
                placeholder="np. 200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Opis (opcjonalnie)
              </label>
              <Input
                value={venueForm.description}
                onChange={(e) => setVenueForm({ ...venueForm, description: e.target.value })}
                placeholder="Krótki opis obiektu"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setVenueDialogOpen(false)}>
                Anuluj
              </Button>
              <Button type="submit" disabled={busy}>
                {editingVenue ? "Zapisz" : "Utwórz"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog sali */}
      <Dialog open={hallDialogOpen} onOpenChange={setHallDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingHall ? "Edytuj salę" : "Nowa sala"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveHall} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Nazwa sali
              </label>
              <Input
                value={hallForm.name}
                onChange={(e) => setHallForm({ ...hallForm, name: e.target.value })}
                placeholder="Np. Sala Główna"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Pojemność (osób)
              </label>
              <Input
                type="number"
                value={hallForm.capacity}
                onChange={(e) => setHallForm({ ...hallForm, capacity: e.target.value })}
                placeholder="np. 120"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setHallDialogOpen(false)}>
                Anuluj
              </Button>
              <Button type="submit" disabled={busy}>
                {editingHall ? "Zapisz" : "Dodaj"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
