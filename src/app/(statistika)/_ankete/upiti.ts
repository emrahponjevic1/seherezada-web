import { baza } from "@/app/(statistika)/_qr/baza";
import type { Odgovori } from "./tipovi";

// ---------------------------------------------------------------------------
// BRANJE ODGOVOROV ZA PLOŠČO
//
// Ekipa je majhna (deset, sto odgovorov), zato se vrstice preberejo cele in
// seštejejo v kodi — ena poizvedba, nobenega SQL-ja na vprašanje. Ko bo
// anketa kdaj imela tisoče odgovorov, se seštevanje preseli v SQL.
// ---------------------------------------------------------------------------

export interface OdgovorRed {
  id: number;
  verzija: number;
  jezik: string;
  datum: Date;
  odgovori: Odgovori;
}

/** Število odgovorov in zadnji datum po anketi. */
export async function pregledAnketa(): Promise<Map<string, { ukupno: number; zadnji: Date | null }>> {
  const redovi = await baza()<{ anketa: string; ukupno: number; zadnji: Date | null }[]>`
    select anketa, count(*)::int as ukupno, max(datum) as zadnji
    from ankete_odgovori
    group by anketa
  `;
  return new Map(redovi.map((r) => [r.anketa, { ukupno: r.ukupno, zadnji: r.zadnji }]));
}

/** Vsi odgovori ene ankete, najnovejši prvi. */
export async function odgovoriAnkete(slug: string): Promise<OdgovorRed[]> {
  return baza()<OdgovorRed[]>`
    select id::int as id, verzija, jezik, datum, odgovori
    from ankete_odgovori
    where anketa = ${slug}
    order by id desc
  `;
}
