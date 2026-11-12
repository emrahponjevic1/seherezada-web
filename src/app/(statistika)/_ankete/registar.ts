import type { Anketa, Pitanje } from "./tipovi";
import uslovRada2026 from "./definicije/uslovi-rada-2026";

// ---------------------------------------------------------------------------
// SEZNAM VSEH ANKET
//
// NOVA ANKETA:
//   1. kopiraj datoteko v definicije/, spremeni slug, naziv in vprašanja,
//   2. dopiši jo v SVE_ANKETE spodaj,
//   3. če naj jo odpre goli naslov seherezada.net/anketa, jo zapiši v AKTUELNA.
// Vsaka anketa je vedno dosegljiva tudi na /anketa/<slug>.
//
// STARE ANKETE NE BRIŠI iz seznama, dokler hočeš videti njene rezultate —
// odgovori ostanejo v bazi, plošča pa zna izrisati samo ankete s tega seznama.
// Za konec zbiranja jo zapri (zatvorena: true).
// ---------------------------------------------------------------------------

export const SVE_ANKETE: Anketa[] = [uslovRada2026];

/** Katero anketo odpre seherezada.net/anketa. */
export const AKTUELNA = "uslovi-rada-2026";

export function anketaPoSlugu(slug: string): Anketa | null {
  return SVE_ANKETE.find((a) => a.slug === slug) ?? null;
}

export function svaPitanja(anketa: Anketa): Pitanje[] {
  return anketa.sekcije.flatMap((s) => s.pitanja);
}

// Napaka, ki bi se sicer pokazala šele v bazi: dve vprašanji z istim ID-jem
// bi si odgovore tiho prepisovali. Ujamemo jo ob prvem nalaganju.
for (const a of SVE_ANKETE) {
  const vidjeni = new Set<string>();
  for (const p of svaPitanja(a)) {
    if (vidjeni.has(p.id)) throw new Error(`Anketa ${a.slug}: pitanje "${p.id}" je upisano dvaput`);
    vidjeni.add(p.id);
  }
}
if (SVE_ANKETE.filter((a, i) => SVE_ANKETE.findIndex((b) => b.slug === a.slug) !== i).length) {
  throw new Error("Dvije ankete imaju isti slug");
}
