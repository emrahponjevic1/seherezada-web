import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CookieBanner from "@/components/legal/CookieBanner";
import GoogleAnalytics from "@/components/legal/GoogleAnalytics";
import OrganizationJsonLd from "@/components/seo/OrganizationJsonLd";
import { routing } from "@/i18n/routing";
import { BRAND_COLOR, SHARE_IMAGE, SITE_NAME, SITE_URL, localeByCode } from "@/data/site";
import { localizedUrl } from "@/i18n/urls";
import type { AppLocale } from "@/i18n/urls";
import { STUDENT_BON } from "@/components/menu/MenuData";
import "../globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

/**
 * Pove Nextu, da naj strani zgradi vnaprej za vsak jezik. Brez tega bi se
 * vsaka stran sestavljala ob obisku — počasneje in po nepotrebnem.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Barva vrstice brskalnika na telefonu — na Androidu se obarva okoli strani.
  themeColor: BRAND_COLOR,
};

/**
 * Privzete vrednosti za vse strani pod tem jezikom. Posamezna stran naslov,
 * opis in kanonični naslov postavi sama (glej src/i18n/meta.ts).
 *
 * Kanoničnega naslova tu NI namenoma: če bi bil, bi ga podedovala tudi stran
 * 404 in Googlu trdila, da je naslovnica.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
  /**
   * Brez tega Next ne zna sestaviti celega naslova iz poti, zato kanonični
   * naslovi in Open Graph ostanejo nedokončani. To je temelj vsega spodaj.
   */
  metadataBase: new URL(SITE_URL),
  title: t("naslovnicaNaslov"),
  description: t("naslovnicaOpis", {
    doplacilo: `${STUDENT_BON.surcharge.toFixed(2).replace(".", ",")} €`,
  }),

  /**
   * IKONE
   *
   * Datoteke so izvožene iz logotipa in ležijo v public/. Google za ikono ob
   * zadetku zahteva kvadrat, ki je večkratnik 48 px — to pokriva
   * android-chrome-192x192.png. favicon.ico vsebuje 16, 32 in 48 px za
   * brskalnike, ki gledajo samo v koren.
   */
  icons: {
    icon: [
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/android-chrome-192x192.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",


  openGraph: {
    type: "website",
    locale: localeByCode(locale).og,
    siteName: SITE_NAME,
    url: localizedUrl("/", locale as AppLocale),
    images: [
      {
        url: SHARE_IMAGE.src,
        width: SHARE_IMAGE.width,
        height: SHARE_IMAGE.height,
        alt: t("ogSlikaOpis"),
      },
    ],
  },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Naslov tipa /xy/meni ne sme pokazati slovenske strani pod tujo oznako —
  // to bi bila ista vsebina na dveh naslovih. Raje 404.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Brez te vrstice bi se stran sestavljala ob vsakem obisku namesto vnaprej.
  setRequestLocale(locale);

  return (
    <html lang={locale} className={plusJakartaSans.variable}>
      <body>
        <NextIntlClientProvider>
          {children}
          {/* Pasica se pokaže samo, dokler gost ni izbral. Analitika se naloži
              šele, ko privolitev to dovoli — glej src/lib/consent.ts */}
          <OrganizationJsonLd locale={locale as AppLocale} />
          <CookieBanner />
          <GoogleAnalytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
