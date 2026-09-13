"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Type,
  Image as ImageIcon,
  Table,
  Columns,
  Minus,
  FileMinus,
  Heading,
  GripVertical,
  Trash2,
  Plus,
  Save,
  ArrowLeft,
} from "lucide-react";
import {
  createAgendaDocumentTemplate,
  updateAgendaDocumentTemplate,
} from "@/lib/actions/agenda-document-template.actions";
import { toast } from "sonner";

type BlockType = "header" | "section" | "text" | "columns" | "table" | "image" | "spacer" | "pagebreak";

type Slot = {
  id: string;
  fieldKey?: string;
  placeholder?: string;
  llmPrompt?: string;
  style?: any;
};

type DataField = { key: string; label: string; group: string };

const DATA_FIELDS: DataField[] = [
  { key: "event.name", label: "Nazwa eventu", group: "Event" },
  { key: "event.date", label: "Data eventu", group: "Event" },
  { key: "event.estimatedGuestCount", label: "Liczba gości", group: "Event" },
  { key: "event.organizerName", label: "Organizator", group: "Event" },
  { key: "event.responsiblePerson", label: "Osoba odpowiedzialna", group: "Event" },
  { key: "event.occasionLabel", label: "Okazja", group: "Event" },
  { key: "event.scenarioNotes", label: "Notatki organizatora", group: "Notatki" },
  { key: "event.description", label: "Opis eventu", group: "Notatki" },
  { key: "event.menuVariants", label: "Menu", group: "Menu" },
  { key: "event.dayScheduleItems", label: "Harmonogram", group: "Agenda" },
  { key: "event.guests", label: "Lista gości", group: "Goście" },
];

type Block = {
  id: string;
  type: BlockType;
  props: any;
  slots: Slot[];
};

type Page = {
  blocks: Block[];
};

type DocumentSettings = {
  pageFormat: "A4" | "Letter";
  orientation: "portrait" | "landscape";
  margins: { top: number; right: number; bottom: number; left: number };
  fonts: { heading: string; body: string };
  colors: { primary: string; secondary: string; text: string };
};

const BLOCK_PALETTE = [
  { type: "header" as BlockType, icon: Heading, label: "Nagłówek" },
  { type: "section" as BlockType, icon: Type, label: "Sekcja" },
  { type: "text" as BlockType, icon: Type, label: "Tekst" },
  { type: "columns" as BlockType, icon: Columns, label: "Kolumny" },
  { type: "table" as BlockType, icon: Table, label: "Tabela" },
  { type: "image" as BlockType, icon: ImageIcon, label: "Obraz" },
  { type: "spacer" as BlockType, icon: Minus, label: "Odstęp" },
  { type: "pagebreak" as BlockType, icon: FileMinus, label: "Nowa strona" },
];

function createBlock(type: BlockType): Block {
  const id = `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  switch (type) {
    case "header":
      return {
        id,
        type,
        props: { title: "Tytuł dokumentu", subtitle: "Podtytuł" },
        slots: [
          { id: `${id}_title`, placeholder: "Tytuł" },
          { id: `${id}_subtitle`, placeholder: "Podtytuł" },
        ],
      };
    case "section":
      return {
        id,
        type,
        props: { title: "Nazwa sekcji" },
        slots: [{ id: `${id}_title`, placeholder: "Nazwa sekcji" }],
      };
    case "text":
      return {
        id,
        type,
        props: { content: "" },
        slots: [{ id: `${id}_content`, placeholder: "Treść" }],
      };
    case "columns":
      return {
        id,
        type,
        props: { count: 2 },
        slots: [
          { id: `${id}_col1`, placeholder: "Kolumna 1" },
          { id: `${id}_col2`, placeholder: "Kolumna 2" },
        ],
      };
    case "table":
      return {
        id,
        type,
        props: { rows: 3, cols: 3 },
        slots: [],
      };
    case "image":
      return {
        id,
        type,
        props: { width: "100%", height: "200px" },
        slots: [{ id: `${id}_image`, placeholder: "Obraz" }],
      };
    case "spacer":
      return {
        id,
        type,
        props: { height: "20px" },
        slots: [],
      };
    case "pagebreak":
      return {
        id,
        type,
        props: {},
        slots: [],
      };
  }
}

export default function DocumentTemplateBuilder({
  templateId,
  initialData,
  locale = "pl",
}: {
  templateId?: string;
  initialData?: any;
  locale?: string;
}) {
  const router = useRouter();
  const listPath = `/${locale}/app/settings/document-templates`;
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [pages, setPages] = useState<Page[]>(
    initialData?.pages || [{ blocks: [] }]
  );
  const [settings] = useState<DocumentSettings>(
    initialData?.settings || {
      pageFormat: "A4",
      orientation: "portrait",
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      fonts: { heading: "Arial", body: "Arial" },
      colors: { primary: "#000000", secondary: "#666666", text: "#333333" },
    }
  );
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [draggedDataField, setDraggedDataField] = useState<DataField | null>(null);

  const handleDragStart = (e: React.DragEvent, type: BlockType) => {
    e.dataTransfer.setData("blockType", type);
  };

  const handleDrop = (e: React.DragEvent, pageIndex: number, insertIndex?: number) => {
    e.preventDefault();
    const blockType = e.dataTransfer.getData("blockType") as BlockType;
    if (!blockType) return;

    const newBlock = createBlock(blockType);
    const newPages = [...pages];
    const page = newPages[pageIndex];
    
    if (insertIndex !== undefined) {
      page.blocks.splice(insertIndex, 0, newBlock);
    } else {
      page.blocks.push(newBlock);
    }
    
    setPages(newPages);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDataFieldDragStart = (field: DataField) => {
    setDraggedDataField(field);
  };

  const handleBlockSelect = (block: Block) => {
    setSelectedBlock(block);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot);
  };

  const handleBlockUpdate = (blockId: string, updates: Partial<Block>) => {
    const newPages = pages.map((page) => ({
      ...page,
      blocks: page.blocks.map((block) =>
        block.id === blockId ? { ...block, ...updates } : block
      ),
    }));
    setPages(newPages);
    if (selectedBlock?.id === blockId) {
      setSelectedBlock({ ...selectedBlock, ...updates });
    }
  };

  const handleSlotUpdate = (blockId: string, slotId: string, updates: Partial<Slot>) => {
    const newPages = pages.map((page) => ({
      ...page,
      blocks: page.blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              slots: block.slots.map((slot) =>
                slot.id === slotId ? { ...slot, ...updates } : slot
              ),
            }
          : block
      ),
    }));
    setPages(newPages);
    if (selectedSlot?.id === slotId) {
      setSelectedSlot({ ...selectedSlot, ...updates });
    }
  };

  const handleSlotDrop = (blockId: string, slotId: string) => {
    if (!draggedDataField) return;
    handleSlotUpdate(blockId, slotId, {
      fieldKey: draggedDataField.key,
      placeholder: draggedDataField.label,
    });
    setDraggedDataField(null);
  };

  const handleBlockDelete = (blockId: string) => {
    const newPages = pages.map((page) => ({
      ...page,
      blocks: page.blocks.filter((block) => block.id !== blockId),
    }));
    setPages(newPages);
    if (selectedBlock?.id === blockId) {
      setSelectedBlock(null);
      setSelectedSlot(null);
    }
  };

  const handleAddPage = () => {
    setPages([...pages, { blocks: [] }]);
    setCurrentPage(pages.length);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Podaj nazwę szablonu");
      return;
    }

    setSaving(true);
    try {
      if (templateId) {
        await updateAgendaDocumentTemplate(templateId, {
          name,
          description,
          pages,
          settings,
        });
        toast.success("Szablon zaktualizowany");
      } else {
        await createAgendaDocumentTemplate({
          name,
          description,
          pages,
          settings,
        });
        toast.success("Szablon utworzony");
      }
      router.push(listPath);
    } catch (error) {
      toast.error("Błąd zapisu");
    } finally {
      setSaving(false);
    }
  };

  const renderBlock = (block: Block) => {
    const isSelected = selectedBlock?.id === block.id;
    
    return (
      <div
        key={block.id}
        className={`relative p-4 mb-2 border-2 rounded cursor-pointer transition-colors ${
          isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
        }`}
        onClick={() => handleBlockSelect(block)}
      >
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleBlockDelete(block.id);
            }}
            className="p-1 hover:bg-red-100 rounded"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>

        {block.type === "header" && (
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">{block.props.title}</div>
            <div className="text-sm text-gray-600">{block.props.subtitle}</div>
            {block.slots.map((slot) => (
              <div
                key={slot.id}
                className={`mt-2 p-2 border-2 border-dashed rounded cursor-pointer ${
                  selectedSlot?.id === slot.id ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSlotSelect(slot);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleSlotDrop(block.id, slot.id); }}
              >
                <div className="text-xs text-gray-500">Slot: {slot.placeholder}</div>
                {slot.fieldKey && <div className="text-xs text-blue-600">Pole: {slot.fieldKey}</div>}
              </div>
            ))}
          </div>
        )}

        {block.type === "section" && (
          <div>
            <div className="text-lg font-semibold mb-2">{block.props.title}</div>
            {block.slots.map((slot) => (
              <div
                key={slot.id}
                className={`p-2 border-2 border-dashed rounded cursor-pointer ${
                  selectedSlot?.id === slot.id ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSlotSelect(slot);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleSlotDrop(block.id, slot.id); }}
              >
                <div className="text-xs text-gray-500">Slot: {slot.placeholder}</div>
                {slot.fieldKey && <div className="text-xs text-blue-600">Pole: {slot.fieldKey}</div>}
              </div>
            ))}
          </div>
        )}

        {block.type === "text" && (
          <div>
            {block.slots.map((slot) => (
              <div
                key={slot.id}
                className={`p-2 border-2 border-dashed rounded cursor-pointer min-h-[60px] ${
                  selectedSlot?.id === slot.id ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSlotSelect(slot);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleSlotDrop(block.id, slot.id); }}
              >
                <div className="text-xs text-gray-500">Slot: {slot.placeholder}</div>
                {slot.fieldKey && <div className="text-xs text-blue-600">Pole: {slot.fieldKey}</div>}
              </div>
            ))}
          </div>
        )}

        {block.type === "columns" && (
          <div className={`grid gap-4 ${block.props.count === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
            {block.slots.map((slot) => (
              <div
                key={slot.id}
                className={`p-2 border-2 border-dashed rounded cursor-pointer min-h-[80px] ${
                  selectedSlot?.id === slot.id ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSlotSelect(slot);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleSlotDrop(block.id, slot.id); }}
              >
                <div className="text-xs text-gray-500">Slot: {slot.placeholder}</div>
                {slot.fieldKey && <div className="text-xs text-blue-600">Pole: {slot.fieldKey}</div>}
              </div>
            ))}
          </div>
        )}

        {block.type === "table" && (
          <div className="border border-gray-300 rounded">
            <div className="bg-gray-100 p-2 text-xs font-semibold">Tabela {block.props.rows}x{block.props.cols}</div>
            <div className="p-2 text-xs text-gray-500">Przeciągnij pola do komórek tabeli</div>
          </div>
        )}

        {block.type === "image" && (
          <div
            className="border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50"
            style={{ height: block.props.height }}
          >
            {block.slots.map((slot) => (
              <div
                key={slot.id}
                className={`p-4 text-center cursor-pointer ${
                  selectedSlot?.id === slot.id ? "bg-blue-50" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSlotSelect(slot);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleSlotDrop(block.id, slot.id); }}
              >
                <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <div className="text-xs text-gray-500">Slot: {slot.placeholder}</div>
                {slot.fieldKey && <div className="text-xs text-blue-600">Pole: {slot.fieldKey}</div>}
              </div>
            ))}
          </div>
        )}

        {block.type === "spacer" && (
          <div style={{ height: block.props.height }} className="bg-gray-100 rounded flex items-center justify-center">
            <div className="text-xs text-gray-500">Odstęp: {block.props.height}</div>
          </div>
        )}

        {block.type === "pagebreak" && (
          <div className="border-t-2 border-dashed border-gray-400 py-2 text-center">
            <div className="text-xs text-gray-500">--- Nowa strona ---</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* Header */}
      <div className="border-b bg-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(listPath)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Wróć
          </Button>
          <div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nazwa szablonu"
              className="font-semibold text-lg"
            />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opis szablonu (opcjonalnie)"
              className="mt-1 h-7 w-72 text-xs"
            />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Zapisywanie..." : "Zapisz"}
        </Button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0 flex-col overflow-auto lg:flex-row lg:overflow-hidden">
        {/* Left panel - Block palette */}
        <div className="w-full shrink-0 border-b bg-gray-50 p-4 lg:w-64 lg:border-b-0 lg:border-r lg:overflow-y-auto">
          <h3 className="font-semibold mb-3">Bloki</h3>
          <div className="space-y-2">
            {BLOCK_PALETTE.map((item) => (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => handleDragStart(e, item.type)}
                className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded cursor-move hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
                <GripVertical className="w-4 h-4 ml-auto text-gray-400" />
              </div>
            ))}
          </div>

          <h3 className="font-semibold mt-6 mb-1">Dane do wstawienia</h3>
          <p className="text-[11px] text-gray-500 mb-2">Przeciągnij pole na przerywane miejsce na kartce.</p>
          <div className="space-y-1">
            {DATA_FIELDS.map((field) => (
              <div
                key={field.key}
                draggable
                onDragStart={() => handleDataFieldDragStart(field)}
                className="rounded border border-blue-200 bg-white px-2 py-2 text-xs text-blue-900 cursor-grab active:cursor-grabbing hover:bg-blue-50"
                title={field.key}
              >
                <span className="font-medium">{field.label}</span>
                <span className="block text-[10px] text-blue-500">{field.key}</span>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-3">Strony</h3>
            <div className="space-y-1">
              {pages.map((page, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx)}
                  className={`w-full text-left p-2 rounded text-sm ${
                    currentPage === idx ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                  }`}
                >
                  Strona {idx + 1} ({page.blocks.length} bloków)
                </button>
              ))}
              <Button variant="outline" size="sm" className="w-full mt-2" onClick={handleAddPage}>
                <Plus className="w-4 h-4 mr-2" />
                Dodaj stronę
              </Button>
            </div>
          </div>
        </div>

        {/* Center - Document canvas */}
        <div className="min-w-0 flex-1 overflow-auto bg-gray-100 p-3 sm:p-5 lg:p-8">
          <div
            className="mx-auto min-h-[600px] w-full bg-white shadow-lg"
            style={{
              maxWidth: settings.orientation === "portrait" ? "820px" : "1040px",
              minHeight: settings.orientation === "portrait" ? "1050px" : "720px",
              padding: `${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm`,
            }}
            onDrop={(e) => handleDrop(e, currentPage)}
            onDragOver={handleDragOver}
          >
            {pages[currentPage].blocks.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <p className="text-lg mb-2">Przeciągnij bloki tutaj</p>
                  <p className="text-sm">Wybierz blok z panelu po lewej</p>
                </div>
              </div>
            ) : (
              pages[currentPage].blocks.map((block) => renderBlock(block))
            )}
          </div>
        </div>

        {/* Right panel - Properties (only when a block is selected) */}
        {selectedBlock && (
          <div className="w-full shrink-0 border-t bg-white p-4 lg:w-80 lg:border-l lg:border-t-0 lg:overflow-y-auto">
            <div>
              <h3 className="font-semibold mb-4">Właściwości bloku</h3>
              
              {selectedBlock.type === "header" && (
                <div className="space-y-3">
                  <div>
                    <Label>Tytuł</Label>
                    <Input
                      value={selectedBlock.props.title}
                      onChange={(e) =>
                        handleBlockUpdate(selectedBlock.id, {
                          props: { ...selectedBlock.props, title: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Podtytuł</Label>
                    <Input
                      value={selectedBlock.props.subtitle}
                      onChange={(e) =>
                        handleBlockUpdate(selectedBlock.id, {
                          props: { ...selectedBlock.props, subtitle: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {selectedBlock.type === "section" && (
                <div>
                  <Label>Nazwa sekcji</Label>
                  <Input
                    value={selectedBlock.props.title}
                    onChange={(e) =>
                      handleBlockUpdate(selectedBlock.id, {
                        props: { ...selectedBlock.props, title: e.target.value },
                      })
                    }
                  />
                </div>
              )}

              {selectedBlock.type === "columns" && (
                <div>
                  <Label>Liczba kolumn</Label>
                  <select
                    value={selectedBlock.props.count}
                    onChange={(e) =>
                      handleBlockUpdate(selectedBlock.id, {
                        props: { ...selectedBlock.props, count: parseInt(e.target.value) },
                      })
                    }
                    className="w-full p-2 border rounded"
                  >
                    <option value={2}>2 kolumny</option>
                    <option value={3}>3 kolumny</option>
                  </select>
                </div>
              )}

              {selectedBlock.type === "spacer" && (
                <div>
                  <Label>Wysokość (px)</Label>
                  <Input
                    type="number"
                    value={parseInt(selectedBlock.props.height)}
                    onChange={(e) =>
                      handleBlockUpdate(selectedBlock.id, {
                        props: { ...selectedBlock.props, height: `${e.target.value}px` },
                      })
                    }
                  />
                </div>
              )}

              {selectedSlot && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-3">Właściwości slotu</h4>
                  <div className="space-y-3">
                    <div>
                      <Label>Klucz pola</Label>
                      <Input
                        value={selectedSlot.fieldKey || ""}
                        onChange={(e) =>
                          handleSlotUpdate(selectedBlock.id, selectedSlot.id, {
                            fieldKey: e.target.value,
                          })
                        }
                        placeholder="np. event.name"
                      />
                    </div>
                    <div>
                      <Label>Placeholder</Label>
                      <Input
                        value={selectedSlot.placeholder || ""}
                        onChange={(e) =>
                          handleSlotUpdate(selectedBlock.id, selectedSlot.id, {
                            placeholder: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Prompt LLM</Label>
                      <Textarea
                        value={selectedSlot.llmPrompt || ""}
                        onChange={(e) =>
                          handleSlotUpdate(selectedBlock.id, selectedSlot.id, {
                            llmPrompt: e.target.value,
                          })
                        }
                        placeholder="Opisz co LLM powinien wygenerować..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
