import type { LocaleCode } from "@/data/site";

// ---------------------------------------------------------------------------
// KAKO JE ANKETA ZAPISANA
//
// Anketa je podatek, ne stran: ena datoteka v definicije/ z vprašanji v vseh
// šestih jezikih. Ena in ista stran (/anketa) jo izriše, en in isti strežnik
// jo preveri in shrani, ena in ista plošča (/statistika/ankete) jo prešteje.
// Nova anketa je zato nova datoteka in vrstica v registar.ts — nič drugega.
//
// ID-ji vprašanj in odgovorov se NIKOLI ne spreminjajo, ko anketa že zbira
// odgovore. V bazo gre {"zadovoljstvo": 4}, ne prevedeno besedilo — tako se
// odgovori v nemščini in turščini seštejejo skupaj. Besedilo vprašanja lahko
// popraviš kadarkoli, ID ostane.
// ---------------------------------------------------------------------------

/** Besedilo v vseh šestih jezikih. Prevajalnik javi, če kateri manjka. */
export type Prevod = Record<LocaleCode, string>;

interface OsnovaPitanja {
  /** Stalni ključ v bazi. Male črke, brez presledkov. Ne spreminjaj ga. */
  id: string;
  pitanje: Prevod;
  /** Drobno pojasnilo pod vprašanjem. */
  pomoc?: Prevod;
  /** Brez odgovora se anketa ne pošlje. */
  obavezno?: boolean;
}

/** Ocena od 1 do `max` (privzeto 5), z napisoma na obeh koncih. */
export interface PitanjeSkala extends OsnovaPitanja {
  vrsta: "skala";
  max?: number;
  najnize: Prevod;
  najvise: Prevod;
}

/** En odgovor med ponujenimi. */
export interface PitanjeIzbor extends OsnovaPitanja {
  vrsta: "izbor";
  opcije: { id: string; tekst: Prevod }[];
}

/** Prosto besedilo. */
export interface PitanjeTekst extends OsnovaPitanja {
  vrsta: "tekst";
  /** Največ znakov. Privzeto 4000. */
  najvise?: number;
}

/*
  NOVA VRSTA VPRAŠANJA (npr. "više izbora" ali "kratki odgovor")
  1. tip tukaj in v uniji Pitanje,
  2. izris v Obrazac.tsx,
  3. preverjanje v provjera.ts,
  4. povzetek v statistika/ankete/[slug]/page.tsx in stolpec v csv.
  Prevajalnik pokaže vsako mesto, ki ga je treba dopolniti.
*/
export type Pitanje = PitanjeSkala | PitanjeIzbor | PitanjeTekst;

export interface Sekcija {
  naslov: Prevod;
  pitanja: Pitanje[];
}

export interface Anketa {
  /** Del naslova: /anketa/<slug>. Ne spreminjaj ga po objavi. */
  slug: string;
  /** Ime v plošči (samo za lastnika, en jezik). */
  naziv: string;
  /**
   * Povečaj, ko vprašanja vsebinsko spremeniš ali dodaš. Vsak odgovor si
   * zapomni različico, zato se stari in novi ne pomešajo nevede.
   */
  verzija: number;
  /** Ko je true, stran ne sprejema več odgovorov (rezultati ostanejo). */
  zatvorena?: boolean;
  naslov: Prevod;
  /** Uvodno besedilo. Prazna vrstica = nov odstavek. */
  uvod: Prevod;
  sekcije: Sekcija[];
}

/** Odgovori, kot gredo v bazo: {"zadovoljstvo": 4, "checklista": "da", ...}. */
export type Odgovori = Record<string, number | string>;
