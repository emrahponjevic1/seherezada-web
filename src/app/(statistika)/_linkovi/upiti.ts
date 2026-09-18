import { baza } from "@/app/(statistika)/_qr/baza";
import type { Raspon } from "@/app/(statistika)/_qr/raspon";
import type { LinkDugme, LinkStranica } from "./tipovi";

// ---------------------------------------------------------------------------
// POIZVEDBE ZA STRANI S POVEZAVAMI
//
// Enaka pravila kot pri kodah: ljubljanski čas, boti se nikjer ne štejejo.
//
// Dve različni številki, ki ju ni dovoljeno zamenjati:
//   OTVARANJA — skeniranja kod, ki so odprle to stran (qr_skeniranja.stranica_id)
//   KLIKOVI   — kliki na gumbe te strani (skeniranja gumbov, qr_kodovi.stranica_id)
// ---------------------------------------------------------------------------

const TZ = "Europe/Ljubljana";

type Sql = ReturnType<typeof baza>;

/** Pogoj obdobja; enak kot v _qr/upiti.ts, le da je tu samostojen. */
function odKad(sql: Sql, raspon: Raspon) {
  return raspon.dani === null
    ? sql`true`
    : sql`s.vrijeme >= ((date_trunc('day', now() at time zone ${TZ}) - make_interval(days => ${
        raspon.dani - 1
      })) at time zone ${TZ})`;
}

export type StranicaSaBrojem = LinkStranica & {
  dugmadi: number;
  otvaranja: number;
  klikovi: number;
};

/** Vse strani za seznam na /statistika. */
export async function sveStranice(raspon: Raspon) {
  const sql = baza();
  const obdobje = odKad(sql, raspon);
  return sql<StranicaSaBrojem[]>`
    select p.*,
      (select count(*) from qr_kodovi d where d.stranica_id = p.id)::int as dugmadi,
      (select count(*) from qr_skeniranja s
         where s.stranica_id = p.id and not s.bot and ${obdobje})::int as otvaranja,
      (select count(*) from qr_skeniranja s
         join qr_kodovi d on d.id = s.kod_id
         where d.stranica_id = p.id and not s.bot and ${obdobje})::int as klikovi
    from link_stranice p
    order by p.glavna desc, p.kreirana desc`;
}

/** Samo ime in naslov — za izbirnik odredišta v oblikovalniku kod. */
export async function popisStranica() {
  const sql = baza();
  return sql<{ id: number; slug: string; naziv: string; aktivna: boolean }[]>`
    select id, slug, naziv, aktivna from link_stranice order by naziv`;
}

export async function jednaStranica(id: number) {
  const sql = baza();
  const [s] = await sql<LinkStranica[]>`select * from link_stranice where id = ${id}`;
  return s ?? null;
}

/** Stran za gosta. Ugasnjene ne vrne — gost gre takrat na naslovnico. */
export async function stranicaPoSlugu(slug: string) {
  const sql = baza();
  const [s] = await sql<LinkStranica[]>`
    select * from link_stranice where slug = ${slug.toLowerCase()} and aktivna limit 1`;
  return s ?? null;
}

export async function glavnaStranica() {
  const sql = baza();
  const [s] = await sql<LinkStranica[]>`
    select * from link_stranice where glavna and aktivna limit 1`;
  return s ?? null;
}

/** Gumbi za gosta: samo prižgani, v izbranem vrstnem redu. */
export async function vidljivaDugmad(stranicaId: number) {
  const sql = baza();
  return sql<LinkDugme[]>`
    select id, slug, naziv, cilj, aktivan, redoslijed, ikona, ikona_svg, boja, naslovi, podnaslovi
    from qr_kodovi
    where stranica_id = ${stranicaId} and aktivan
    order by redoslijed, id`;
}

/** Vsi gumbi za urejanje — tudi ugasnjeni. */
export async function svaDugmad(stranicaId: number) {
  const sql = baza();
  return sql<LinkDugme[]>`
    select id, slug, naziv, cilj, aktivan, redoslijed, ikona, ikona_svg, boja, naslovi, podnaslovi
    from qr_kodovi
    where stranica_id = ${stranicaId}
    order by redoslijed, id`;
}

export type DugmeSaBrojem = LinkDugme & { u_rasponu: number; ukupno: number; zadnje: Date | null };

/** Gumbi s številkami klikov — tabela na strani linktreeja. */
export async function dugmadSaBrojem(stranicaId: number, raspon: Raspon) {
  const sql = baza();
  return sql<DugmeSaBrojem[]>`
    select k.id, k.slug, k.naziv, k.cilj, k.aktivan, k.redoslijed, k.ikona, k.ikona_svg, k.boja,
           k.naslovi, k.podnaslovi,
      count(s.id) filter (where not s.bot and ${odKad(sql, raspon)})::int as u_rasponu,
      count(s.id) filter (where not s.bot)::int as ukupno,
      max(s.vrijeme) filter (where not s.bot) as zadnje
    from qr_kodovi k
    left join qr_skeniranja s on s.kod_id = k.id
    where k.stranica_id = ${stranicaId}
    group by k.id
    order by k.redoslijed, k.id`;
}

/**
 * Kode, ki vodijo na to stran, s številom skeniranj.
 *
 * Šteje se po qr_skeniranja.stranica_id, ne po tem, kam koda kaže danes:
 * prevezana koda mora svoja stara skeniranja pustiti pri stari strani.
 */
export async function kodoviZaStranicu(stranicaId: number, raspon: Raspon) {
  const sql = baza();
  return sql<{ id: number; naziv: string; slug: string; u_rasponu: number; ukupno: number }[]>`
    select k.id, k.naziv, k.slug,
      count(s.id) filter (where not s.bot and ${odKad(sql, raspon)})::int as u_rasponu,
      count(s.id) filter (where not s.bot)::int as ukupno
    from qr_kodovi k
    left join qr_skeniranja s on s.kod_id = k.id and s.stranica_id = ${stranicaId}
    where k.vodi_na = ${stranicaId}
    group by k.id
    order by k.kreiran`;
}

/** Koliko je bila stran odprta (skeniranja kod, ki so vodile nanjo). */
export async function otvaranjaStranice(stranicaId: number, raspon: Raspon) {
  const sql = baza();
  const [r] = await sql<{ otvaranja: number; jedinstveni: number }[]>`
    select
      count(*) filter (where not s.bot)::int as otvaranja,
      count(distinct s.posjetilac) filter (where not s.bot)::int as jedinstveni
    from qr_skeniranja s
    where s.stranica_id = ${stranicaId} and ${odKad(sql, raspon)}`;
  return r ?? { otvaranja: 0, jedinstveni: 0 };
}
