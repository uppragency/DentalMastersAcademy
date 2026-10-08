import type { Metadata } from "next";
import { LoyaltyForm } from "@/components/admin-forms";
import { getLoyaltySettings } from "@/lib/data";

export const metadata: Metadata = { title: "Program Gold | Administrare", robots: { index: false } };

export default async function AdminGold() {
  const settings = await getLoyaltySettings();
  if (!settings) return <p>Setările Gold lipsesc din baza de date.</p>;
  return (
    <div className="max-w-2xl">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Program Gold</h1>
      <LoyaltyForm settings={settings} />
    </div>
  );
}
