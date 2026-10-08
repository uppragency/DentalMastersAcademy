import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { TrainerAvatar } from "@/components/trainer-avatar";
import { getTrainers } from "@/lib/data";

export const metadata: Metadata = { title: "Lectori", description: "Clinicieni care practică zilnic implantologia, parodontologia și protetica pe care le predau." };

export default async function TrainersPage() {
  const trainers = await getTrainers();
  return (
    <>
      <PageHero eyebrow="Lectori" title="Clinicieni care practică ceea ce predau." lead="Toți lectorii Dental Masters Academy lucrează zilnic în clinică și predau în grupuri de maximum 20 de participanți." />
      <section className="py-20">
        <Container>
          <ul className="grid gap-6 lg:grid-cols-3">
            {trainers.map((t, i) => (
              <Reveal as="li" key={t.id} delay={i * 90}>
                <Link href={`/lectori/${t.slug}`} className="group flex h-full flex-col rounded-[2rem] border border-line bg-card p-8 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-30px_rgba(8,13,23,0.45)]">
                  <TrainerAvatar name={t.name} photo={t.photo_url} size={96} />
                  <h2 className="font-display mt-6 text-2xl leading-tight">{t.name}</h2>
                  <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted">{t.role}</p>
                  <span className="mt-auto pt-6 text-sm font-medium text-gold">Vezi profilul</span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
