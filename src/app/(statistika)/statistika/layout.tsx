import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { odjava } from "@/app/(statistika)/_qr/prijavaAkcije";
import { jePrijavljen } from "@/app/(statistika)/_qr/sesija";
import Bocnik from "@/app/(statistika)/_qr/Bocnik";
import s from "@/app/(statistika)/_qr/Statistika.module.css";
import o from "@/app/(statistika)/_qr/Okvir.module.css";
import "../../globals.css";

// ---------------------------------------------------------------------------
// LASTNA KORENSKA POSTAVITEV ZA /statistika
//
// Stran je izven [locale], ker ni del javnega, večjezičnega spletišča: nima
// navigacije spletišča, piškotne pasice, strukturiranih podatkov in se ne sme
// znajti v iskalniku. latin-ext je dodan, ker so napisi v bosanščini (ć, đ).
//
// Meni (bočni na računalniku, zavihki spodaj na telefonu) se pokaže samo
// prijavljenemu. Vsaka stran in vsaka akcija vseeno SAMA preveri prijavo —
// postavitev ni varnostna meja.
// ---------------------------------------------------------------------------

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s — Šeherezada panel" },
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
        {prijavljen ? (
          <div className={o.okvir}>
            <Bocnik odjava={odjava} />
            <div className={o.glavno}>{children}</div>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
