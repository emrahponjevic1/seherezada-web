import { baza } from "@/app/(statistika)/_qr/baza";

// ---------------------------------------------------------------------------
// TABELA ODGOVOROV NA ANKETE
//
// Ena tabela za VSE ankete: vrstica = en izpolnjen obrazec. Kateri anketi
// pripada, pove stolpec `anketa` (slug). Za novo anketo zato ni nove tabele.
//
// Ta datoteka namerno NE kliče pripraviQrTabele() in se ne dotika tabel QR
// kod, skeniranj in strani s povezavami. Kode so natisnjene in visijo v
// lokalu — anketa jim ne sme ničesar spremeniti.
//
// ANONIMNOST
// Ni IP naslova, ni brskalnika, ni odtisa, ni ure — samo DATUM. V majhni
// ekipi bi že ura oddaje ("14:32, takrat je bil v pavzi samo ...") lahko
// izdala, kdo je pisal. Anketa obljubi 100 % anonimnost in tabela jo drži.
// ---------------------------------------------------------------------------

const SHEMA = `
create table if not exists ankete_odgovori (
  id        bigserial primary key,
  anketa    text not null,
  verzija   integer not null default 1,
  jezik     text not null,
  datum     date not null default ((now() at time zone 'Europe/Ljubljana')::date),
  odgovori  jsonb not null default '{}'::jsonb
);

create index if not exists ankete_odgovori_anketa on ankete_odgovori (anketa, datum);

-- Isto kot pri ostalih tabelah: Supabasov javni API je ne more ne brati ne
-- pisati. Naš strežnik se poveže kot lastnik in ga RLS ne omejuje.
alter table ankete_odgovori enable row level security;
`;

let pripravljeno: Promise<void> | null = null;

export function pripraviAnketeTabele() {
  pripravljeno ??= baza()
    .unsafe(SHEMA)
    .then(() => undefined)
    .catch((e) => {
      pripravljeno = null;
      throw e;
    });
  return pripravljeno;
}
