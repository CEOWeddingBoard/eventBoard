"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { Plus, Trash2, GripVertical, ExternalLink, MapPin, Music, Camera, Menu, Calendar, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getBoardLinks,
  createBoardLink,
  updateBoardLink,
  deleteBoardLink,
  reorderBoardLinks,
  type BoardLinkInput,
} from "@/lib/actions/board-links.actions";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const ICON_OPTIONS = [
  { value: "map", label: "Mapa", icon: MapPin },
  { value: "music", label: "Muzyka", icon: Music },
  { value: "camera", label: "Zdj\u0119cia", icon: Camera },
  { value: "menu", label: "Menu", icon: Menu },
  { value: "calendar", label: "Kalendarz", icon: Calendar },
  { value: "link", label: "Link", icon: Link2 },
];

interface BoardLink {
  id: string;
  eventId: string;
  label: string;
  url: string;
  icon: string | null;
  enabled: boolean;
  sortOrder: number;
}

interface SortableLinkRowProps {
  link: BoardLink;
  handleUpdate: (linkId: string, field: string, value: string | boolean) => void;
  handleDelete: (linkId: string) => void;
}

function SortableLinkRow({ link, handleUpdate, handleDelete }: SortableLinkRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        isDragging
          ? "border-olive bg-olive-muted/20 shadow-lg z-10"
          : "border-olive/10 hover:border-olive/30"
      }`}
    >
      <button
        type="button"
        className="cursor-grab touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-ink-muted" />
      </button>

      <div className="flex items-center gap-2 w-28 shrink-0">
        <select
          value={link.icon ?? "link"}
          onChange={(e) => handleUpdate(link.id, "icon", e.target.value)}
          className="elegant-input h-8 text-xs w-full"
        >
          {ICON_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <Input
          className="h-8 text-sm"
          placeholder="Nazwa linku"
          value={link.label}
          onChange={(e) => handleUpdate(link.id, "label", e.target.value)}
        />
        <Input
          className="h-8 text-sm font-mono"
          placeholder="https://..."
          value={link.url}
          onChange={(e) => handleUpdate(link.id, "url", e.target.value)}
        />
      </div>

      <Toggle
        pressed={link.enabled}
        onPressedChange={(pressed) => handleUpdate(link.id, "enabled", pressed)}
        className="data-[state=on]:bg-olive-muted/50"
        size="sm"
      >
        <ExternalLink className="h-4 w-4" />
      </Toggle>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-ink-muted hover:text-red-500 shrink-0"
        onClick={() => handleDelete(link.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface EventBoardLinkBuilderProps {
  eventId: string;
}

export function EventBoardLinkBuilder({ eventId }: EventBoardLinkBuilderProps) {
  const [links, setLinks] = useState<BoardLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    })
  );

  const loadLinks = useCallback(async () => {
    try {
      const data = await getBoardLinks(eventId);
      setLinks(data);
    } catch {
      toast.error("Nie uda\u0142o si\u0119 pobra\u0107 link\u00f3w");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  const handleAdd = async () => {
    setSaving(true);
    try {
      const link = await createBoardLink(eventId, {
        label: "Nowy link",
        url: "https://",
        icon: "link",
      });
      setLinks((prev) => [...prev, link]);
    } catch {
      toast.error("Nie uda\u0142o si\u0119 doda\u0107 linku");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (linkId: string) => {
    try {
      await deleteBoardLink(linkId);
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    } catch {
      toast.error("Nie uda\u0142o si\u0119 usun\u0105\u0107 linku");
    }
  };

  const handleUpdate = async (linkId: string, field: string, value: string | boolean) => {
    setLinks((prev) =>
      prev.map((l) => (l.id === linkId ? { ...l, [field]: value } : l))
    );
    try {
      await updateBoardLink(linkId, { [field]: value });
    } catch {
      toast.error("Nie uda\u0142o si\u0119 zaktualizowa\u0107 linku");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex((l) => l.id === active.id);
    const newIndex = links.findIndex((l) => l.id === over.id);

    const reordered = arrayMove(links, oldIndex, newIndex);
    setLinks(reordered);

    try {
      await reorderBoardLinks(eventId, reordered.map((l) => l.id));
    } catch {
      toast.error("Nie uda\u0142o si\u0119 zmieni\u0107 kolejno\u015bci");
    }
  };

  const getIcon = (iconName: string | null) => {
    const found = ICON_OPTIONS.find((o) => o.value === iconName);
    const IconComponent = found?.icon ?? Link2;
    return <IconComponent className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-olive" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Linki na stronie eventu</CardTitle>
        <Button size="sm" onClick={handleAdd} disabled={saving}>
          <Plus className="mr-1 h-4 w-4" />
          Dodaj link
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-ink-muted mb-4">
          Linki wy\u015bwietlane na publicznej stronie eventu. Go\u015bcie zobacz\u0105 je jako przyciski z ikonami.
        </p>

        {links.length === 0 ? (
          <p className="text-ink-muted text-sm py-4 text-center">
            Brak link\u00f3w. Kliknij &quot;Dodaj link&quot;, aby doda\u0107 pierwszy.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={links.map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {links.map((link) => (
                  <SortableLinkRow
                    key={link.id}
                    link={link}
                    handleUpdate={handleUpdate}
                    handleDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
