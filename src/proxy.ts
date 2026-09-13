import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

// ---------------------------------------------------------------------------
// Prestreže vsako zahtevo in ugotovi, za kateri jezik gre.
//
// V Next 16 se ta datoteka imenuje proxy.ts (prej middleware.ts).
// Vsebina je ista, ime je novo.
//
// VZOREC
// [^.]* pomeni "pot brez pike". S tem izpustimo datoteke — slike,
// favicon.ico, sitemap.xml, robots.txt, llms.txt — ki ne smejo dobiti
// jezikovne predpone, sicer jih Google ne najde.
//
// Namerno ni zapisano kot ".*\..*", čeprav je to običajni vzorec:
// tam morata biti dve poševnici in če se ena izgubi pri urejanju, vzorec
// tiho neha loviti karkoli. Build tega ne javi. [^.]* nima te pasti.
// ---------------------------------------------------------------------------

const obdelaj = createMiddleware(routing);

/**
 * PREUSMERITEV /sl/... JE TRAJNA, NE ZAČASNA
 *
 * next-intl vrne 307 (začasno). Pri nas ta preusmeritev ni začasna: naslov
 * /sl/meni ne bo nikoli obstajal, ker slovenščina po dogovoru nima predpone.
 * 308 pove Googlu, naj si zapomni cilj in starega naslova ne obiskuje več.
 *
 * Pretvarjamo samo preusmeritve, ne vseh odgovorov, in samo tam, kjer je
 * zaznavanje jezika izklopljeno — torej so vse preusmeritve strukturne,
 * ne odvisne od gosta. Odkrito v neodvisni reviziji (6E.5).
 */
export default function proxy(zahteva: NextRequest) {
  const odgovor = obdelaj(zahteva);

  if (odgovor.status === 307) {
    const cilj = odgovor.headers.get("location");
    if (cilj) {
      const trajna = NextResponse.redirect(new URL(cilj, zahteva.url), 308);
      // Piškotek jezika, ki ga je nastavil next-intl, mora preživeti.
      odgovor.cookies.getAll().forEach((c) => trajna.cookies.set(c));
      return trajna;
    }
  }

  return odgovor;
}

// /q/... (kratke povezave QR kod) in /statistika nista del večjezičnega spletišča.
// Brez izjeme bi next-intl /statistika prepisal v /sl/statistika in vrnil 404.
// Vse o tem je v src/app/(statistika)/ — glej README.md tam.
export const config = {
  matcher: "/((?!api|_next|_vercel|q/|statistika)[^.]*)",
};
