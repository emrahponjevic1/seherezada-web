// ---------------------------------------------------------------------------
// STRANICA S POVEZAVAMI ("linktree")
//
// Besedila so zapisana po jezikih: {"sl": "ŠEHEREZADA", "tr": "ŞEHRAZAT"}.
// Manjkajoč jezik ni napaka — takrat se pokaže privzeti, nikoli prazno.
// ---------------------------------------------------------------------------

import type { IkonaSvg } from "./svgCisti";

/** Besedilo po jezikih. Ključ je oznaka jezika iz src/data/site.ts. */
export type Tekst = Record<string, string>;

export interface LinkStranica {
  id: number;
  /** Naslov strani: /links/<slug>. */
  slug: string;
  /** Ime, ki ga vidi samo lastnik v nadzorni plošči. */
  naziv: string;
  naslov: Tekst;
  podnaslov: Tekst;
  pozdrav: Tekst;
  podnozje: Tekst;
  /** Poudarna barva strani (šestnajstiška). Prazno = privzeta barva znamke. */
  boja: string;
  /** Id poslovalnice za značko Odprto/Zaprto. Prazno = značke ni. */
  lokacija: string;
  /** Na to stran vodi goli /links. */
  glavna: boolean;
  aktivna: boolean;
  kreirana: Date;
  izmijenjena: Date;
}

/** Gumb na strani. V bazi je vrstica v qr_kodovi s postavljenim stranica_id. */
export interface LinkDugme {
  id: number;
  slug: string;
  naziv: string;
  cilj: string;
  aktivan: boolean;
  redoslijed: number;
  ikona: string;
  /** Crtež ikone iz iskalnika; samo kadar se `ikona` začne z "x:". */
  ikona_svg: IkonaSvg | null;
  boja: string;
  naslovi: Tekst;
  podnaslovi: Tekst;
}
