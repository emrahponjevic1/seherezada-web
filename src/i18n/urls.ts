import { LOCALES, SITE_URL } from "@/data/site";
import { getPathname } from "./navigation";
import type { routing, SlugPathname, StaticPathname } from "./routing";

// ---------------------------------------------------------------------------
// NASLOVI V VSEH JEZIKIH
//
// absoluteUrl() iz src/data/site.ts zna samo slovenščino, ker ne pozna
// prevedenih poti. Tu jih pozna: getPathname() prebere tabelo iz routing.ts
// in vrne pot tako, kot res obstaja.
//
//   localizedUrl("/meni", "sl")  ->  https://seherezada.net/meni
//   localizedUrl("/meni", "de")  ->  https://seherezada.net/de/speisekarte
//
// To uporabljata sitemap in hreflang. Če bi naslove sestavljali sami
// (predpona + pot), bi Googlu oddali naslove, ki so samo preusmeritve.
// ---------------------------------------------------------------------------

/** Tipa poti sta zapisana v routing.ts, ob tabeli. Tu ju samo posredujemo. */
export type { SlugPathname, StaticPathname };

export type AppLocale = (typeof routing.locales)[number];

/** Cel naslov strani brez sluga, v izbranem jeziku. */
export function localizedUrl(pathname: StaticPathname, locale: AppLocale) {
  const path = getPathname({ href: pathname, locale });
  return `${SITE_URL}${path === "/" ? "" : path}`;
}

/** Cel naslov strani s slugom (objava, oglas, poslovalnica), v izbranem jeziku. */
export function localizedSlugUrl(
  pathname: SlugPathname,
  slug: string,
  locale: AppLocale
) {
  const path = getPathname({ href: { pathname, params: { slug } }, locale });
  return `${SITE_URL}${path}`;
}

// ---------------------------------------------------------------------------
// HREFLANG — KATERE JEZIKOVNE RAZLIČICE TE STRANI OBSTAJAJO
//
// Kanonični naslov Googlu pove "to je prava različica te strani". Hreflang mu
// pove nekaj drugega: "ista stran obstaja še v petih jezikih, tu so naslovi".
// Brez tega lahko Google šest jezikov obravnava kot šest tekmecev in izbere
// enega, ali pa Slovencu v zadetkih pokaže turško stran.
//
// Dve pravili, ki ju Google zahteva in ju ta funkcija izpolnjuje sama od sebe,
// ker vsi naslovi izhajajo iz iste tabele:
//
//   1. Vsaka stran našteje TUDI SAMO SEBE. Seznam je za vseh šest enak.
//   2. Sklic mora biti vzajemen: če /en/menu kaže na /de/speisekarte, mora
//      /de/speisekarte kazati nazaj na /en/menu. Sicer Google sklic zavrže.
//
// x-default je različica za obiskovalca, čigar jezika nimamo. Pri nas je to
// slovenščina — restavracija stoji v Ljubljani.
// ---------------------------------------------------------------------------

/** Ključ v Next zapisu alternates.languages -> cel naslov. */
type Hreflang = Record<string, string>;

/**
 * `jeziki` omeji seznam na jezike, v katerih stran res obstaja — objava na
 * blogu je lahko samo slovenska in angleška. Brez njega je seznam vseh šest.
 * x-default vedno kaže na slovenščino.
 */
function sestavi(
  naslovZaJezik: (locale: AppLocale) => string,
  jeziki?: readonly string[]
): Hreflang {
  const out: Hreflang = {};
  for (const l of LOCALES) {
    if (jeziki && !jeziki.includes(l.code)) continue;
    out[l.hreflang] = naslovZaJezik(l.code);
  }
  out["x-default"] = naslovZaJezik(DEFAULT_CODE);
  return out;
}

/** Jezik, na katerega kaže x-default. */
const DEFAULT_CODE = (LOCALES.find((l) => l.default) ?? LOCALES[0])
  .code as AppLocale;

/** Vseh šest naslovov strani brez sluga, plus x-default. */
export function hreflangZaPot(pathname: StaticPathname): Hreflang {
  return sestavi((locale) => localizedUrl(pathname, locale));
}

/** Vseh šest naslovov strani s slugom (oglas, poslovalnica). */
export function hreflangZaSlug(
  pathname: SlugPathname,
  slug: string
): Hreflang {
  return sestavi((locale) => localizedSlugUrl(pathname, slug, locale));
}

/**
 * Za stran, ki ima v vsakem jeziku SVOJ slug in ne obstaja v vseh jezikih —
 * objavo na blogu: { sl: "poceni-hrana-ljubljana", en: "cheap-eats-ljubljana" }.
 * Našteje samo te jezike, x-default kaže na slovenščino, ki je vedno med njimi.
 */
export function hreflangZaSluge(
  pathname: SlugPathname,
  slugi: Partial<Record<AppLocale, string>>
): Hreflang {
  return sestavi(
    (locale) => localizedSlugUrl(pathname, slugi[locale] ?? "", locale),
    Object.keys(slugi)
  );
}
