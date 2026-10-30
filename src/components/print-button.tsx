"use client";

import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui";

export function PrintButton() {
  const tr = useT();
  return <Button type="button" onClick={() => window.print()}>{tr("Printează sau salvează PDF")}</Button>;
}
