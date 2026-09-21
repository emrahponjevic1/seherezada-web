import type { MetadataRoute } from "next";
import { LOCALES } from "@/data/site";
import { localizedSlugUrl, localizedUrl } from "@/i18n/urls";
import type { StaticPathname } from "@/i18n/urls";
import { LOCATIONS, LOCATION_SLUG } from "@/data/locations";
import { objaveVJeziku } from "@/data/blog";
import { OPEN_POSITIONS } from "@/data/jobs";

// ---------------------------------------------------------------------------
// SITEMAP — seznam strani, ki ga oddamo Googlu
//
// Brez tega mora Google sam uganiti, katere strani obstajajo. S tem mu jih
// predamo na pladnju in ve, katere so pomembnejše.
//
// Seznam ni prepisan ročno. Objave, oglasi in poslovalnice se preberejo iz
// istih datotek, ki jih prikazuje stran — zato se sitemap ne more razhajati
// z resnico. Ko dodaš objavo, se pojavi tu sama od sebe.
//
// JEZIKI
// Spodaj so poti zapisane v notranji obliki ("/meni"). Pravi naslov za vsak
// jezik izračuna localizedUrl() iz tabele prevodov — /de/speisekarte, ne
// /de/meni. Naslova se ne sme sestavljati z lepljenjem predpone in poti:
// tako bi Googlu oddali naslove, ki obstajajo samo kot preusmeritev.
//
// Nov jezik: dopiši vrstico v LOCALES (src/data/site.ts). Tu ni ničesar.
// ---------------------------------------------------------------------------

/**
 * `priority` ni obljuba Googlu, ampak namig, katera stran je za nas
 * pomembnejša. Naslovnica in meni sta tisto, po čemer nas gost išče.
 */
const STATIC_PAGES: { path: StaticPathname; priority: number }[] = [
  { path: "/", priority: 1.0 },
  { path: "/meni", priority: 0.9 },
  { path: "/kontakt", priority: 0.8 },
  // Pregled obeh poslovalnic — pokriva namen "kje jesti v Ljubljani".
  { path: "/lokacije", priority: 0.8 },
  { path: "/studentski-boni", priority: 0.8 },
  { path: "/halal", priority: 0.8 },
  { path: "/o-nas", priority: 0.7 },
  { path: "/pogosta-vprasanja", priority: 0.7 },
  { path: "/galerija", priority: 0.5 },
  { path: "/blog", priority: 0.5 },
  { path: "/zaposlitev", priority: 0.5 },
  // Pravni besedili sta obvezni in naj bosta najdljivi, a nista tisto,
  // po čemer želimo biti najdeni.
  { path: "/piskotki", priority: 0.2 },
  { path: "/politika-zasebnosti", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.flatMap((locale) => {
    /**
     * BREZ lastModified IN changeFrequency — namerno.
     *
     * lastModified je bil čas gradnje, torej isti na vseh naslovih. Po vsaki
     * objavi bi vse strani trdile, da so bile spremenjene, čeprav se ni
     * spremenila nobena. Google se na tak podatek hitro nauči, da mu ne sme
     * verjeti, in ga neha gledati — s tem izgubimo tudi tiste primere, ko bi
     * nam res koristil. Bolje brez kot lažen.
     *
     * changeFrequency Google po lastni izjavi ignorira od 2015.
     *
     * priority ostane: je le namig, katera stran je za nas pomembnejša.
     */
    const entry = (url: string, priority: number) => ({ url, priority });

    return [
      ...STATIC_PAGES.map(({ path, priority }) =>
        entry(localizedUrl(path, locale.code), priority)
      ),

      // Strani poslovalnic — nanje kažeta Google profila, zato visoko.
      ...LOCATIONS.map((loc) =>
        entry(
          localizedSlugUrl("/lokacije/[slug]", LOCATION_SLUG[loc.id], locale.code),
          0.9
        )
      ),

      // Objave in oglasi. Dokler sta seznama prazna, teh vrstic preprosto ni.
      // Objava je v sitemapu samo v jezikih, v katere je prevedena.
      ...objaveVJeziku(locale.code).map((post) =>
        entry(localizedSlugUrl("/blog/[slug]", post.slug, locale.code), 0.6)
      ),
      ...OPEN_POSITIONS.map((job) =>
        entry(localizedSlugUrl("/zaposlitev/[slug]", job.slug, locale.code), 0.6)
      ),
    ];
  });
}
