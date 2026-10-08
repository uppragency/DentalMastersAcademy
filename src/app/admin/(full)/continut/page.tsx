import type { Metadata } from "next";
import { BankEditor, FaqEditor, LegalEditor, PartnersEditor } from "@/components/content-editor-forms";
import { requireFullAdmin } from "@/lib/staff";
import { faqs as defaultFaqs } from "@/content/site";

export const metadata: Metadata = { title: "Conținut site | Administrare", robots: { index: false } };

export default async function ContentPage() {
  const { admin } = await requireFullAdmin();
  const { data } = await admin.from("site_content").select("key, value");
  const v = new Map((data ?? []).map((r) => [r.key, r.value]));
  const faqs = (Array.isArray(v.get("faqs")) && (v.get("faqs") as unknown[]).length ? v.get("faqs") : defaultFaqs) as { q: string; a: string }[];
  const faqText = faqs.map((f) => `${f.q}\n${f.a}`).join("\n\n");
  const partners = (Array.isArray(v.get("partners")) ? (v.get("partners") as string[]) : []).join("\n");
  const text = (k: string) => (typeof v.get(k) === "string" ? (v.get(k) as string) : "");

  return (
    <div className="max-w-3xl space-y-14">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Conținut site</h1>
        <p className="mt-2 text-sm text-muted">Modificările apar imediat pe site, fără publicare nouă. Fiecare salvare este înregistrată în Jurnal modificări.</p>
      </div>
      <FaqEditor value={faqText} />
      <PartnersEditor value={partners} />
      <BankEditor value={text("private:bank")} />
      <section className="space-y-10 border-t border-line pt-10">
        <h2 className="text-2xl font-semibold tracking-tight">Texte legale</h2>
        <LegalEditor k="legal_termeni" label="Termeni și condiții" value={text("legal_termeni")} />
        <LegalEditor k="legal_confidentialitate" label="Politica de confidențialitate" value={text("legal_confidentialitate")} />
        <LegalEditor k="legal_rambursare" label="Politica de rambursare și transfer de loc (înlocuiește pagina implicită)" value={text("legal_rambursare")} />
        <LegalEditor k="legal_cookies" label="Politica de cookies (înlocuiește pagina implicită)" value={text("legal_cookies")} />
      </section>
    </div>
  );
}
