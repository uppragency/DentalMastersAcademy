"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { loadLatestNotifications, markAllNotificationsRead, markNotificationRead } from "@/actions/notifications";
import type { Notification } from "@/lib/types";

const fmt = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bucharest" });

export function NotificationBell({ unread }: { unread: number }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<Notification[] | null>(null);
  const [count, setCount] = useState(unread);
  const [, start] = useTransition();


  const open = () => {
    ref.current?.showModal();
    start(async () => setItems((await loadLatestNotifications()) as Notification[]));
  };
  const close = () => ref.current?.close();
  const readOne = (n: Notification) => {
    if (n.read_at) return;
    setItems((cur) => cur?.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)) ?? cur);
    setCount((c) => Math.max(0, c - 1));
    start(() => markNotificationRead(n.id));
  };
  const readAll = () => {
    setItems((cur) => cur?.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })) ?? cur);
    setCount(0);
    start(() => markAllNotificationsRead());
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        aria-label={count > 0 ? `Notificări, ${count} necitite` : "Notificări"}
        className="relative flex size-11 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
        {count > 0 ? (
          <span className="absolute right-1.5 top-1.5 flex min-w-[18px] items-center justify-center rounded-full bg-gold-bright px-1 text-[10px] font-bold leading-[18px] text-ink">{count > 9 ? "9+" : count}</span>
        ) : null}
      </button>
      <dialog
        ref={ref}
        aria-labelledby="notif-title"
        onClick={(e) => e.target === ref.current && close()}
        className="m-auto mt-20 w-[min(30rem,calc(100vw-2rem))] rounded-[2rem] border border-line bg-card p-0 text-foreground shadow-2xl backdrop:bg-ink/60 backdrop:backdrop-blur-sm sm:mr-8 sm:mt-24"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 id="notif-title" className="text-lg font-semibold tracking-tight">Notificări</h2>
          <div className="flex items-center gap-1">
            {count > 0 ? <button type="button" onClick={readAll} className="rounded-full px-3 py-1.5 text-xs font-medium text-gold hover:bg-gold-soft">Marchează toate</button> : null}
            <button type="button" onClick={close} aria-label="Închide" className="flex size-9 items-center justify-center rounded-full hover:bg-background">
              <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15" /></svg>
            </button>
          </div>
        </div>
        <div className="max-h-[60dvh] overflow-y-auto">
          {items === null ? (
            <p className="p-8 text-center text-sm text-muted">Se încarcă...</p>
          ) : items.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">Nu ai notificări.</p>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((n) => {
                const inner = (
                  <>
                    {!n.read_at ? <span aria-label="Necitită" className="mt-2 size-2 shrink-0 rounded-full bg-gold" /> : <span className="mt-2 size-2 shrink-0" />}
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm ${n.read_at ? "font-medium" : "font-semibold"}`}>{n.title}</span>
                      {n.body ? <span className="mt-0.5 block text-sm text-muted">{n.body}</span> : null}
                      <span className="mt-1.5 block text-xs text-muted">{fmt.format(new Date(n.created_at))}</span>
                    </span>
                  </>
                );
                return (
                  <li key={n.id}>
                    {n.href ? (
                      <Link href={n.href} onClick={() => { readOne(n); close(); }} className="flex gap-3 px-6 py-4 hover:bg-background">{inner}</Link>
                    ) : (
                      <button type="button" onClick={() => readOne(n)} className="flex w-full gap-3 px-6 py-4 text-left hover:bg-background">{inner}</button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="border-t border-line px-6 py-3 text-center">
          <Link href="/cont/notificari" onClick={close} className="text-sm font-medium text-gold hover:underline">Vezi toate notificările</Link>
        </div>
      </dialog>
    </>
  );
}
