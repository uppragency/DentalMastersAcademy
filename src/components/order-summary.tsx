"use client";

import { useState, useTransition } from "react";
import { previewDiscount, type DiscountPreview } from "@/actions/commerce";
import { formatPrice } from "@/lib/format";

/** Price breakdown with the discount code field. The input belongs to the checkout form via the form attribute. */
export function OrderSummary({
  courseId,
  priceCents,
  currency,
  goldPercent,
  free,
  defaultCode,
}: {
  courseId: string;
  priceCents: number;
  currency: string;
  goldPercent: number;
  free: boolean;
  defaultCode: string;
}) {
  const [code, setCode] = useState(defaultCode);
  const [preview, setPreview] = useState<DiscountPreview | null>(null);
  const [checking, start] = useTransition();
  const goldDisc = Math.round((priceCents * goldPercent) / 100);
  const codeOk = preview?.ok ? preview.discountCents! : 0;
  const discount = Math.max(goldDisc, codeOk);
  const total = free ? 0 : priceCents - discount;
  const apply = () => start(async () => setPreview(await previewDiscount(courseId, code)));

  return (
    <>
      {!free ? (
        <div className="mt-5 border-t border-line pt-5">
          <label htmlFor="discount_code" className="mb-1.5 block text-sm font-medium">Cod de reducere sau de recomandare</label>
          <div className="flex gap-2">
            <input
              id="discount_code"
              name="discount_code"
              form="checkout-form"
              value={code}
              onChange={(e) => { setCode(e.target.value); setPreview(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (code.trim()) apply(); } }}
              autoComplete="off"
              spellCheck={false}
              className="min-h-11 w-full min-w-0 rounded-2xl border border-line bg-background px-4 text-sm uppercase tracking-wider outline-none focus:border-gold"
            />
            <button type="button" onClick={apply} disabled={checking || !code.trim()} className="min-h-11 shrink-0 rounded-full border border-line px-5 text-sm font-medium transition-colors hover:border-foreground/30 disabled:opacity-50">
              {checking ? "..." : "Aplică"}
            </button>
          </div>
          {preview ? <p role="status" className={`mt-2 text-sm ${preview.ok ? "text-gold" : "text-red-700"}`}>{preview.ok ? "Cod aplicat." : preview.message}</p> : null}
        </div>
      ) : null}
      <dl className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Preț</dt><dd>{formatPrice(priceCents, currency)}</dd></div>
        {!free && codeOk > 0 ? (
          <div className="flex justify-between text-gold"><dt>{preview?.label === "Recomandare" ? "Reducere recomandare" : `Cod ${preview?.label}`}</dt><dd>−{formatPrice(codeOk, currency)}</dd></div>
        ) : goldPercent > 0 && !free ? (
          <div className="flex justify-between text-gold"><dt>Reducere Gold {goldPercent}%</dt><dd>−{formatPrice(goldDisc, currency)}</dd></div>
        ) : null}
        <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold">
          <dt>Total</dt><dd>{free ? "Gratuit" : formatPrice(total, currency)}</dd>
        </div>
      </dl>
    </>
  );
}
