import { baza } from "./baza";

// ---------------------------------------------------------------------------
// TABELA ZA ZAVORO PRIJAVE
//
// admin_prijave: poskusi prijave za zavoro proti ugibanju gesla. Na Vercelu
// vsaka zahteva lahko teče na drugem strežniškem primerku, zato štetje v
// pomnilniku ne zadošča — števec mora biti v bazi.
//
// Namesto IP naslova je shranjen samo njegov podpis (glej odtisIp), zapisi
// starejši od enega dne se brišejo.
// ---------------------------------------------------------------------------

const SHEMA = `
create table if not exists admin_prijave (
  kljuc    text not null,
  vrijeme  timestamptz not null default now()
);

create index if not exists admin_prijave_kljuc_vrijeme on admin_prijave (kljuc, vrijeme);

-- Zapre dostop prek Supabase javnega API-ja (glej _qr/shema.ts).
alter table admin_prijave enable row level security;
`;

let pripravljeno: Promise<void> | null = null;

export function pripraviZajednickeTabele() {
  pripravljeno ??= baza()
    .unsafe(SHEMA)
    .then(() => undefined)
    .catch((e) => {
      pripravljeno = null;
      throw e;
    });
  return pripravljeno;
}
