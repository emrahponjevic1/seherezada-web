"use server";

import { LOCALE_CODES } from "@/data/site";
import { baza, imaBazu } from "@/app/(statistika)/_qr/baza";
import { anketaPoSlugu } from "./registar";
import { ocistiOdgovore } from "./provjera";
import { pripraviAnketeTabele } from "./shema";

// ---------------------------------------------------------------------------
// ODDAJA ANKETE
//
// Shrani se samo: katera anketa, različica, jezik, datum, odgovori. Nič o
// napravi ali omrežju — glej shema.ts.
// ---------------------------------------------------------------------------

export type Rezultat =
  | { ok: true }
  | { ok: false; greska: "nedostaje"; nedostaju: string[] }
  | { ok: false; greska: "zatvorena" | "server" };

export async function posaljiAnketu(
  slug: string,
  jezik: string,
  ulaz: unknown,
  zamka: string
): Promise<Rezultat> {
  // Skrito polje, ki ga človek ne vidi in ne izpolni. Robot ga izpolni —
  // rečemo mu "hvala" in ničesar ne shranimo, da ne poskuša drugače.
  if (zamka) return { ok: true };

  const anketa = anketaPoSlugu(String(slug));
  if (!anketa) return { ok: false, greska: "server" };
  if (anketa.zatvorena) return { ok: false, greska: "zatvorena" };

  const j = (LOCALE_CODES as readonly string[]).includes(jezik) ? jezik : "bs";
  const { odgovori, nedostaju } = ocistiOdgovore(anketa, ulaz);
  if (nedostaju.length) return { ok: false, greska: "nedostaje", nedostaju };
  if (Object.keys(odgovori).length === 0) return { ok: false, greska: "nedostaje", nedostaju: [] };

  if (!imaBazu()) return { ok: false, greska: "server" };
  try {
    await pripraviAnketeTabele();
    await baza()`
      insert into ankete_odgovori (anketa, verzija, jezik, odgovori)
      values (${anketa.slug}, ${anketa.verzija}, ${j}, ${baza().json(odgovori)})
    `;
    return { ok: true };
  } catch (e) {
    console.error("ANKETA: odgovor nije spremljen", e);
    return { ok: false, greska: "server" };
  }
}
