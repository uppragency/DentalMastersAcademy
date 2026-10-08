import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.dentalmasters.ro";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Dental Masters Academy", template: "%s | Dental Masters Academy" },
  description: "Cursuri de înaltă specializare pentru medicii stomatologi. Înscriere și plată online.",
  openGraph: { type: "website", locale: "ro_RO", siteName: "Dental Masters Academy" },
};

export const viewport: Viewport = { themeColor: "#fbfaf7" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("dma-theme");if(!t&&matchMedia("(prefers-color-scheme: dark)").matches)t="dark";if(t==="dark")document.documentElement.dataset.theme="dark"}catch(e){}` }} />
      </head>
      <body className="min-h-dvh">
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
