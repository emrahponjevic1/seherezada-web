import type { LocaleCode } from "@/data/site";

// ---------------------------------------------------------------------------
// BESEDILA ZNAČKE ODPRTO / ZAPRTO
//
// Edina besedila na strani s povezavami, ki jih ne napiše lastnik. V
// messages/<jezik>.json jih ni namenoma: ta stran ne teče skozi next-intl
// (glej _linkovi/tekst.ts), zato bi jih od tam ne mogli prebrati.
//
// Ure se ne prevajajo — vstavijo se kot {ura}.
// ---------------------------------------------------------------------------

export interface BesedilaZnacke {
  odprto: string;
  zaprto: string;
  /** Dodatek ob "odprto": do katere ure. */
  doUre: string;
  /** Dodatek ob "zaprto": kdaj spet odpremo. */
  odUre: string;
}

export const ZNACKA: Record<LocaleCode, BesedilaZnacke> = {
  sl: { odprto: "Odprto", zaprto: "Zaprto", doUre: "do {ura}", odUre: "odpremo ob {ura}" },
  en: { odprto: "Open", zaprto: "Closed", doUre: "until {ura}", odUre: "opens at {ura}" },
  de: { odprto: "Geöffnet", zaprto: "Geschlossen", doUre: "bis {ura}", odUre: "öffnet um {ura}" },
  it: { odprto: "Aperto", zaprto: "Chiuso", doUre: "fino alle {ura}", odUre: "apre alle {ura}" },
  bs: { odprto: "Otvoreno", zaprto: "Zatvoreno", doUre: "do {ura}", odUre: "otvaramo u {ura}" },
  tr: { odprto: "Açık", zaprto: "Kapalı", doUre: "{ura} kadar", odUre: "{ura} açılıyor" },
};

export function sUro(predloga: string, ura: string) {
  return predloga.replace("{ura}", ura);
}
