"use client";

import Link from "next/link";
import { useTransition } from "react";
import { markNotificationRead } from "@/actions/notifications";
import type { Notification } from "@/lib/types";

const icons: Record<string, string> = {
  enrollment: "M5 13l4 4L19 7",
  gold: "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.600 6.600 19.500l1.200-6L3.300 9.300l6.100-.7z",
  welcome: "M4 12l16-8-6 16-3-7z",
  info: "M12 8v5m0 3h.01",
};

export function NotificationItem({ n, when }: { n: Notification; when: string }) {
  const [pending, start] = useTransition();
  const unread = !n.read_at;
  const body = (
    <>
      <span aria-hidden="true" className={`flex size-11 shrink-0 items-center justify-center rounded-full ${unread ? "bg-gold text-white" : "bg-line text-muted"}`}>
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={icons[n.kind] ?? icons.info} /></svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block ${unread ? "font-semibold" : "font-medium"}`}>{n.title}</span>
        {n.body ? <span className="mt-0.5 block text-sm text-muted">{n.body}</span> : null}
        <span className="mt-2 block text-xs text-muted">{when}</span>
      </span>
      {unread ? <span aria-label="Necitită" className="mt-2 size-2.5 shrink-0 rounded-full bg-gold" /> : null}
    </>
  );
  const cls = `flex items-start gap-4 rounded-3xl border p-5 transition-colors ${unread ? "border-gold/40 bg-gold-soft/50" : "border-line bg-card"} ${pending ? "opacity-60" : ""}`;

  return n.href ? (
    <Link href={n.href} onClick={() => unread && start(() => markNotificationRead(n.id))} className={`${cls} hover:border-foreground/30`}>{body}</Link>
  ) : (
    <button type="button" onClick={() => unread && start(() => markNotificationRead(n.id))} className={`${cls} w-full text-left`}>{body}</button>
  );
}
