"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Copy, FileDown, Image, ImagePlus, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getMenuVariants,
  createMenuVariant,
  updateMenuVariant,
  deleteMenuVariant,
  addVariantCourse,
  updateVariantCourse,
  deleteVariantCourse,
  copyMenuVariant,
} from "@/lib/actions/menu-variant.actions";
import { MenuImportDialog } from "@/components/menu/MenuImportDialog";

interface VariantCourse {
  id: string;
  menuVariantId: string;
  name: string;
  courseType: string;
  description: string | null;
  allergens: string | null;
  priceBase: number | null;
  priceExtra: number | null;
  portions: number | null;
  approved: boolean;
  sortOrder: number;
}

interface MenuVariant {
  id: string;
  eventId: string;
  label: string;
  description: string | null;
  imageUrl: string | null;
  notes: string | null;
  pricePerPerson: number | null;
  courses: VariantCourse[];
  sortOrder: number;
}

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

interface MenuVariantEditorProps {
  eventId: string;
}

export function MenuVariantEditor({ eventId }: MenuVariantEditorProps) {
  const [variants, setVariants] = useState<MenuVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);
  // Które dania mają niezapisane zmiany — pokazujemy przy nich stan zapisu.
  const [dirtyCourses, setDirtyCourses] = useState<Record<string, boolean>>({});
  const [savingCourse, setSavingCourse] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      const data = await getMenuVariants(eventId);
      setVariants(data);
    } catch {
      toast.error("Nie udało się pobrać menu");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newLabel.trim()) return;
    setAdding(true);
    try {
      const v = await createMenuVariant(eventId, newLabel.trim());
      setVariants((prev) => [...prev, v]);
      setNewLabel("");
    } catch {
      toast.error("Nie udało się utworzyć wariantu");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMenuVariant(id);
      setVariants((prev) => prev.filter((v) => v.id !== id));
    } catch {
      toast.error("Nie udało się usunąć wariantu");
    }
  };

  const handleCopy = async (id: string) => {
    try {
      const copy = await copyMenuVariant(id, "Kopia");
      setVariants((prev) => [...prev, copy]);
      toast.success("Skopiowano");
    } catch {
      toast.error("Nie udało się skopiować");
    }
  };

  const handleAddCourse = async (variantId: string) => {
    try {
      const course = await addVariantCourse(variantId, {
        name: "Nowe danie",
        courseType: "MAIN",
      });
      setVariants((prev) =>
        prev.map((v) =>
          v.id === variantId ? { ...v, courses: [...v.courses, course] } : v
        )
      );
    } catch {
      toast.error("Nie udało się dodać dania");
    }
  };

  const handleDeleteCourse = async (variantId: string, courseId: string) => {
    try {
      await deleteVariantCourse(courseId);
      setVariants((prev) =>
        prev.map((v) =>
          v.id === variantId
            ? { ...v, courses: v.courses.filter((c) => c.id !== courseId) }
            : v
        )
      );
    } catch {
      toast.error("Nie udało się usunąć dania");
    }
  };

  /** Zmiana pola dania — natychmiast w UI, oznaczenie do zapisu. */
  const editCourseField = (variantId: string, courseId: string, patch: Partial<VariantCourse>) => {
    setVariants((prev) =>
      prev.map((v) =>
        v.id === variantId
          ? { ...v, courses: v.courses.map((c) => (c.id === courseId ? { ...c, ...patch } : c)) }
          : v,
      ),
    );
    setDirtyCourses((prev) => ({ ...prev, [courseId]: true }));
  };

  /**
   * Zapis dania. Wcześniejszy model kasował szkic po zapisie pierwszego pola,
   * przez co edycja kolejnych pól cicho przepadała, a wiersz wypadał z edycji.
   * Teraz stan trzymamy w `variants`, a zapis czyta aktualną wartość dania.
   */
  const persistCourse = async (variantId: string, courseId: string) => {
    if (!dirtyCourses[courseId]) return;
    const variant = variants.find((v) => v.id === variantId);
    const course = variant?.courses.find((c) => c.id === courseId);
    if (!course) return;
    setSavingCourse((prev) => ({ ...prev, [courseId]: true }));
    try {
      await updateVariantCourse(courseId, {
        name: course.name,
        courseType: course.courseType,
        description: course.description ?? undefined,
        allergens: course.allergens ?? undefined,
        priceBase: course.priceBase,
        priceExtra: course.priceExtra,
        portions: course.portions,
      });
      setDirtyCourses((prev) => {
        const next = { ...prev };
        delete next[courseId];
        return next;
      });
    } catch {
      toast.error("Nie udało się zapisać dania");
    } finally {
      setSavingCourse((prev) => {
        const next = { ...prev };
        delete next[courseId];
        return next;
      });
    }
  };

  function parseAllergens(raw: string | null): { vege?: boolean; gluten?: boolean; bezgluten?: boolean } {
    try {
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  /** Przełącznik alergenu zapisuje się od razu — to jeden klik, nie edycja. */
  const toggleAllergen = async (variantId: string, courseId: string, key: "vege" | "gluten" | "bezgluten") => {
    const variant = variants.find((v) => v.id === variantId);
    const course = variant?.courses.find((c) => c.id === courseId);
    if (!course) return;
    const current = parseAllergens(course.allergens);
    const nextAllergens = JSON.stringify({ ...current, [key]: !current[key] });
    editCourseField(variantId, courseId, { allergens: nextAllergens });
    try {
      await updateVariantCourse(courseId, { allergens: nextAllergens });
      setDirtyCourses((prev) => {
        const next = { ...prev };
        delete next[courseId];
        return next;
      });
    } catch {
      toast.error("Nie udało się zapisać");
    }
  };

  /** Zatwierdzenie pozycji — jeden klik, zapis od razu. */
  const toggleApproved = async (variantId: string, courseId: string) => {
    const variant = variants.find((v) => v.id === variantId);
    const course = variant?.courses.find((c) => c.id === courseId);
    if (!course) return;
    const next = !course.approved;
    editCourseField(variantId, courseId, { approved: next });
    try {
      await updateVariantCourse(courseId, { approved: next });
    } catch {
      toast.error("Nie udało się zapisać");
    }
  };

  const handleExportPdf = (variantId: string) => {
    window.open(`/pl/api/events/${eventId}/menu-variants/${variantId}/export-pdf`, "_blank");
  };

  const handleUpdateMeta = async (variantId: string, patch: { description?: string | null; notes?: string | null; imageUrl?: string | null; pricePerPerson?: number | null }) => {
    try {
      await updateMenuVariant(variantId, patch);
      setVariants((prev) => prev.map((v) => (v.id === variantId ? { ...v, ...patch } : v)));
    } catch {
      toast.error("Nie udało się zapisać");
    }
  };

  const handleImageUpload = async (variantId: string, file?: File | null) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Obraz jest za duży (max 2 MB)");
      return;
    }
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    await handleUpdateMeta(variantId, { imageUrl: dataUrl });
    toast.success("Skan menu dodany");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-olive" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Warianty menu</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <MenuImportDialog eventId={eventId} onImported={load} />
            <Input
              className="h-9 w-48 text-sm"
              placeholder="MENU A, MENU B..."
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button size="sm" onClick={handleCreate} disabled={adding || !newLabel.trim()}>
              <Plus className="mr-1 h-4 w-4" />
              Dodaj wariant
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {variants.length === 0 ? (
            <p className="text-ink-muted text-sm text-center py-4">
              Brak wariantów menu. Dodaj pierwszy (np. MENU A, MENU B, MENU WIGILIJNE).
            </p>
          ) : (
            <div className="space-y-4">
              {variants.map((variant) => (
                <Card key={variant.id} className="border-olive/15">
                  <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                    <CardTitle className="text-base font-medium">{variant.label}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(variant.id)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleExportPdf(variant.id)}>
                        <FileDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(variant.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3 px-4">
                    <div className="mb-3 space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex min-w-[220px] flex-1 items-center gap-2 text-xs text-ink-muted">
                          <span className="font-medium">Opis</span>
                          <Input
                            className="h-7 text-xs"
                            placeholder="np. 4 dania, napoje, obsługa..."
                            value={variant.description ?? ""}
                            onChange={(e) =>
                              setVariants((prev) => prev.map((v) => (v.id === variant.id ? { ...v, description: e.target.value } : v)))
                            }
                            onBlur={(e) => handleUpdateMeta(variant.id, { description: e.target.value })}
                          />
                        </label>
                        <label className="flex min-w-[180px] flex-1 items-center gap-2 text-xs text-ink-muted">
                          <span className="font-medium">Uwagi / alergeny</span>
                          <Input
                            className="h-7 text-xs"
                            placeholder="np. bez glutenu, wege..."
                            value={variant.notes ?? ""}
                            onChange={(e) =>
                              setVariants((prev) => prev.map((v) => (v.id === variant.id ? { ...v, notes: e.target.value } : v)))
                            }
                            onBlur={(e) => handleUpdateMeta(variant.id, { notes: e.target.value })}
                          />
                        </label>
                        <label className="flex w-40 items-center gap-2 text-xs text-ink-muted">
                          <span className="font-medium whitespace-nowrap">Cena / os.</span>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            className="h-7 text-xs"
                            placeholder="np. 250"
                            value={variant.pricePerPerson ?? ""}
                            onChange={(e) =>
                              setVariants((prev) => prev.map((v) => (v.id === variant.id ? { ...v, pricePerPerson: e.target.value === "" ? null : parseFloat(e.target.value) } : v)))
                            }
                            onBlur={(e) => handleUpdateMeta(variant.id, { pricePerPerson: e.target.value === "" ? null : parseFloat(e.target.value) })}
                          />
                        </label>
                      </div>
                      <div className="flex items-start gap-2">
                        {variant.imageUrl ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={variant.imageUrl} alt={`Skan ${variant.label}`} className="h-20 w-auto rounded border border-neutral-200 object-contain" />
                            <Button variant="ghost" size="sm" onClick={() => handleUpdateMeta(variant.id, { imageUrl: null })}>
                              Usuń skan
                            </Button>
                          </>
                        ) : (
                          <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-neutral-300 px-3 py-1.5 text-xs text-ink-muted hover:bg-neutral-50">
                            <ImagePlus className="h-3.5 w-3.5" />
                            Dodaj skan / zdjęcie menu
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(variant.id, e.target.files?.[0])}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-olive/10 text-left text-ink-muted text-xs">
                          <th className="pb-1.5 pr-2 font-medium">Danie</th>
                          <th className="pb-1.5 px-2 font-medium w-28">Kategoria</th>
                          <th className="pb-1.5 px-2 font-medium w-16">Porcje</th>
                          <th className="pb-1.5 px-2 font-medium w-16">Cena</th>
                          <th className="pb-1.5 px-2 font-medium w-16">Dopłata</th>
                          <th className="pb-1.5 px-2 font-medium w-16">Vege</th>
                          <th className="pb-1.5 px-2 font-medium w-14">Gluten</th>
                          <th className="pb-1.5 px-2 font-medium w-16">Bezglut.</th>
                          <th className="pb-1.5 px-2 font-medium w-12">OK</th>
                          <th className="pb-1.5 pl-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {variant.courses.map((course) => {
                          const allergens = parseAllergens(course.allergens);
                          const dirty = !!dirtyCourses[course.id];
                          const saving = !!savingCourse[course.id];
                          return (
                            <tr key={course.id} className="border-b border-olive/5 align-top">
                              <td className="py-1 pr-2">
                                <Input
                                  className="h-7 text-sm"
                                  value={course.name}
                                  placeholder="Nazwa dania"
                                  onChange={(e) => editCourseField(variant.id, course.id, { name: e.target.value })}
                                  onBlur={() => persistCourse(variant.id, course.id)}
                                  onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                                />
                              </td>
                              <td className="py-1 px-2">
                                <select
                                  className="elegant-input h-7 text-xs w-full"
                                  value={course.courseType}
                                  onChange={(e) => editCourseField(variant.id, course.id, { courseType: e.target.value })}
                                  onBlur={() => persistCourse(variant.id, course.id)}
                                >
                                  {COURSE_TYPE_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-1 px-2">
                                <input
                                  type="number"
                                  min="0"
                                  className="elegant-input h-7 text-xs w-full"
                                  placeholder="—"
                                  value={course.portions ?? ""}
                                  onChange={(e) => editCourseField(variant.id, course.id, { portions: e.target.value === "" ? null : parseInt(e.target.value, 10) })}
                                  onBlur={() => persistCourse(variant.id, course.id)}
                                />
                              </td>
                              <td className="py-1 px-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  className="elegant-input h-7 text-xs w-full"
                                  placeholder="0.00"
                                  value={course.priceBase ?? ""}
                                  onChange={(e) => editCourseField(variant.id, course.id, { priceBase: e.target.value === "" ? null : parseFloat(e.target.value) })}
                                  onBlur={() => persistCourse(variant.id, course.id)}
                                />
                              </td>
                              <td className="py-1 px-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  className="elegant-input h-7 text-xs w-full"
                                  placeholder="0.00"
                                  value={course.priceExtra ?? ""}
                                  onChange={(e) => editCourseField(variant.id, course.id, { priceExtra: e.target.value === "" ? null : parseFloat(e.target.value) })}
                                  onBlur={() => persistCourse(variant.id, course.id)}
                                />
                              </td>
                              <td className="py-1 px-2 text-center">
                                <button type="button" onClick={() => toggleAllergen(variant.id, course.id, "vege")}
                                  className={`rounded px-2 py-0.5 text-xs ${allergens.vege ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-400"}`}>
                                  {allergens.vege ? "✓" : "—"}
                                </button>
                              </td>
                              <td className="py-1 px-2 text-center">
                                <button type="button" onClick={() => toggleAllergen(variant.id, course.id, "gluten")}
                                  className={`rounded px-2 py-0.5 text-xs ${allergens.gluten ? "bg-amber-100 text-amber-700" : "bg-neutral-100 text-neutral-400"}`}>
                                  {allergens.gluten ? "✓" : "—"}
                                </button>
                              </td>
                              <td className="py-1 px-2 text-center">
                                <button type="button" onClick={() => toggleAllergen(variant.id, course.id, "bezgluten")}
                                  className={`rounded px-2 py-0.5 text-xs ${allergens.bezgluten ? "bg-blue-100 text-blue-700" : "bg-neutral-100 text-neutral-400"}`}>
                                  {allergens.bezgluten ? "✓" : "—"}
                                </button>
                              </td>
                              <td className="py-1 px-2 text-center">
                                <button
                                  type="button"
                                  title="Zatwierdzone"
                                  onClick={() => toggleApproved(variant.id, course.id)}
                                  className={`rounded px-2 py-0.5 text-xs ${course.approved ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-400"}`}
                                >
                                  {course.approved ? "✓" : "—"}
                                </button>
                              </td>
                              <td className="py-1 pl-2 whitespace-nowrap">
                                {saving ? (
                                  <Loader2 className="inline h-3.5 w-3.5 animate-spin text-olive" />
                                ) : dirty ? (
                                  <span className="text-[10px] text-amber-600">niezapisane</span>
                                ) : null}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="ml-1 h-7 w-7 text-ink-muted hover:text-red-500"
                                  onClick={() => handleDeleteCourse(variant.id, course.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <Button variant="ghost" size="sm" className="mt-2" onClick={() => handleAddCourse(variant.id)}>
                      <Plus className="mr-1 h-3 w-3" /> Dodaj danie
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
