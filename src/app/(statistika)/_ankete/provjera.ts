import type { Anketa, Odgovori } from "./tipovi";

const svaPitanja = (a: Anketa) => a.sekcije.flatMap((s) => s.pitanja);

// ---------------------------------------------------------------------------
// PREVERJANJE ODGOVOROV
//
// Teče na strežniku, ker je vsaka strežniška akcija javno dosegljiva in
// brskalniku se ne zaupa (obrazec obvezna vprašanja preveri že sam, a to je
// le prijaznost). V bazo gre samo, kar pripada vprašanjem te ankete: neznani
// ključi odpadejo, ocene izven lestvice odpadejo, besedilo se obreže.
// ---------------------------------------------------------------------------

const NAJVISE_TEKSTA = 4000;

export function ocistiOdgovore(
  anketa: Anketa,
  ulaz: unknown
): { odgovori: Odgovori; nedostaju: string[] } {
  const izvor = ulaz && typeof ulaz === "object" ? (ulaz as Record<string, unknown>) : {};
  const odgovori: Odgovori = {};
  const nedostaju: string[] = [];

  for (const p of svaPitanja(anketa)) {
    const v = izvor[p.id];

    switch (p.vrsta) {
      case "skala": {
        const n = Number(v);
        if (Number.isInteger(n) && n >= 1 && n <= (p.max ?? 5)) odgovori[p.id] = n;
        break;
      }
      case "izbor": {
        if (typeof v === "string" && p.opcije.some((o) => o.id === v)) odgovori[p.id] = v;
        break;
      }
      case "tekst": {
        const t = typeof v === "string" ? v.trim().slice(0, p.najvise ?? NAJVISE_TEKSTA) : "";
        if (t) odgovori[p.id] = t;
        break;
      }
    }

    if (p.obavezno && !(p.id in odgovori)) nedostaju.push(p.id);
  }

  return { odgovori, nedostaju };
}
