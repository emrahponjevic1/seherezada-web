import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { headers } from "next/headers";
import { caveat } from "@/app/(statistika)/_linkovi/pisava";
import { jezikGosta } from "@/app/(statistika)/_linkovi/tekst";
import "../../globals.css";

// ---------------------------------------------------------------------------
// LASTNA KORENSKA POSTAVITEV ZA /links
//
// Stran s povezavami je za gosta, a ni del večjezičnega spletišča: nima
// navigacije, piškotne pasice in strukturiranih podatkov, vsa besedila pa
// napiše lastnik v nadzorni plošči. Zato tudi ne teče skozi next-intl.
//
// noindex: vsebina podvaja prave strani spletišča (meni, lokacije). Če bi jo
// Google indeksiral, bi si stran s povezavami in prave strani med seboj
// jemale mesto v zadetkih.
//
// latin-ext je nujen: napisi so lahko v šestih jezikih (ć, đ, ş, ğ, ı).
// ---------------------------------------------------------------------------

/**
 * SPREMENLJIVA PISAVA, NE PET STALNIH DEBELIN
 *
 * Brez navedenih debelin next/font naloži spremenljivo (variable) različico —
 * eno datoteko za vse debeline namesto ene na debelino.
 *
 * Meritev: stran je težka 150 KB in prav vseh 150 KB so pisave. Slike
 * logotipa v prometu sploh ni videti. Gost za mizo to čaka na mobilnih
 * podatkih, zato je pisava edina teža, ki jo je vredno stiskati.
 */
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  display: "swap",
});

// Rokopisna pisava za slogan (izjema, potrjena od lastnika) je v _linkovi/pisava.ts.

export const metadata: Metadata = {
  title: "Šeherezada",
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
  icons: { icon: "/favicon-32x32.png", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fffcf8",
};

export default async function LinksLayout({ children }: { children: React.ReactNode }) {
  // Jezik telefona. Izrecna izbira (?jezik=) je znana šele na strani, zato jo
  // ta postavi na ovoju vsebine; tu gre samo za privzeto vrednost oznake.
  const jezik = jezikGosta((await headers()).get("accept-language"));

  return (
    <html lang={jezik} className={`${plusJakartaSans.variable} ${caveat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
