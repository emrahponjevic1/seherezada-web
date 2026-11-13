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

/**
 * En izpolnjen obrazec, z zaporedno številko (1 = prvi poslani) in sosedoma
 * za listanje naprej in nazaj. null, če ga ni ali pripada drugi anketi.
 */
export async function jedanOdgovor(
  slug: string,
  id: number
): Promise<(OdgovorRed & { redniBroj: number; prethodni: number | null; sljedeci: number | null }) | null> {
  const [red] = await baza()<(OdgovorRed & { redniBroj: number; prethodni: number | null; sljedeci: number | null })[]>`
    select o.id::int as id, o.verzija, o.jezik, o.datum, o.odgovori,
      (select count(*)::int from ankete_odgovori where anketa = ${slug} and id <= o.id) as "redniBroj",
      (select max(id)::int from ankete_odgovori where anketa = ${slug} and id < o.id) as prethodni,
      (select min(id)::int from ankete_odgovori where anketa = ${slug} and id > o.id) as sljedeci
    from ankete_odgovori o
    where o.anketa = ${slug} and o.id = ${id}
  `;
  return red ?? null;
}
