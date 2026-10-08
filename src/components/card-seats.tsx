import { Seats } from "@/components/seats";
import { getSeatCounts } from "@/lib/data";

export async function CardSeats({ courseId, capacity }: { courseId: string; capacity: number }) {
  const counts = await getSeatCounts();
  return <Seats taken={counts[courseId] ?? 0} capacity={capacity} />;
}
