import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data";

/** Pages for full administrators only. Operators are sent back to the dashboard. */
export default async function FullAdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/admin");
  return children;
}
