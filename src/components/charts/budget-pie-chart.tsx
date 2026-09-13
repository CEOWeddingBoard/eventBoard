"use client"

import { formatCurrency } from "@/lib/utils"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

const COLORS = ["#6b7b5e", "#8ea596", "#d4c596", "#c9a24d", "#e8dedb"];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}
const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-olive/20 bg-wedding-card p-3 shadow-soft">
        <p className="font-serif text-base text-ink">{`${payload[0].name}`}</p>
        <p className="text-sm text-ink-muted">{`Koszt: ${formatCurrency(payload[0].value)}`}</p>
      </div>
    )
  }
  return null
}

interface BudgetItem {
  category: string;
  estimated: number | string;
}
export function BudgetPieChart({ data }: { data: BudgetItem[] }) {
  // Group by category and sum estimated costs
  const chartData = data.reduce((acc: Array<{ name: string; value: number }>, item) => {
    const existing = acc.find(i => i.name === item.category);
    if (existing) {
      existing.value += Number(item.estimated);
    } else {
      acc.push({ name: item.category, value: Number(item.estimated) });
    }
    return acc;
  }, []);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Tooltip content={<CustomTooltip />} />
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={110}
          innerRadius={70} // Creates the donut shape
          fill="#8884d8"
          dataKey="value"
          stroke="none"
          paddingAngle={5}
        >
          {chartData.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )
}
