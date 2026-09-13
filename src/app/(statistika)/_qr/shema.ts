import { baza } from "@/app/(statistika)/_qr/baza";
import type { QrStil } from "./stil";

// ---------------------------------------------------------------------------
// TABELE QR KOD
//
// Tabele se ustvarijo same ob prvem obisku /statistika, zato lastniku
// ni treba ničesar poganjati ročno. "if not exists" pomeni, da ponovni klic
// ničesar ne pokvari. Preusmeritev /q/... tega ne kliče — tam šteje vsaka
// milisekunda, pred prvim kodom pa tako ali tako ni kaj preusmerjati.
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

-- Supabase tabele iz sheme public sam objavi prek svojega javnega API-ja.
-- RLS brez pravil ta dostop zapre; naš strežnik se poveže neposredno kot
-- lastnik tabel in ga RLS ne omejuje.
alter table qr_kodovi enable row level security;
alter table qr_skeniranja enable row level security;
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
