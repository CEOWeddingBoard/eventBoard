"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Check, ImagePlus, X, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createMenuVariantsForEvents,
  updateMenuVariant,
  deleteMenuVariant,
  addVariantCourse,
  updateVariantCourse,
  deleteVariantCourse,
} from "@/lib/actions/menu-variant.actions";

type Event = { id: string; name: string; date: string };
type Course = { id: string; name: string; courseType: string; description: string | null; allergens: string | null; priceBase: number | null; priceExtra: number | null };
type Variant = { id: string; label: string; description: string | null; imageUrl: string | null; notes: string | null; eventName: string; eventId: string; courses: Course[] };

const COURSE_TYPE_OPTIONS = [
  { value: "APPETIZER", label: "Przystawka" },
  { value: "SOUP", label: "Zupa" },
  { value: "MAIN", label: "Danie główne" },
  { value: "DESSERT", label: "Deser" },
  { value: "CAKE", label: "Tort" },
  { value: "COLD_PLATTER", label: "Zimna płyta" },
  { value: "BUFFET", label: "Bufet" },
  { value: "DINNER", label: "Kolacja" },
  { value: "COFFEE_TEA", label: "Kawa i herbata" },
  { value: "DRINKS", label: "Napoje" },
  { value: "ALCOHOL", label: "Alkohol" },
  { value: "OTHER", label: "Inne" },
];

export function MenuCatalogClient({ events, variants: initialVariants }: { events: Event[]; variants: Variant[] }) {
  const [variants, setVariants] = useState<Variant[]>(initialVariants);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // create form
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const selectedVariant = variants.find((v) => v.id === selectedId) ?? null;

  const toggleEvent = (id: string) => setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Wybierz plik obrazu");
    const reader = new FileReader();
    reader.onload = () => setImageUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  async function saveCreate() {
    if (!label.trim()) return toast.error("Podaj nazwę wariantu");
    if (selected.length === 0) return toast.error("Zaznacz przynajmniej jeden event");
    setBusy(true);
    try {
      await createMenuVariantsForEvents({ label, description: description || null, imageUrl: imageUrl || null, notes: notes || null, eventIds: selected });
      toast.success(`Wariant dodany do ${selected.length} eventów`);
      setLabel(""); setDescription(""); setImageUrl(""); setNotes(""); setSelected([]); setShowCreate(false);
      window.location.reload();
    } catch { toast.error("Nie udało się dodać wariantu"); } finally { setBusy(false); }
  }

  async function updateVariant(id: string, patch: { label?: string; description?: string | null; imageUrl?: string | null; notes?: string | null }) {
    try {
      await updateMenuVariant(id, patch);
      setVariants((current) => current.map((v) => (v.id === id ? { ...v, ...patch } : v)));
    } catch { toast.error("Nie udało się zapisać"); }
  }

  async function removeVariant(id: string) {
    if (!confirm("Usunąć ten wariant?")) return;
    try {
      await deleteMenuVariant(id);
      setVariants((current) => current.filter((v) => v.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch { toast.error("Nie udało się usunąć"); }
  }

  async function addCourse(variantId: string) {
    try {
      const course = await addVariantCourse(variantId, { name: "Nowe danie", courseType: "MAIN" });
      setVariants((current) => current.map((v) => (v.id === variantId ? { ...v, courses: [...v.courses, course] } : v)));
    } catch { toast.error("Nie udało się dodać dania"); }
  }

  async function updateCourse(courseId: string, patch: { name?: string; courseType?: string }) {
    setVariants((current) => current.map((v) => ({ ...v, courses: v.courses.map((c) => (c.id === courseId ? { ...c, ...patch } : c)) })));
    try {
      await updateVariantCourse(courseId, patch);
    } catch { toast.error("Nie udało się zapisać dania"); }
  }

  async function removeCourse(variantId: string, courseId: string) {
    try {
      await deleteVariantCourse(courseId);
      setVariants((current) => current.map((v) => (v.id === variantId ? { ...v, courses: v.courses.filter((c) => c.id !== courseId) } : v)));
    } catch { toast.error("Nie udało się usunąć dania"); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-neutral-800">Warianty menu</h1>
          <p className="mt-1 text-sm text-neutral-500">Przeglądaj, edytuj i przypisuj warianty menu do eventów.</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate((s) => !s)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nowy wariant
        </Button>
      </div>

      {showCreate && (
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-bold text-neutral-800">Nowy wariant menu</h2>
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-xs font-medium text-neutral-600">Nazwa wariantu</label>
              <Input className="mt-1" placeholder="np. MENU A / MENU WIGILIJNE" value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600">Opis</label>
              <Textarea className="mt-1" rows={2} placeholder="np. 4 dania, napoje, obsługa..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600">Skan menu (obrazek)</label>
              {imageUrl ? (
                <div className="mt-1 flex items-start gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="Skan menu" className="h-20 w-auto rounded border border-neutral-200 object-contain" />
                  <Button size="sm" variant="ghost" onClick={() => setImageUrl("")}><X className="mr-1 h-3.5 w-3.5" />Usuń</Button>
                </div>
              ) : (
                <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-3 py-4 text-sm text-neutral-500 hover:border-blue-400 hover:text-blue-600">
                  <ImagePlus className="h-4 w-4" /> Dodaj skan menu
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
                </label>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600">Uwagi / alergeny</label>
              <Input className="mt-1" placeholder="np. bez glutenu, wege..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600">Widoczny w eventach</label>
              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {events.map((event) => {
                  const isSelected = selected.includes(event.id);
                  return (
                    <button key={event.id} type="button" onClick={() => toggleEvent(event.id)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm ${isSelected ? "border-blue-400 bg-blue-50 text-blue-800" : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"}`}>
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${isSelected ? "border-blue-500 bg-blue-500 text-white" : "border-neutral-300"}`}>{isSelected && <Check className="h-3 w-3" />}</span>
                      <span className="min-w-0 flex-1 truncate">{event.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <Button onClick={saveCreate} disabled={busy}>Dodaj wariant</Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Lista */}
        <div className="rounded-lg border border-neutral-200 bg-white">
          <div className="border-b border-neutral-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Warianty ({variants.length})</div>
          {variants.length === 0 ? (
            <p className="p-4 text-xs text-neutral-400">Brak wariantów menu.</p>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto">
              {variants.map((variant) => (
                <button key={variant.id} type="button" onClick={() => setSelectedId(variant.id)} className={`flex w-full items-center gap-2 border-b border-neutral-50 px-3 py-2.5 text-left text-sm transition ${selectedId === variant.id ? "bg-blue-50" : "hover:bg-neutral-50"}`}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-neutral-800">{variant.label}</span>
                    <span className="block truncate text-[11px] text-neutral-400">{variant.eventName}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Szczegóły */}
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          {!selectedVariant ? (
            <div className="flex min-h-[300px] items-center justify-center text-center text-sm text-neutral-400">
              Wybierz wariant z listy, aby zobaczyć i edytować jego szczegóły.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <Input className="h-9 font-semibold" value={selectedVariant.label} onChange={(e) => updateVariant(selectedVariant.id, { label: e.target.value })} />
                  <Textarea className="text-sm" rows={2} placeholder="Opis wariantu" value={selectedVariant.description ?? ""} onChange={(e) => setVariants((c) => c.map((v) => (v.id === selectedVariant.id ? { ...v, description: e.target.value } : v)))} onBlur={(e) => updateVariant(selectedVariant.id, { description: e.target.value })} />
                  <Input className="text-sm" placeholder="Uwagi / alergeny" value={selectedVariant.notes ?? ""} onChange={(e) => setVariants((c) => c.map((v) => (v.id === selectedVariant.id ? { ...v, notes: e.target.value } : v)))} onBlur={(e) => updateVariant(selectedVariant.id, { notes: e.target.value })} />
                  <p className="text-[11px] text-neutral-400">Event: {selectedVariant.eventName}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeVariant(selectedVariant.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>

              {selectedVariant.imageUrl && (
                <div className="flex items-start gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedVariant.imageUrl} alt={`Skan ${selectedVariant.label}`} className="h-32 w-auto rounded border border-neutral-200 object-contain" />
                  <Button size="sm" variant="ghost" onClick={() => updateVariant(selectedVariant.id, { imageUrl: null })}>Usuń skan</Button>
                </div>
              )}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Dania ({selectedVariant.courses.length})</p>
                  <Button size="sm" variant="outline" onClick={() => addCourse(selectedVariant.id)}><Plus className="mr-1 h-3.5 w-3.5" />Danie</Button>
                </div>
                {selectedVariant.courses.length === 0 ? (
                  <p className="text-xs text-neutral-400">Brak dań. Dodaj pierwsze danie.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedVariant.courses.map((course) => (
                      <div key={course.id} className="flex items-center gap-2 rounded border border-neutral-100 p-2">
                        <Input className="h-8 flex-1" value={course.name} onChange={(e) => updateCourse(course.id, { name: e.target.value })} />
                        <select className="h-8 w-32 rounded border px-2 text-xs" value={course.courseType} onChange={(e) => updateCourse(course.id, { courseType: e.target.value })}>
                          {COURSE_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <button type="button" onClick={() => removeCourse(selectedVariant.id, course.id)}><Trash2 className="h-4 w-4 text-red-500" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
