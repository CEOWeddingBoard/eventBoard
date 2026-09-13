"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  {
    name: "Venue",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Music",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Photo",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Decor",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Attire",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: "Other",
    total: Math.floor(Math.random() * 5000) + 1000,
  },
]

export function BudgetChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#5e5852"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#5e5852"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          cursor={{ fill: 'rgba(107, 123, 94, 0.1)' }}
          contentStyle={{
            background: "rgba(255, 255, 255, 0.9)",
            border: "1px solid rgba(201, 162, 77, 0.15)",
            borderRadius: "0.5rem",
            boxShadow: "0 10px 20px -5px rgba(47, 43, 38, 0.1)",
            fontFamily: "var(--font-body)",
          }}
        />
        <Bar dataKey="total" fill="#6b7b5e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
