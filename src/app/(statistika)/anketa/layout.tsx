import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { DEFAULT_LOCALE } from "@/data/site";
import "../../globals.css";

// ---------------------------------------------------------------------------
// LASTNA KORENSKA POSTAVITEV ZA /anketa
//
// Ankete so za ekipo, ne za goste spletišča: brez navigacije, piškotne
// pasice in Google Analytics (zato tudi ne teče skozi next-intl). Jezik
// izbere izpolnjevalec sam na prvem zaslonu. Vse o tem: _ankete/README.md
// ---------------------------------------------------------------------------

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anketa — Šeherezada",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  icons: { icon: "/favicon-32x32.png", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fffcf8",
};

export default function AnketaLayout({ children }: { children: React.ReactNode }) {
  // Prvi zaslon je slovenski; izbrani jezik ankete stran postavi na <main lang>.
  return (
    <html lang={DEFAULT_LOCALE.code} className={plusJakartaSans.variable}>
      <body>{children}</body>
    </html>
  );
}
