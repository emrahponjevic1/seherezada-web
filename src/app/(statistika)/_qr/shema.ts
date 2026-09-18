import { baza } from "@/app/(statistika)/_qr/baza";
import type { QrStil } from "./stil";

// ---------------------------------------------------------------------------
// TABELE QR KOD
//
// Tabele se ustvarijo same ob prvem obisku /statistika, zato lastniku
// ni treba ničesar poganjati ročno. "if not exists" pomeni, da ponovni klic
// ničesar ne pokvari. Preusmeritev /q/... tega ne kliče — tam šteje vsaka
// milisekunda, pred prvim kodom pa tako ali tako ni kaj preusmerjati.
//
// STRANICE S POVEZAVAMI ("linktree")
// Ena stranica je vrstica v link_stranice, njeni gumbi pa so vrstice v
// qr_kodovi s postavljenim stranica_id. Gumb ima natanko to, kar ima koda —
// kratko povezavo, cilj, ime, stikalo — zato podvojene tabele ni. Klik na
// gumb gre skozi isti /q/<slug> in se zapiše med skeniranja, tako da gumb
// takoj dobi vso statistiko, ki jo koda že ima.
// ---------------------------------------------------------------------------

export type Nacin = "mjeren" | "direktan";

export interface QrKod {
  id: number;
  slug: string;
  naziv: string;
  cilj: string;
  nacin: Nacin;
  aktivan: boolean;
  stil: QrStil;
  biljeska: string;
  kreiran: Date;
  izmijenjen: Date;

  // ---- Samo za gumbe na stranici s povezavami ----------------------------
  /** Na kateri stranici je ta vrstica gumb. null = navadna QR koda. */
  stranica_id: number | null;
  /** Vrstni red gumba na stranici. */
  redoslijed: number;
  /** Emoji pred napisom. */
  ikona: string;
  /** Poudarna barva gumba. Prazno = barva stranice. */
  boja: string;
  /** Prevodi napisa po jeziku: {"sl":"Meni","de":"Speisekarte"}. */
  naslovi: Record<string, string>;
  /** Prevodi drobnega podnapisa. */
  podnaslovi: Record<string, string>;

  // ---- Samo za kodo, ki vodi NA stranico s povezavami ---------------------
  /**
   * Na katero stranico vodi ta koda. Ni isto kot stranica_id: tam je gumb
   * NA stranici, tu je koda, ki KAŽE na stranico.
   *
   * Zapisano je, da /q/ ob skeniranju ve, katera stranica se je odprla, ne da
   * bi karkoli dodatno bral. Ko kodo pozneje prevežeš na drugo stranico, stara
   * skeniranja ostanejo pri stari — številke se ne preselijo.
   */
  vodi_na: number | null;
}

const SHEMA = `
create table if not exists qr_kodovi (
  id          serial primary key,
  slug        text not null unique,
  naziv       text not null,
  cilj        text not null,
  nacin       text not null check (nacin in ('mjeren', 'direktan')),
  aktivan     boolean not null default true,
  stil        jsonb not null default '{}'::jsonb,
  biljeska    text not null default '',
  kreiran     timestamptz not null default now(),
  izmijenjen  timestamptz not null default now()
);

create table if not exists qr_skeniranja (
  id          bigserial primary key,
  kod_id      integer not null references qr_kodovi(id) on delete cascade,
  vrijeme     timestamptz not null default now(),
  posjetilac  text not null,
  bot         boolean not null default false,
  drzava      text,
  regija      text,
  grad        text,
  uredjaj     text,
  proizvodjac text,
  model       text,
  os          text,
  os_verzija  text,
  preglednik  text,
  jezik       text
);

create index if not exists qr_skeniranja_kod_vrijeme on qr_skeniranja (kod_id, vrijeme);

create table if not exists link_stranice (
  id           serial primary key,
  slug         text not null unique,
  naziv        text not null,
  naslov       jsonb not null default '{}'::jsonb,
  podnaslov    jsonb not null default '{}'::jsonb,
  pozdrav      jsonb not null default '{}'::jsonb,
  podnozje     jsonb not null default '{}'::jsonb,
  boja         text not null default '',
  lokacija     text not null default '',
  glavna       boolean not null default false,
  aktivna      boolean not null default true,
  kreirana     timestamptz not null default now(),
  izmijenjena  timestamptz not null default now()
);

-- Glavna je lahko samo ena. To jamči baza, ne koda: dve hkratni shranjevanji
-- bi se v kodi lahko prehiteli, tu pa drugo preprosto ne uspe.
create unique index if not exists link_stranice_glavna on link_stranice (glavna) where glavna;

-- Gumbi so kode s stranica_id. Stolpci so dodani posebej, ker tabela qr_kodovi
-- na produkciji že obstaja s podatki in je "create table if not exists" ne bi
-- spremenil.
alter table qr_kodovi add column if not exists stranica_id integer references link_stranice(id) on delete cascade;
alter table qr_kodovi add column if not exists redoslijed  integer not null default 0;
alter table qr_kodovi add column if not exists ikona       text not null default '';
alter table qr_kodovi add column if not exists boja        text not null default '';
alter table qr_kodovi add column if not exists naslovi     jsonb not null default '{}'::jsonb;
alter table qr_kodovi add column if not exists podnaslovi  jsonb not null default '{}'::jsonb;
alter table qr_kodovi add column if not exists vodi_na     integer references link_stranice(id) on delete set null;
-- Ikona iz iskalnika Iconify: očiščen crtež {vb, body}. Shrani se enkrat ob
-- izbiri, zato stran za goste nikoli ne kliče Iconifyja.
alter table qr_kodovi add column if not exists ikona_svg   jsonb;

create index if not exists qr_kodovi_stranica on qr_kodovi (stranica_id, redoslijed);

-- Katera stranica se je odprla ob tem skeniranju. Brez tega bi ob prevezavi
-- kode na drugo stranico stara skeniranja pripadla novi.
alter table qr_skeniranja add column if not exists stranica_id integer;

-- Supabase tabele iz sheme public sam objavi prek svojega javnega API-ja.
-- RLS brez pravil ta dostop zapre; naš strežnik se poveže neposredno kot
-- lastnik tabel in ga RLS ne omejuje.
alter table qr_kodovi enable row level security;
alter table qr_skeniranja enable row level security;
alter table link_stranice enable row level security;
`;

let pripravljeno: Promise<void> | null = null;

export function pripraviQrTabele() {
  pripravljeno ??= baza()
    .unsafe(SHEMA)
    .then(() => undefined)
    .catch((e) => {
      // Da naslednji obisk poskusi znova, namesto da si zapomni napako.
      pripravljeno = null;
      throw e;
    });
  return pripravljeno;
}
