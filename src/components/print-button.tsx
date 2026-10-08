"use client";

import { Button } from "@/components/ui";

export function PrintButton() {
  return <Button type="button" onClick={() => window.print()}>Printează sau salvează PDF</Button>;
}
