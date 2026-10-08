import type { Metadata } from "next";
import { markAllNotificationsRead } from "@/actions/notifications";
import { NotificationItem } from "@/components/notification-item";
import { Button } from "@/components/ui";
import { getCurrentProfile, getNotifications } from "@/lib/data";

export const metadata: Metadata = { title: "Notificări", robots: { index: false } };

const fmt = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bucharest" });

export default async function NotificationsPage() {
  const profile = (await getCurrentProfile())!;
  const items = await getNotifications(profile.id);
  const unread = items.filter((n) => !n.read_at).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Cont</p>
          <h1 className="font-display mt-2 text-5xl font-medium">Notificări</h1>
        </div>
        {unread > 0 ? (
          <form action={markAllNotificationsRead}><Button type="submit" variant="ghost">Marchează toate ca citite</Button></form>
        ) : null}
      </div>
      {items.length > 0 ? (
        <ul className="mt-10 space-y-3">
          {items.map((n) => (
            <li key={n.id}><NotificationItem n={n} when={fmt.format(new Date(n.created_at))} /></li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 rounded-3xl border border-dashed border-line p-14 text-center text-muted">Nu ai notificări.</p>
      )}
    </div>
  );
}
