"use client";

import { useEffect } from "react";

export function PwaRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then(() => {
            // SW registered
          })
          .catch(() => {
            // SW registration failed — non-critical
          });
      });
    }
  }, []);

  return null;
}
