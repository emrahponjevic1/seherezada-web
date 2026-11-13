import type { Pitanje } from "./tipovi";

/**
 * Odgovor za plošče, v bosanščini: ocena s pomenom, izbira z besedilom,
 * prosto besedilo tako, kot ga je kdo napisal. null = brez odgovora.
 */
export function odgovorZaPanel(p: Pitanje, v: number | string | undefined): string | null {
  if (v === undefined || v === "") return null;
  switch (p.vrsta) {
    case "skala": {
      const max = p.max ?? 5;
      const pomen = v === 1 ? ` — ${p.najnize.bs}` : v === max ? ` — ${p.najvise.bs}` : "";
      return `${v} / ${max}${pomen}`;
    }
    case "izbor":
      return p.opcije.find((o) => o.id === v)?.tekst.bs ?? String(v);
    case "tekst":
      return String(v);
  }
}
