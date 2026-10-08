"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-fetches the server component every few seconds, up to a limit (e.g. while waiting for a payment webhook). */
export function AutoRefresh({ everyMs = 3000, max = 12 }: { everyMs?: number; max?: number }) {
  const router = useRouter();
  useEffect(() => {
    let n = 0;
    const t = setInterval(() => {
      n++;
      router.refresh();
      if (n >= max) clearInterval(t);
    }, everyMs);
    return () => clearInterval(t);
  }, [router, everyMs, max]);
  return null;
}
