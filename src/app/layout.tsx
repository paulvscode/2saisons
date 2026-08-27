import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CookieBanner } from "@/components/cookie-banner";
import { getCurrentUser } from "@/lib/auth";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Deux saisons de planche — Association skateboard",
    template: "%s — Deux saisons de planche",
  },
  description:
    "Association Deux saisons de planche : promouvoir la pratique du skateboard et sa culture. Sessions, contests, spots et adhésion.",
  openGraph: { type: "website", locale: "fr_FR", siteName: "Deux saisons de planche" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <a className="skip-link" href="#main">
          Aller au contenu
        </a>
        <SiteHeader
          user={
            user
              ? { firstname: user.firstname, role: user.role }
              : null
          }
        />
        <main id="main">{children}</main>
        <SiteFooter />
        <CookieBanner />
      </body>
    </html>
  );
}
