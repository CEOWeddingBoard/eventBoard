"use client"

import { useState, useEffect } from "react"

export function useIsPrinting() {
  const [isPrinting, setIsPrinting] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('print')
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsPrinting(e.matches)
    }
    
    // Check initial state
    handleChange(mediaQuery)
    
    // Listen for changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange)
    }
    
    // Also listen to beforeprint/afterprint events
    const handleBeforePrint = () => setIsPrinting(true)
    const handleAfterPrint = () => setIsPrinting(false)
    
    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
      window.removeEventListener('beforeprint', handleBeforePrint)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [])

  return isPrinting
}
