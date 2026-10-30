"use client";

import { useT } from "@/lib/i18n/client";
import { useState } from "react";
import { Button } from "@/components/ui";

export function CopyButton({ value, label = tr("Copiază linkul") }: { value: string; label?: string }) {
  const tr = useT();
  const [done, setDone] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      className="min-h-10 px-5"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {done ? tr("Copiat") : tr(label)}
    </Button>
  );
}
