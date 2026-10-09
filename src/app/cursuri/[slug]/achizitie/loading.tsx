import { Container } from "@/components/ui";
import { LoadingRegion, Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Se încarcă comanda">
      <Container className="py-10 sm:py-16">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-10 w-full max-w-md" />
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_26rem]">
          <div className="space-y-5">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            <Skeleton className="h-14 w-full rounded-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </Container>
    </LoadingRegion>
  );
}
