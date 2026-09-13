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
import { Plus, Trash2, Edit2, FileText, GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  createAgendaTemplate,
  updateAgendaTemplate,
  deleteAgendaTemplate,
} from "@/lib/actions/agenda-template.actions";

type AgendaField = {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  llmPrompt?: string;
};

type AgendaSection = {
  id: string;
  title: string;
  description?: string;
  fields: AgendaField[];
};

type AgendaTemplate = {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  sections: AgendaSection[];
  isDefault: boolean;
};

type EventType = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  customFields: Array<{ key: string; label: string; type: string; required?: boolean }>;
  agendaTemplateId: string | null;
  agendaTemplateName: string | null;
  isSystem: boolean;
};

export function AgendaTemplatesConfigClient({
  initialTemplates,
  eventTypes,
}: {
  initialTemplates: AgendaTemplate[];
  eventTypes: EventType[];
}) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AgendaTemplate | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    categoryId: "",
  });
  const [sections, setSections] = useState<AgendaSection[]>([]);
  const [busy, setBusy] = useState(false);
  const [draggedField, setDraggedField] = useState<{ sectionId: string; fieldIndex: number } | null>(null);
  const [draggedPaletteField, setDraggedPaletteField] = useState<EventType["customFields"][number] | null>(null);

  const handleOpenDialog = (template?: AgendaTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setForm({
        name: template.name,
        description: template.description || "",
        categoryId: template.categoryId || "",
      });
      setSections(template.sections);
    } else {
      setEditingTemplate(null);
      setForm({ name: "", description: "", categoryId: "" });
      setSections([]);
    }
    setDialogOpen(true);
  };

  const handleAddSection = () => {
    setSections([
      ...sections,
      {
        id: `section_${Date.now()}`,
        title: "",
        description: "",
        fields: [],
      },
    ]);
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<AgendaSection>) => {
    setSections(sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)));
  };

  const handleRemoveSection = (sectionId: string) => {
    setSections(sections.filter((s) => s.id !== sectionId));
  };

  const handleAddField = (sectionId: string) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: [
                ...s.fields,
                {
                  key: `field_${Date.now()}`,
                  label: "",
                  type: "text",
                  required: false,
                },
              ],
            }
          : s
      )
    );
  };

  const handlePaletteDragStart = (field: EventType["customFields"][number]) => {
    setDraggedPaletteField(field);
    setDraggedField(null);
  };

  const handlePaletteDrop = (sectionId: string) => {
    if (!draggedPaletteField) return;
    setSections((current) => current.map((section) => section.id === sectionId
      ? { ...section, fields: [...section.fields, { key: `${draggedPaletteField.key}_${Date.now()}`, label: draggedPaletteField.label, type: draggedPaletteField.type, required: draggedPaletteField.required }] }
      : section));
    setDraggedPaletteField(null);
  };

  const handleUpdateField = (sectionId: string, fieldIndex: number, updates: Partial<AgendaField>) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map((f, i) => (i === fieldIndex ? { ...f, ...updates } : f)),
            }
          : s
      )
    );
  };

  const handleRemoveField = (sectionId: string, fieldIndex: number) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? { ...s, fields: s.fields.filter((_, i) => i !== fieldIndex) }
          : s
      )
    );
  };

  const handleDragStart = (sectionId: string, fieldIndex: number) => {
    setDraggedField({ sectionId, fieldIndex });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (sectionId: string, targetIndex: number) => {
    if (!draggedField) return;

    const sourceSection = sections.find((s) => s.id === draggedField.sectionId);
    const targetSection = sections.find((s) => s.id === sectionId);
    if (!sourceSection || !targetSection) return;

    const draggedFieldData = sourceSection.fields[draggedField.fieldIndex];

    if (draggedField.sectionId === sectionId) {
      const newFields = [...targetSection.fields];
      newFields.splice(draggedField.fieldIndex, 1);
      newFields.splice(targetIndex, 0, draggedFieldData);
      handleUpdateSection(sectionId, { fields: newFields });
    } else {
      handleRemoveField(draggedField.sectionId, draggedField.fieldIndex);
      const newFields = [...targetSection.fields];
      newFields.splice(targetIndex, 0, draggedFieldData);
      handleUpdateSection(sectionId, { fields: newFields });
    }

    setDraggedField(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Podaj nazwę szablonu");
      return;
    }

    const validSections = sections.filter((s) => s.title.trim());
    if (validSections.length === 0) {
      toast.error("Dodaj przynajmniej jedną sekcję");
      return;
    }

    setBusy(true);
    try {
      const input = {
        name: form.name,
        description: form.description || undefined,
        categoryId: form.categoryId || undefined,
        sections: validSections,
      };

      if (editingTemplate) {
        await updateAgendaTemplate(editingTemplate.id, input);
        toast.success("Szablon zaktualizowany");
      } else {
        await createAgendaTemplate(input);
        toast.success("Szablon utworzony");
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
    if (!confirm("Usunąć szablon agendy?")) return;
    setBusy(true);
    try {
      await deleteAgendaTemplate(id);
      toast.success("Szablon usunięty");
      setTemplates((prev) => prev.filter((t) => t.id !== id));
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
          <h1 className="text-lg font-bold text-neutral-800">Szablony agendy</h1>
          <p className="text-sm text-neutral-500">
            Twórz wizualne szablony agendy z polami do wypełnienia przez LLM
          </p>
        </div>
        <Button size="sm" onClick={() => handleOpenDialog()}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nowy szablon
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-neutral-300" />
            <p className="mt-4 text-sm text-neutral-500">
              Brak szablonów agendy. Utwórz pierwszy szablon aby rozpocząć.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      {template.description && (
                        <p className="text-xs text-neutral-500 mt-1">{template.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenDialog(template)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="border-t border-neutral-100 pt-3">
                  <p className="text-xs font-medium text-neutral-500 mb-2">
                    Sekcje ({template.sections.length})
                  </p>
                  <div className="space-y-1">
                    {template.sections.slice(0, 3).map((section) => (
                      <div
                        key={section.id}
                        className="text-xs text-neutral-600 flex items-center justify-between"
                      >
                        <span className="font-medium">{section.title}</span>
                        <span className="text-neutral-400">
                          {section.fields.length} pól
                        </span>
                      </div>
                    ))}
                    {template.sections.length > 3 && (
                      <p className="text-xs text-neutral-400">
                        +{template.sections.length - 3} więcej
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="fixed right-0 top-0 left-auto h-screen w-[min(1180px,100vw)] max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none border-l border-neutral-200 p-6">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edytuj szablon agendy" : "Nowy szablon agendy"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Nazwa szablonu
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Np. Standardowa agenda weselna"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Typ eventu (opcjonalnie)
                </label>
                <select
                  className="w-full h-9 rounded-md border border-neutral-200 px-3 text-sm"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                >
                  <option value="">— wszystkie typy —</option>
                  {eventTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Opis (opcjonalnie)
              </label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Krótki opis szablonu"
              />
            </div>

            <div className="rounded-lg border border-neutral-200 bg-neutral-100 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-800">Podgląd dokumentu A4</p>
                  <p className="text-xs text-neutral-500">Upuść pole w wybranej sekcji na kartce.</p>
                </div>
                <span className="rounded bg-white px-2 py-1 text-[10px] text-neutral-500">A4 · pionowo</span>
              </div>
              <div className="mx-auto min-h-[620px] w-full max-w-[520px] bg-white p-8 shadow-md ring-1 ring-neutral-200">
                <div className="mb-6 border-b-2 border-neutral-800 pb-3 text-center">
                  <p className="text-xl font-bold text-neutral-800">{form.name || "Nazwa agendy"}</p>
                  <p className="mt-1 text-xs text-neutral-500">{form.description || "Opis dokumentu"}</p>
                </div>
                {sections.length === 0 ? (
                  <div className="flex min-h-[400px] items-center justify-center border-2 border-dashed border-neutral-200 text-center text-xs text-neutral-400">
                    Dodaj sekcję, a następnie przeciągnij tutaj pola
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sections.map((section) => (
                      <div
                        key={`preview-${section.id}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handlePaletteDrop(section.id)}
                        className="min-h-[72px] rounded border border-dashed border-neutral-300 p-3 transition hover:border-blue-400 hover:bg-blue-50/40"
                      >
                        <p className="text-sm font-semibold text-neutral-800">{section.title || "Nowa sekcja"}</p>
                        {section.fields.length === 0 ? (
                          <p className="mt-2 text-[11px] text-neutral-400">Upuść pole tutaj</p>
                        ) : (
                          <div className="mt-2 space-y-1">
                            {section.fields.map((field) => (
                              <div key={`preview-${field.key}`} className="rounded bg-neutral-50 px-2 py-1 text-xs text-neutral-600">
                                <span className="font-medium">{field.label}</span>
                                <span className="ml-2 text-[10px] text-blue-500">{field.key}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-neutral-700">
                  Sekcje agendy
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddSection}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Dodaj sekcję
                </Button>
              </div>

              <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs font-semibold text-blue-900">Pola do przeciągnięcia</p>
                <p className="mt-1 text-[11px] text-blue-800">Wybierz typ eventu, a następnie przeciągnij pole do wybranej sekcji.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[{ key: "event.name", label: "Nazwa eventu", type: "text" }, { key: "event.date", label: "Data eventu", type: "date" }, { key: "event.guests", label: "Liczba gości", type: "number" }, ...(eventTypes.find((t) => t.id === form.categoryId)?.customFields ?? [])].map((field) => (
                    <span key={field.key} draggable onDragStart={() => handlePaletteDragStart(field)} className="cursor-grab rounded border border-blue-200 bg-white px-2 py-1 text-xs text-blue-900 shadow-sm active:cursor-grabbing">
                      {field.label}
                    </span>
                  ))}
                </div>
              </div>

              {sections.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-4">
                  Brak sekcji. Dodaj sekcje aby zbudować strukturę agendy.
                </p>
              ) : (
                <div className="space-y-4">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className="border border-neutral-200 rounded-lg p-4 space-y-3"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handlePaletteDrop(section.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder="Nazwa sekcji (np. Ceremonia, Przyjęcie)"
                            value={section.title}
                            onChange={(e) =>
                              handleUpdateSection(section.id, { title: e.target.value })
                            }
                          />
                          <Input
                            placeholder="Opis sekcji (opcjonalnie)"
                            value={section.description || ""}
                            onChange={(e) =>
                              handleUpdateSection(section.id, { description: e.target.value })
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveSection(section.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-neutral-600">
                            Pola ({section.fields.length})
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddField(section.id)}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Dodaj pole
                          </Button>
                          <span className="text-[10px] text-neutral-400">Upuść pole w tej sekcji</span>
                        </div>

                        {section.fields.map((field, fieldIndex) => (
                          <div
                            key={field.key}
                            draggable
                            onDragStart={() => handleDragStart(section.id, fieldIndex)}
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(section.id, fieldIndex)}
                            className="flex gap-2 items-start p-3 border border-neutral-100 rounded-lg bg-neutral-50 cursor-move hover:bg-neutral-100 transition-colors"
                          >
                            <GripVertical className="h-4 w-4 text-neutral-400 mt-2" />
                            <div className="flex-1 space-y-2">
                              <Input
                                placeholder="Nazwa pola (np. Powitanie gości)"
                                value={field.label}
                                onChange={(e) =>
                                  handleUpdateField(section.id, fieldIndex, {
                                    label: e.target.value,
                                  })
                                }
                              />
                              <div className="flex gap-2">
                                <select
                                  className="flex-1 h-8 rounded-md border border-neutral-200 px-2 text-xs"
                                  value={field.type}
                                  onChange={(e) =>
                                    handleUpdateField(section.id, fieldIndex, {
                                      type: e.target.value,
                                    })
                                  }
                                >
                                  <option value="text">Tekst</option>
                                  <option value="textarea">Długi tekst</option>
                                  <option value="time">Czas</option>
                                  <option value="duration">Czas trwania</option>
                                </select>
                                <label className="flex items-center gap-1 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={(e) =>
                                      handleUpdateField(section.id, fieldIndex, {
                                        required: e.target.checked,
                                      })
                                    }
                                  />
                                  Wymagane
                                </label>
                              </div>
                              <Input
                                placeholder="Prompt dla LLM (opcjonalnie, np. 'Opisz powitanie gości w stylu eleganckim')"
                                value={field.llmPrompt || ""}
                                onChange={(e) =>
                                  handleUpdateField(section.id, fieldIndex, {
                                    llmPrompt: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveField(section.id, fieldIndex)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
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
                {editingTemplate ? "Zapisz" : "Utwórz"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
