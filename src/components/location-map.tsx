import { contact, directions } from "@/content/site";

export function LocationMap() {
  const q = encodeURIComponent(directions.mapQuery);
  return (
    <div className="overflow-hidden rounded-[2rem] border border-line bg-card">
      <div className="relative aspect-[16/10] bg-ink sm:aspect-[16/7]">
        <iframe
          title="Harta cu locația Dental Masters Academy"
          src={`https://www.google.com/maps?q=${q}&output=embed`}
          className="absolute inset-0 size-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8">
        <div>
          <p className="font-display text-xl">{contact.address}</p>
          {directions.parking ? <p className="mt-2 text-sm text-muted"><strong className="text-foreground">Parcare:</strong> {directions.parking}</p> : null}
          {directions.transport ? <p className="mt-1 text-sm text-muted"><strong className="text-foreground">Transport în comun:</strong> {directions.transport}</p> : null}
        </div>
        <div className="flex gap-2">
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${q}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-ink-2">Google Maps</a>
          <a href={`https://waze.com/ul?q=${q}&navigate=yes`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-full border border-line px-5 text-sm font-medium hover:border-foreground/30">Waze</a>
        </div>
      </div>
    </div>
  );
}
