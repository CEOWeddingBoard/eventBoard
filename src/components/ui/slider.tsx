"use client"

import * as React from "react"

interface SliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  min: number
  max: number
  step: number
  className?: string
}

export function Slider({ value, onValueChange, min, max, step, className }: SliderProps) {
  const [localValue, setLocalValue] = React.useState(value[0])
  const percentage = ((localValue - min) / (max - min)) * 100

  React.useEffect(() => {
    setLocalValue(value[0])
  }, [value[0]])

  return (
    <div className={`relative w-full h-5 flex items-center ${className || ""}`}>
      <div className="absolute inset-x-0 h-2 rounded-full bg-olive/15">
        <div
          className="h-full rounded-full bg-olive/40 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={localValue}
        onChange={(e) => {
          const v = Number(e.target.value)
          setLocalValue(v)
          onValueChange([v])
        }}
        className="absolute inset-x-0 w-full h-5 opacity-0 cursor-pointer"
      />
    </div>
  )
}
