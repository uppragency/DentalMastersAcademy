import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CookieBanner } from "@/components/cookie-banner";
import { LocaleProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";
import { en } from "@/i18n/en";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.dentalmasters.ro";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    metadataBase: new URL(siteUrl),
    title: { default: "Dental Masters Academy", template: "%s | Dental Masters Academy" },
    description: locale === "en" ? "Advanced training courses for dentists. Online registration and payment." : "Cursuri de înaltă specializare pentru medicii stomatologi. Înscriere și plată online.",
    openGraph: { type: "website", locale: locale === "en" ? "en_GB" : "ro_RO", siteName: "Dental Masters Academy" },
  };
}

export const viewport: Viewport = { themeColor: "#fbfaf7" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("dma-theme");if(t==="dark")document.documentElement.dataset.theme="dark"}catch(e){}` }} />
      </head>
      <body className="min-h-dvh">
        <LocaleProvider locale={locale} dict={locale === "en" ? en : {}}>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
          <CookieBanner />
        </LocaleProvider>
      </body>
    </html>
  );
}
