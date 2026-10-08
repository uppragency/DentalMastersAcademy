"use client";

import { useEffect } from "react";

/** Applies the theme saved in the account on a device that has no local choice yet. */
export function ThemeSync({ theme }: { theme: "light" | "dark" | null | undefined }) {
  useEffect(() => {
    if (!theme) return;
    try {
      if (localStorage.getItem("dma-theme")) return;
      localStorage.setItem("dma-theme", theme);
    } catch { /* storage unavailable */ }
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return null;
}
