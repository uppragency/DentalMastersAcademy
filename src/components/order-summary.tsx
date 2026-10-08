"use client";

import { useState, useTransition } from "react";
import { previewDiscount, type DiscountPreview } from "@/actions/commerce";
import { formatPrice } from "@/lib/format";

/** Price breakdown with the discount code field. The input belongs to the checkout form via the form attribute. */
export function OrderSummary({
  courseId,
  priceCents,
  currency,
  tierName,
  tierPercent,
  free,
  defaultCode,
  pointsBalance,
  pointValueCents,
  capPercent,
}: {
  courseId: string;
  priceCents: number;
  currency: string;
  tierName: string;
  tierPercent: number;
  free: boolean;
  defaultCode: string;
  pointsBalance: number;
  pointValueCents: number;
  capPercent: number;
}) {
  const [code, setCode] = useState(defaultCode);
  const [preview, setPreview] = useState<DiscountPreview | null>(null);
  const [checking, start] = useTransition();
  const [wantPoints, setWantPoints] = useState(0);
  const tierDisc = Math.round((priceCents * tierPercent) / 100);
  const codeOk = preview?.ok ? preview.discountCents! : 0;
  const discount = Math.max(tierDisc, codeOk);
  const net = free ? 0 : priceCents - discount;
  const maxPoints = pointValueCents > 0 ? Math.max(0, Math.min(pointsBalance, Math.floor(Math.floor((net * capPercent) / 100) / pointValueCents))) : 0;
  const points = Math.min(wantPoints, maxPoints);
  const pointsDisc = Math.round(points * pointValueCents);
  const total = net - pointsDisc;
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
      {!free && pointsBalance > 0 ? (
        <div className="mt-5 border-t border-line pt-5">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="points" className="text-sm font-medium">Plătește cu punctele tale</label>
            <span className="text-xs text-muted">Sold: {pointsBalance} puncte</span>
          </div>
          {maxPoints > 0 ? (
            <>
              <input
                id="points"
                name="points"
                form="checkout-form"
                type="range"
                min={0}
                max={maxPoints}
                step={1}
                value={points}
                onChange={(e) => setWantPoints(Number(e.target.value))}
                className="mt-3 w-full accent-[#a9833d]"
              />
              <div className="mt-1 flex items-center justify-between text-xs text-muted">
                <span>{points} puncte = {formatPrice(pointsDisc, currency)}</span>
                <button type="button" onClick={() => setWantPoints(maxPoints)} className="font-medium text-foreground underline underline-offset-4">Maxim {maxPoints}</button>
              </div>
              <p className="mt-2 text-xs text-muted">Poți acoperi cel mult {capPercent}% din preț cu puncte.</p>
            </>
          ) : (
            <p className="mt-2 text-xs text-muted">Punctele se pot folosi după aplicarea reducerii, în limita a {capPercent}% din preț.</p>
          )}
        </div>
      ) : null}
      <dl className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Preț</dt><dd>{formatPrice(priceCents, currency)}</dd></div>
        {!free && codeOk > 0 ? (
          <div className="flex justify-between text-gold"><dt>{preview?.label === "Recomandare" ? "Reducere recomandare" : `Cod ${preview?.label}`}</dt><dd>−{formatPrice(codeOk, currency)}</dd></div>
        ) : tierPercent > 0 && !free ? (
          <div className="flex justify-between text-gold"><dt>Reducere {tierName} {tierPercent}%</dt><dd>−{formatPrice(tierDisc, currency)}</dd></div>
        ) : null}
        {pointsDisc > 0 ? (
          <div className="flex justify-between text-gold"><dt>Plătit cu {points} puncte</dt><dd>−{formatPrice(pointsDisc, currency)}</dd></div>
        ) : null}
        <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold">
          <dt>Total</dt><dd>{free ? "Gratuit" : formatPrice(total, currency)}</dd>
        </div>
      </dl>
    </>
  );
}
