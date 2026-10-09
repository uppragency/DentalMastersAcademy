import { Container } from "@/components/ui";
import { LoadingRegion, Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Se încarcă cursurile">
      <Container className="py-14 sm:py-24">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-5 h-12 w-full max-w-xl" />
        <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-line bg-card p-4">
              <Skeleton className="aspect-[4/3] w-full" />
              <Skeleton className="mt-5 h-5 w-3/4" />
              <Skeleton className="mt-3 h-4 w-1/2" />
              <Skeleton className="mt-6 h-7 w-1/3" />
            </div>
          ))}
        </div>
      </Container>
    </LoadingRegion>
  );
}
