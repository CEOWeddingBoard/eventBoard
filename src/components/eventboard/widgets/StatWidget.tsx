"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { updateEventWidgetData } from "@/lib/actions/event-widget.actions";

type StatData = {
  value: string;
  label: string;
  trend: "up" | "down" | "neutral";
  unit: string;
};

const DEFAULTS: StatData = { value: "0", label: "Wartość", trend: "neutral", unit: "" };

export function StatWidget({ widgetId, dataJson }: { widgetId: string; dataJson: string }) {
  const parsed = (() => { try { return { ...DEFAULTS, ...JSON.parse(dataJson || "{}") }; } catch { return DEFAULTS; } })();
  const [data, setData] = useState<StatData>(parsed);
  const [saving, setSaving] = useState(false);

  const update = async (next: Partial<StatData>) => {
    const merged = { ...data, ...next };
    setData(merged);
    setSaving(true);
    try { await updateEventWidgetData(widgetId, JSON.stringify(merged)); }
    finally { setSaving(false); }
  };

  const trendIcon = data.trend === "up"
    ? <TrendingUp className="h-4 w-4 text-emerald-500" />
    : data.trend === "down"
    ? <TrendingDown className="h-4 w-4 text-red-400" />
    : <Minus className="h-4 w-4 text-slate-400" />;

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1">
        <p className="text-4xl font-bold text-slate-900 leading-none">{data.value}</p>
        {data.unit && <span className="text-lg text-slate-500 mb-0.5">{data.unit}</span>}
        <span className="ml-1 mb-0.5">{trendIcon}</span>
      </div>
      <p className="text-sm text-slate-500">{data.label}</p>

      <div className="grid gap-2 sm:grid-cols-3 border-t border-slate-100 pt-3">
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Wartość</label>
          <Input
            value={data.value}
            onChange={(e) => update({ value: e.target.value })}
            className="h-8 text-sm"
            placeholder="np. 120"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Jednostka</label>
          <Input
            value={data.unit}
            onChange={(e) => update({ unit: e.target.value })}
            className="h-8 text-sm"
            placeholder="os., zł, szt."
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Trend</label>
          <div className="flex gap-1">
            {(["up", "neutral", "down"] as const).map((t) => (
              <button
                key={t}
                onClick={() => update({ trend: t })}
                className={`flex-1 rounded border text-xs py-1.5 transition-colors ${
                  data.trend === t ? "border-slate-800 bg-slate-900 text-white" : "border-slate-200 text-slate-500 hover:border-slate-400"
                }`}
              >
                {t === "up" ? "↑" : t === "down" ? "↓" : "–"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Opis / etykieta</label>
        <Input
          value={data.label}
          onChange={(e) => update({ label: e.target.value })}
          className="h-8 text-sm"
          placeholder="np. Liczba gości"
        />
      </div>
      {saving && <p className="text-xs text-slate-400 text-right">Zapisywanie...</p>}
    </div>
  );
}
