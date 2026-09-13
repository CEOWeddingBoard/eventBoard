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
import { Plus, Trash2, Edit2, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  createEventType,
  updateEventType,
  deleteEventType,
} from "@/lib/actions/event-type.actions";

type CustomField = {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  options?: string[];
  required?: boolean;
};

type EventType = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  customFields: CustomField[];
  agendaTemplateId: string | null;
  agendaTemplateName: string | null;
  isSystem: boolean;
};

type Template = { id: string; name: string };

export function EventTypesConfigClient({
  initialEventTypes,
  templates,
}: {
  initialEventTypes: EventType[];
  templates: Template[];
}) {
  const [eventTypes, setEventTypes] = useState(initialEventTypes);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<EventType | null>(null);
  const [form, setForm] = useState({
    name: "",
    icon: "",
    color: "#3b82f6",
    agendaTemplateId: "",
  });
  const [fields, setFields] = useState<CustomField[]>([]);
  const [busy, setBusy] = useState(false);

  const handleOpenDialog = (eventType?: EventType) => {
    if (eventType) {
      setEditingType(eventType);
      setForm({
        name: eventType.name,
        icon: eventType.icon || "",
        color: eventType.color || "#3b82f6",
        agendaTemplateId: eventType.agendaTemplateId || "",
      });
      setFields(eventType.customFields);
    } else {
      setEditingType(null);
      setForm({ name: "", icon: "", color: "#3b82f6", agendaTemplateId: "" });
      setFields([]);
    }
    setDialogOpen(true);
  };

  const handleAddField = () => {
    setFields([
      ...fields,
      { key: `field_${Date.now()}`, label: "", type: "text", required: false },
    ]);
  };

  const handleUpdateField = (index: number, updates: Partial<CustomField>) => {
    setFields(fields.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Podaj nazwę typu eventu");
      return;
    }

    const validFields = fields.filter((f) => f.label.trim());
    if (validFields.length !== fields.length) {
      toast.error("Wszystkie pola muszą mieć nazwę");
      return;
    }

    setBusy(true);
    try {
      const input = {
        name: form.name,
        icon: form.icon || undefined,
        color: form.color || undefined,
        customFields: validFields,
        agendaTemplateId: form.agendaTemplateId || undefined,
      };

      if (editingType) {
        await updateEventType(editingType.id, input);
        toast.success("Typ eventu zaktualizowany");
      } else {
        await createEventType(input);
        toast.success("Typ eventu utworzony");
      }
      setDialogOpen(false);
      window.location.reload();
    } catch {
      toast.error("Błąd zapisu");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Usunąć typ eventu?")) return;
    setBusy(true);
    try {
      await deleteEventType(id);
      toast.success("Typ eventu usunięty");
      setEventTypes((prev) => prev.filter((t) => t.id !== id));
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
          <h1 className="text-lg font-bold text-neutral-800">Typy eventów</h1>
          <p className="text-sm text-neutral-500">
            Konfiguruj rodzaje eventów z własnymi polami i szablonami agendy
          </p>
        </div>
        <Button size="sm" onClick={() => handleOpenDialog()}>
          <Plus className="mr-1.5 h-4 w-4" />
          Dodaj typ
        </Button>
      </div>

      {eventTypes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-neutral-300" />
            <p className="mt-4 text-sm text-neutral-500">
              Brak typów eventów. Dodaj pierwszy typ aby rozpocząć.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eventTypes.map((eventType) => (
            <Card key={eventType.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: eventType.color || "#3b82f6" }}
                    >
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{eventType.name}</CardTitle>
                      {eventType.isSystem && (
                        <span className="text-xs text-neutral-500">Systemowy</span>
                      )}
                    </div>
                  </div>
                  {!eventType.isSystem && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDialog(eventType)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(eventType.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {eventType.customFields.length > 0 && (
                  <div className="border-t border-neutral-100 pt-3">
                    <p className="text-xs font-medium text-neutral-500 mb-2">
                      Pola ({eventType.customFields.length})
                    </p>
                    <div className="space-y-1">
                      {eventType.customFields.slice(0, 3).map((field) => (
                        <div
                          key={field.key}
                          className="text-xs text-neutral-600 flex items-center gap-2"
                        >
                          <span className="font-medium">{field.label}</span>
                          <span className="text-neutral-400">({field.type})</span>
                        </div>
                      ))}
                      {eventType.customFields.length > 3 && (
                        <p className="text-xs text-neutral-400">
                          +{eventType.customFields.length - 3} więcej
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {eventType.agendaTemplateId && (
                  <div className="border-t border-neutral-100 pt-3 mt-3">
                    <div className="flex items-center gap-2 text-xs text-neutral-600">
                      <FileText className="h-3.5 w-3.5" />
                      <span>Szablon agendy przypisany</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingType ? "Edytuj typ eventu" : "Nowy typ eventu"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Nazwa typu
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Np. Studniówka"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Kolor
                </label>
                <Input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Szablon agendy (opcjonalnie)
              </label>
              <select
                className="w-full h-9 rounded-md border border-neutral-200 px-3 text-sm"
                value={form.agendaTemplateId}
                onChange={(e) => setForm({ ...form, agendaTemplateId: e.target.value })}
              >
                <option value="">— brak —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-neutral-500 mt-1">
                Szablon zostanie automatycznie zastosowany przy tworzeniu eventu tego typu
              </p>
            </div>

            <div className="border-t border-neutral-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-neutral-700">
                  Pola dodatkowe
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddField}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Dodaj pole
                </Button>
              </div>

              {fields.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-4">
                  Brak pól. Dodaj pola które będą widoczne przy tworzeniu eventu.
                </p>
              ) : (
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div
                      key={field.key}
                      className="flex gap-2 items-start p-3 border border-neutral-200 rounded-lg"
                    >
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Nazwa pola (np. Motyw przewodni)"
                          value={field.label}
                          onChange={(e) =>
                            handleUpdateField(index, { label: e.target.value })
                          }
                        />
                        <div className="flex gap-2">
                          <select
                            className="flex-1 h-8 rounded-md border border-neutral-200 px-2 text-xs"
                            value={field.type}
                            onChange={(e) =>
                              handleUpdateField(index, {
                                type: e.target.value as CustomField["type"],
                              })
                            }
                          >
                            <option value="text">Tekst</option>
                            <option value="number">Liczba</option>
                            <option value="date">Data</option>
                            <option value="select">Lista wyboru</option>
                          </select>
                          <label className="flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) =>
                                handleUpdateField(index, { required: e.target.checked })
                              }
                            />
                            Wymagane
                          </label>
                        </div>
                        {field.type === "select" && (
                          <Input
                            placeholder="Opcje (oddzielone przecinkiem)"
                            value={field.options?.join(", ") || ""}
                            onChange={(e) =>
                              handleUpdateField(index, {
                                options: e.target.value.split(",").map((s) => s.trim()),
                              })
                            }
                          />
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveField(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Anuluj
              </Button>
              <Button type="submit" disabled={busy}>
                {editingType ? "Zapisz" : "Utwórz"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
