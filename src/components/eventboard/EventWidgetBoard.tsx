"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, ClipboardList, FileText, CheckSquare, BarChart2, Link2,
  Lock, Eye, ChevronDown, ChevronUp, Trash2, GripVertical, X, Pencil,
} from "lucide-react";
import { RunsheetWidget } from "./widgets/RunsheetWidget";
import { NoteWidget } from "./widgets/NoteWidget";
import { ChecklistWidget } from "./widgets/ChecklistWidget";
import { StatWidget } from "./widgets/StatWidget";
import { LinkWidget } from "./widgets/LinkWidget";
import {
  createEventWidget,
  deleteEventWidget,
  updateEventWidgetConfig,
  type EventWidgetData,
  type WidgetType,
} from "@/lib/actions/event-widget.actions";

type WidgetMeta = {
  type: WidgetType;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  borderColor: string;
  bgColor: string;
};

const WIDGET_DEFS: WidgetMeta[] = [
  {
    type: "RUNSHEET",
    label: "Scenariusz",
    icon: <ClipboardList className="h-5 w-5" />,
    description: "Minutowy plan z trybem live",
    color: "text-indigo-600",
    borderColor: "border-l-indigo-400",
    bgColor: "bg-indigo-50",
  },
  {
    type: "NOTE",
    label: "Notatka",
    icon: <FileText className="h-5 w-5" />,
    description: "Wolny tekst, uwagi, instrukcje",
    color: "text-amber-600",
    borderColor: "border-l-amber-400",
    bgColor: "bg-amber-50",
  },
  {
    type: "CHECKLIST",
    label: "Checklista",
    icon: <CheckSquare className="h-5 w-5" />,
    description: "Lista zadań do odhaczenia",
    color: "text-emerald-600",
    borderColor: "border-l-emerald-400",
    bgColor: "bg-emerald-50",
  },
  {
    type: "STAT",
    label: "Statystyka",
    icon: <BarChart2 className="h-5 w-5" />,
    description: "Liczba z etykietą i trendem",
    color: "text-violet-600",
    borderColor: "border-l-violet-400",
    bgColor: "bg-violet-50",
  },
  {
    type: "LINK",
    label: "Link",
    icon: <Link2 className="h-5 w-5" />,
    description: "Szybki dostęp do URL",
    color: "text-sky-600",
    borderColor: "border-l-sky-400",
    bgColor: "bg-sky-50",
  },
];

function getWidgetDef(type: WidgetType): WidgetMeta {
  return WIDGET_DEFS.find((d) => d.type === type) ?? WIDGET_DEFS[1];
}

function parseConfig(configJson: string): { visibleInPortal: boolean } {
  try { return JSON.parse(configJson || "{}"); } catch { return { visibleInPortal: false }; }
}

export function EventWidgetBoard({
  eventId,
  initialWidgets,
}: {
  eventId: string;
  initialWidgets: EventWidgetData[];
}) {
  const [widgets, setWidgets] = useState<EventWidgetData[]>(initialWidgets);

  // Add wizard state
  const [addStep, setAddStep] = useState<"closed" | "pick" | "config">("closed");
  const [pickedType, setPickedType] = useState<WidgetType | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newPortal, setNewPortal] = useState(false);
  const [adding, setAdding] = useState(false);

  // Per-widget UI state
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  const openAdd = () => {
    setAddStep("pick");
    setPickedType(null);
    setNewTitle("");
    setNewPortal(false);
  };

  const pickType = (type: WidgetType) => {
    setPickedType(type);
    setNewTitle(WIDGET_DEFS.find((d) => d.type === type)?.label ?? "Widget");
    setAddStep("config");
  };

  const confirmAdd = async () => {
    if (!pickedType) return;
    setAdding(true);
    try {
      const config = JSON.stringify({ visibleInPortal: newPortal });
      const widget = await createEventWidget(eventId, pickedType, newTitle || "Widget", config);
      setWidgets((prev) => [...prev, widget]);
      setAddStep("closed");
    } finally {
      setAdding(false);
    }
  };

  const removeWidget = async (widgetId: string) => {
    if (!confirm("Usunąć widget?")) return;
    await deleteEventWidget(widgetId, eventId);
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
  };

  const startEditTitle = (widget: EventWidgetData) => {
    setEditingTitle(widget.id);
    setTitleDraft(widget.title);
    setTimeout(() => titleRef.current?.focus(), 0);
  };

  const saveTitle = async (widget: EventWidgetData) => {
    if (!titleDraft.trim() || titleDraft === widget.title) {
      setEditingTitle(null);
      return;
    }
    const config = parseConfig(widget.configJson);
    await updateEventWidgetConfig(widget.id, titleDraft.trim(), JSON.stringify(config));
    setWidgets((prev) =>
      prev.map((w) => (w.id === widget.id ? { ...w, title: titleDraft.trim() } : w))
    );
    setEditingTitle(null);
  };

  const togglePortalVisibility = async (widget: EventWidgetData) => {
    const config = parseConfig(widget.configJson);
    const newConfig = { ...config, visibleInPortal: !config.visibleInPortal };
    await updateEventWidgetConfig(widget.id, widget.title, JSON.stringify(newConfig));
    setWidgets((prev) =>
      prev.map((w) =>
        w.id === widget.id ? { ...w, configJson: JSON.stringify(newConfig) } : w
      )
    );
  };

  const renderWidgetContent = (widget: EventWidgetData) => {
    switch (widget.widgetType as WidgetType) {
      case "RUNSHEET": return <RunsheetWidget widgetId={widget.id} dataJson={widget.dataJson} />;
      case "NOTE": return <NoteWidget widgetId={widget.id} dataJson={widget.dataJson} />;
      case "CHECKLIST": return <ChecklistWidget widgetId={widget.id} dataJson={widget.dataJson} />;
      case "STAT": return <StatWidget widgetId={widget.id} dataJson={widget.dataJson} />;
      case "LINK": return <LinkWidget widgetId={widget.id} dataJson={widget.dataJson} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Pulpit eventu</h3>
        {addStep === "closed" && (
          <Button size="sm" onClick={openAdd} className="gap-1.5">
            <Plus className="h-4 w-4" /> Dodaj widget
          </Button>
        )}
      </div>

      {/* Add widget wizard – inline */}
      {addStep !== "closed" && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Step 1: Pick type */}
          {addStep === "pick" && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">Wybierz typ widgetu</p>
                <button onClick={() => setAddStep("closed")} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {WIDGET_DEFS.map((wt) => (
                  <button
                    key={wt.type}
                    onClick={() => pickType(wt.type)}
                    className={`flex flex-col items-start gap-1.5 rounded-lg border-2 border-slate-100 p-3 text-left hover:border-slate-300 hover:bg-slate-50 transition-all`}
                  >
                    <span className={wt.color}>{wt.icon}</span>
                    <span className="text-sm font-medium text-slate-800">{wt.label}</span>
                    <span className="text-xs text-slate-400 leading-snug">{wt.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Configure */}
          {addStep === "config" && pickedType && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAddStep("pick")}
                    className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  >
                    ← Zmień typ
                  </button>
                </div>
                <button onClick={() => setAddStep("closed")} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${getWidgetDef(pickedType).bgColor}`}>
                <span className={getWidgetDef(pickedType).color}>{getWidgetDef(pickedType).icon}</span>
                <span className={`text-sm font-medium ${getWidgetDef(pickedType).color}`}>
                  {getWidgetDef(pickedType).label}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Nazwa widgetu</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmAdd()}
                  placeholder="np. Checklista obsługi stołów"
                  className="h-9"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Widoczność</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setNewPortal(false)}
                    className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm transition-all ${
                      !newPortal
                        ? "border-slate-800 bg-slate-900 text-white"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Lock className="h-4 w-4 shrink-0" />
                    <span className="text-left leading-tight">Prywatny<br /><span className="text-xs opacity-60 font-normal">tylko zespół</span></span>
                  </button>
                  <button
                    onClick={() => setNewPortal(true)}
                    className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm transition-all ${
                      newPortal
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Eye className="h-4 w-4 shrink-0" />
                    <span className="text-left leading-tight">Portal klienta<br /><span className="text-xs opacity-60 font-normal">widoczny dla pary</span></span>
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setAddStep("closed")} className="flex-1">
                  Anuluj
                </Button>
                <Button size="sm" onClick={confirmAdd} disabled={adding || !newTitle.trim()} className="flex-1">
                  {adding ? "Dodawanie..." : "Dodaj widget"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {widgets.length === 0 && addStep === "closed" && (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-12 text-center space-y-3">
          <div className="flex justify-center gap-3 text-slate-300">
            <ClipboardList className="h-7 w-7" />
            <FileText className="h-7 w-7" />
            <CheckSquare className="h-7 w-7" />
          </div>
          <p className="text-sm text-slate-400">Brak widgetów. Dodaj scenariusz, notatkę lub checklistę.</p>
          <Button size="sm" variant="outline" onClick={openAdd} className="gap-1.5">
            <Plus className="h-4 w-4" /> Dodaj pierwszy widget
          </Button>
        </div>
      )}

      {/* Widget cards */}
      <div className="space-y-3">
        {widgets.map((widget) => {
          const def = getWidgetDef(widget.widgetType as WidgetType);
          const config = parseConfig(widget.configJson);
          const isCollapsed = collapsed[widget.id] ?? false;
          const isEditingThisTitle = editingTitle === widget.id;

          return (
            <div
              key={widget.id}
              className={`rounded-xl border border-slate-200 border-l-4 ${def.borderColor} bg-white shadow-sm overflow-hidden`}
            >
              {/* Widget header */}
              <div className="flex items-center gap-2 px-3 py-2.5">
                <GripVertical className="h-4 w-4 text-slate-300 cursor-grab shrink-0" />

                <span className={`shrink-0 ${def.color}`}>{def.icon}</span>

                {/* Title (editable) */}
                {isEditingThisTitle ? (
                  <Input
                    ref={titleRef}
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={() => saveTitle(widget)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveTitle(widget);
                      if (e.key === "Escape") setEditingTitle(null);
                    }}
                    className="h-7 text-sm font-medium flex-1 py-0"
                  />
                ) : (
                  <button
                    onClick={() => startEditTitle(widget)}
                    className="flex-1 text-left text-sm font-medium text-slate-800 hover:text-slate-600 flex items-center gap-1.5 group min-w-0"
                  >
                    <span className="truncate">{widget.title}</span>
                    <Pencil className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                  </button>
                )}

                {/* Visibility badge */}
                <button
                  onClick={() => togglePortalVisibility(widget)}
                  title={config.visibleInPortal ? "Widoczny w portalu klienta – kliknij aby ukryć" : "Prywatny – kliknij aby pokazać w portalu"}
                  className={`shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                    config.visibleInPortal
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {config.visibleInPortal ? (
                    <><Eye className="h-3 w-3" /> Portal</>
                  ) : (
                    <><Lock className="h-3 w-3" /> Prywatny</>
                  )}
                </button>

                {/* Collapse toggle */}
                <button
                  onClick={() => setCollapsed((prev) => ({ ...prev, [widget.id]: !isCollapsed }))}
                  className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </button>

                {/* Delete */}
                <button
                  onClick={() => removeWidget(widget.id)}
                  className="shrink-0 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Widget body */}
              {!isCollapsed && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-100">
                  {renderWidgetContent(widget)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
