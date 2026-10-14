import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CookieBanner } from "@/components/cookie-banner";
import { getCurrentUser } from "@/lib/auth";
import { siteUrl } from "@/lib/site";
import { faviconPngFor, getContent, hasFaviconPng, MEDIA_MIME } from "@/lib/content";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const SITE_METADATA: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Deux saisons de planche — Association skateboard",
    template: "%s — Deux saisons de planche",
  },
  description:
    "Association Deux saisons de planche : promouvoir la pratique du skateboard et sa culture. Sessions, contests, spots et adhésion.",
  openGraph: { type: "website", locale: "fr_FR", siteName: "Deux saisons de planche" },
};

/** Le logo choisi dans /admin/contenu sert aussi de favicon. */
export async function generateMetadata(): Promise<Metadata> {
  const logo = (await getContent())["site.logo"];
  if (!logo) return SITE_METADATA;
  // Logo SVG (converti depuis Illustrator) : PNG pour Safari et l'écran d'accueil iOS, SVG sinon.
  if (await hasFaviconPng(logo)) {
    const png = faviconPngFor(logo);
    return {
      ...SITE_METADATA,
      icons: {
        icon: [
          { url: png, type: "image/png", sizes: "512x512" },
          { url: logo, type: "image/svg+xml" },
        ],
        apple: png,
      },
    };
  }
  const type = MEDIA_MIME[logo.split(".").pop() ?? ""];
  return { ...SITE_METADATA, icons: { icon: [{ url: logo, type }], apple: logo } };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, content] = await Promise.all([getCurrentUser(), getContent()]);

  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <a className="skip-link" href="#main">
          Aller au contenu
        </a>
        <SiteHeader
          logo={content["site.logo"]}
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
