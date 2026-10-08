"use client";

import { useEffect } from "react";

const PREFIX = "dma-checkout:";
const TTL_MS = 7 * 24 * 3600 * 1000;
const SKIP = new Set(["password", "accept_terms", "discount_code", "points", "billing_mode", "billing_profile_id"]);

type Draft = { at: number; values: Record<string, string> };

function read(key: string): Draft | null {
  try {
    const d = JSON.parse(localStorage.getItem(key) ?? "null") as Draft | null;
    if (!d || Date.now() - d.at > TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return d;
  } catch {
    return null;
  }
}

/** Keeps what the visitor typed (never the password) so a closed tab does not lose it. Expires after 7 days or after the order. */
export function CheckoutDraft({ formId, courseId }: { formId: string; courseId: string }) {
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const key = PREFIX + courseId;
    const textual = (el: Element): el is HTMLInputElement | HTMLTextAreaElement =>
      (el instanceof HTMLInputElement && ["text", "email", "tel", "url"].includes(el.type)) || el instanceof HTMLTextAreaElement;

    const restore = () => {
      const draft = read(key);
      if (!draft) return;
      for (const el of Array.from(form.elements)) {
        if (!textual(el) || !el.name || SKIP.has(el.name) || el.readOnly || el.value) continue;
        const v = draft.values[el.name];
        if (!v) continue;
        const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, v);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
      // Company vs individual is a button group, so it is restored by clicking.
      if (draft.values.billing_kind === "company") {
        const btn = Array.from(form.querySelectorAll<HTMLElement>('[role="radio"]')).find((b) => b.textContent?.trim() === "Firmă" && b.getAttribute("aria-checked") === "false");
        btn?.click();
      }
    };

    const save = () => {
      const prev = read(key)?.values ?? {};
      const values: Record<string, string> = { ...prev };
      for (const el of Array.from(form.elements)) {
        if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) || !el.name || SKIP.has(el.name) || el.readOnly) continue;
        if (el instanceof HTMLInputElement && el.type === "hidden" && el.name !== "billing_kind") continue;
        if (el instanceof HTMLInputElement && ["checkbox", "radio", "password"].includes(el.type)) continue;
        values[el.name] = el.value;
      }
      try {
        localStorage.setItem(key, JSON.stringify({ at: Date.now(), values } satisfies Draft));
      } catch {
        /* storage unavailable */
      }
    };

    restore();
    const mo = new MutationObserver(restore);
    mo.observe(form, { childList: true, subtree: true });
    form.addEventListener("input", save);
    return () => {
      mo.disconnect();
      form.removeEventListener("input", save);
    };
  }, [formId, courseId]);
  return null;
}

/** Removes any saved checkout drafts (used on the thank-you page). */
export function ClearCheckoutDraft() {
  useEffect(() => {
    try {
      for (const k of Object.keys(localStorage)) if (k.startsWith(PREFIX)) localStorage.removeItem(k);
    } catch {
      /* storage unavailable */
    }
  }, []);
  return null;
}
