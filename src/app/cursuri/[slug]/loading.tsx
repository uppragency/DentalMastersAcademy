import { Container } from "@/components/ui";
import { LoadingRegion, Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Se încarcă cursul">
      <Skeleton className="h-[22rem] w-full rounded-none sm:h-[28rem]" />
      <Container className="py-10 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_24rem]">
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full max-w-2xl" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-11/12" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="mt-8 h-48 w-full" />
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </Container>
    </LoadingRegion>
  );
}
