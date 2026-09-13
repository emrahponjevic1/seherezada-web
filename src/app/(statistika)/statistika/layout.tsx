import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { odjava } from "@/app/(statistika)/_qr/prijavaAkcije";
import { jePrijavljen } from "@/app/(statistika)/_qr/sesija";
import s from "@/app/(statistika)/_qr/Statistika.module.css";
import "../../globals.css";

// ---------------------------------------------------------------------------
// LASTNA KORENSKA POSTAVITEV ZA /statistika
//
// Stran je izven [locale], ker ni del javnega, večjezičnega spletišča: nima
// navigacije spletišča, piškotne pasice, strukturiranih podatkov in se ne sme
// znajti v iskalniku. latin-ext je dodan, ker so napisi v bosanščini (ć, đ).
//
// Gornja traka se pokaže samo prijavljenemu. Vsaka stran in vsaka akcija
// vseeno SAMA preveri prijavo — postavitev ni varnostna meja.
// ---------------------------------------------------------------------------

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: { default: "QR statistika", template: "%s — QR statistika" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  icons: { icon: "/favicon-32x32.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fffcf8",
};

export default async function StatistikaLayout({ children }: { children: React.ReactNode }) {
  const prijavljen = await jePrijavljen();

  return (
    <html lang="bs" className={plusJakartaSans.variable}>
      <body className={s.tijelo}>
        {prijavljen && (
          <header className={s.gornjaTraka}>
            <div className={s.gornjaTrakaUnutra}>
              <a href="/statistika" className={s.gornjaZnak}>
                Šeherezada <span className={s.gornjaZnakOpis}>QR statistika</span>
              </a>
              <div className={s.gornjaDesno}>
                <a href="/" target="_blank" rel="noreferrer" className={s.gornjaLink}>
                  Otvori stranicu ↗
                </a>
                <form action={odjava}>
                  <button type="submit" className={s.dugmeSporedno}>
                    Odjava
                  </button>
                </form>
              </div>
            </div>
          </header>
        )}
        {children}
      </body>
    </html>
  );
}
