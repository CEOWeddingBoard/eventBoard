"use client";

import { useState } from "react";
import { ALL_MODULES, type ModuleDefinition } from "@/lib/event-modules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Palette,
  Users,
  UtensilsCrossed,
  CalendarDays,
  Wallet,
  Armchair,
  Store,
  Image as ImageIcon,
  BarChart3,
  ListTodo,
  Link,
  FileText,
  Globe,
  Gift,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const COLOR_OPTIONS = [
  { value: "#e11d48", label: "Czerwień" },
  { value: "#f97316", label: "Pomarańcz" },
  { value: "#ca8a04", label: "Złoto" },
  { value: "#16a34a", label: "Zieleń" },
  { value: "#0891b2", label: "Turkus" },
  { value: "#2563eb", label: "Niebieski" },
  { value: "#7c3aed", label: "Fiolet" },
  { value: "#db2777", label: "Róż" },
  { value: "#64748b", label: "Szary" },
];

const ICON_OPTIONS: { value: string; icon: LucideIcon }[] = [
  { value: "Heart", icon: Palette },
  { value: "Church", icon: Globe },
  { value: "Snowflake", icon: Sparkles },
  { value: "Briefcase", icon: Wallet },
  { value: "Sparkles", icon: Sparkles },
  { value: "Users", icon: Users },
  { value: "UtensilsCrossed", icon: UtensilsCrossed },
  { value: "CalendarDays", icon: CalendarDays },
  { value: "Music", icon: Gift },
];

interface CategoryData {
  id?: string;
  name: string;
  icon: string;
  color: string;
  modules: string[];
  isSystem: boolean;
}

interface CategoryConfiguratorProps {
  categories: CategoryData[];
  onCreate: (data: { name: string; icon: string; color: string; modules: string[] }) => Promise<void>;
  onUpdate: (id: string, data: Partial<{ name: string; icon: string; color: string; modules: string[] }>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CategoryConfigurator({ categories, onCreate, onUpdate, onDelete }: CategoryConfiguratorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("Sparkles");
  const [newColor, setNewColor] = useState("#2563eb");
  const [activeModules, setActiveModules] = useState<string[]>([]);

  const basicModules = ALL_MODULES.filter((m) => m.category === "basic");
  const premiumModules = ALL_MODULES.filter((m) => m.category === "premium");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await onCreate({ name: newName.trim(), icon: newIcon, color: newColor, modules: activeModules });
    setNewName("");
    setNewIcon("Sparkles");
    setNewColor("#2563eb");
    setActiveModules([]);
    setIsCreating(false);
  };

  const handleEditClick = (cat: CategoryData) => {
    setEditingId(cat.id ?? null);
    setNewName(cat.name);
    setNewIcon(cat.icon);
    setNewColor(cat.color);
    setActiveModules(cat.modules);
    setIsCreating(false);
  };

  const handleUpdate = async (id: string) => {
    await onUpdate(id, { name: newName, icon: newIcon, color: newColor, modules: activeModules });
    setEditingId(null);
  };

  const toggleModule = (moduleId: string) => {
    setActiveModules((prev) =>
      prev.includes(moduleId) ? prev.filter((m) => m !== moduleId) : [...prev, moduleId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Lista kategorii */}
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((cat) => {
          const isEditing = editingId === cat.id;
          const ColorIcon = ICON_OPTIONS.find((i) => i.value === cat.icon)?.icon ?? Sparkles;

          return (
            <Card
              key={cat.id}
              className={cn("relative", cat.isSystem && "opacity-80 bg-slate-50")}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-white shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <ColorIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <CardTitle className="text-base">{cat.name}</CardTitle>
                      <p className="text-xs text-slate-500">
                        {cat.modules.length} modułów
                        {cat.isSystem && " · systemowa"}
                      </p>
                    </div>
                  </div>
                  {!cat.isSystem && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditClick(cat)}
                      >
                        <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => cat.id && onDelete(cat.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {cat.modules.slice(0, 6).map((modId) => {
                    const mod = ALL_MODULES.find((m) => m.id === modId);
                    return mod ? (
                      /* Pełna etykieta — pierwsze słowo dawało chipy „Pełna”
                         i „Tylko”, które samodzielnie nic nie znaczą. */
                      <span
                        key={modId}
                        className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                      >
                        <mod.icon className="h-3 w-3 shrink-0" />
                        {mod.label}
                      </span>
                    ) : null;
                  })}
                  {cat.modules.length > 6 && (
                    <span
                      className="text-xs text-slate-500"
                      title={cat.modules
                        .slice(6)
                        .map((id) => ALL_MODULES.find((m) => m.id === id)?.label ?? id)
                        .join(", ")}
                    >
                      +{cat.modules.length - 6} więcej
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dodaj/Edytuj kategorię */}
      {(isCreating || editingId) ? (
        <Card className="border-slate-300">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Edytuj kategorię" : "Nowa kategoria"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nazwa */}
            <div>
              <Label className="text-sm font-medium">Nazwa kategorii</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="np. Chrzciny, Bankiet firmowy"
                className="mt-1"
              />
            </div>

            {/* Kolor */}
            <div>
              <Label className="text-sm font-medium">Kolor</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all",
                      newColor === c.value
                        ? "border-slate-900 scale-110"
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setNewColor(c.value)}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Ikona */}
            <div>
              <Label className="text-sm font-medium">Ikona</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {ICON_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg border transition-all",
                      newIcon === o.value
                        ? "border-slate-900 bg-slate-100"
                        : "border-slate-200 hover:border-slate-400"
                    )}
                    onClick={() => setNewIcon(o.value)}
                  >
                    <o.icon className="h-5 w-5 text-slate-600" />
                  </button>
                ))}
              </div>
            </div>

            {/* Moduły podstawowe */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Moduły podstawowe
              </Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {basicModules.map((mod) => (
                  <ModuleCheckbox
                    key={mod.id}
                    module={mod}
                    checked={activeModules.includes(mod.id)}
                    onToggle={() => toggleModule(mod.id)}
                  />
                ))}
              </div>
            </div>

            {/* Moduły premium */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Moduły premium (ślubne — WeddingBoard)
              </Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {premiumModules.map((mod) => (
                  <ModuleCheckbox
                    key={mod.id}
                    module={mod}
                    checked={activeModules.includes(mod.id)}
                    onToggle={() => toggleModule(mod.id)}
                  />
                ))}
              </div>
            </div>

            {/* Przyciski */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setIsCreating(false);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Anuluj
              </Button>
              <Button
                onClick={() => {
                  if (editingId) {
                    handleUpdate(editingId);
                  } else {
                    handleCreate();
                  }
                }}
                disabled={!newName.trim()}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                <Check className="h-4 w-4 mr-1" />
                {editingId ? "Zapisz zmiany" : "Dodaj kategorię"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => {
            setIsCreating(true);
            setEditingId(null);
            setActiveModules([]);
            setNewName("");
          }}
          className="w-full border-dashed border-slate-300 text-slate-500 hover:text-slate-700 hover:border-slate-400 h-16"
        >
          <Plus className="h-4 w-4 mr-2" />
          Dodaj własną kategorię
        </Button>
      )}
    </div>
  );
}

function ModuleCheckbox({
  module,
  checked,
  onToggle,
}: {
  module: ModuleDefinition;
  checked: boolean;
  onToggle: () => void;
}) {
  const Icon = module.icon;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 text-left transition-all",
        checked
          ? "border-slate-900 bg-slate-50"
          : "border-slate-200 hover:border-slate-300"
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border mt-0.5 transition-colors",
          checked ? "bg-slate-900 border-slate-900 text-white" : "border-slate-300"
        )}
      >
        {checked && <Check className="h-3 w-3" />}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-slate-500" />
          <p className="text-sm font-medium text-slate-900">{module.label}</p>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{module.description}</p>
      </div>
    </button>
  );
}
