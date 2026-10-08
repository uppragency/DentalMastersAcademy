import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

/** Branded share image (dark ink background, gold accents). System font only, no network. */
export function ogImage(opts: { eyebrow: string; title: string; subtitle?: string; footer?: string }) {
  const title = opts.title.length > 90 ? `${opts.title.slice(0, 87)}...` : opts.title;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(135deg,#0b1220 0%,#16233b 100%)", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26, letterSpacing: 6, textTransform: "uppercase", color: "#d9b45a" }}>
          <div style={{ width: 48, height: 2, background: "#d9b45a" }} />
          {opts.eyebrow}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: title.length > 50 ? 64 : 80, fontWeight: 600, lineHeight: 1.05, display: "flex" }}>{title}</div>
          {opts.subtitle ? <div style={{ fontSize: 30, color: "rgba(255,255,255,.65)", display: "flex" }}>{opts.subtitle.slice(0, 120)}</div> : null}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "rgba(255,255,255,.7)" }}>
          <span>Dental Masters Academy</span>
          <span style={{ color: "#d9b45a" }}>{opts.footer ?? ""}</span>
        </div>
      </div>
    ),
    ogSize,
  );
}
