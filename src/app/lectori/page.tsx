import { tr, getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import Link from "@/components/locale-link";
import { Container } from "@/components/ui";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { TrainerAvatar } from "@/components/trainer-avatar";
import { getTrainers } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  await getLocale();
  return { title: tr("Lectorii noștri"), description: tr("Echipa de lectori Dental Masters Academy: clinicieni care practică zilnic ceea ce predau.") };
}

export default async function TrainersPage() {
  const trainers = (await getTrainers()).filter((t) => !t.is_founder);
  return (
    <>
      <PageHero eyebrow={tr("Lectorii noștri")} title={tr("Clinicieni care practică ceea ce predau.")} lead={tr("Echipa de lectori care completează programul academiei, alături de fondatorii Dr. Ovidiu Dumitru și Dr. Gabriel Mușețescu.")} />
      <section className="py-20">
        <Container>
          <ul className="grid gap-6 lg:grid-cols-3">
            {trainers.length === 0 ? <li className="rounded-3xl border border-dashed border-line p-12 text-center text-muted lg:col-span-3">{tr("Lectorii vor fi afișați aici.")}</li> : null}
            {trainers.map((t, i) => (
              <Reveal as="li" key={t.id} delay={i * 90}>
                <Link href={`/lectori/${t.slug}`} className="group flex h-full flex-col rounded-[2rem] border border-line bg-card p-8 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-30px_rgba(8,13,23,0.45)]">
                  <TrainerAvatar name={t.name} photo={t.photo_url} size={96} />
                  <h2 className="font-display mt-6 text-2xl leading-tight">{t.name}</h2>
                  <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted">{t.role}</p>
                  {t.expertise.length ? <p className="mt-3 text-xs leading-relaxed text-muted">{tr("Expertiză:")}{" "}{t.expertise.slice(0, 3).join(", ")}</p> : null}
                  <span className="mt-auto pt-6 text-sm font-medium text-gold">{tr("Vezi profilul")}</span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
