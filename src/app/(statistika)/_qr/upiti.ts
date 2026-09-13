import { baza } from "@/app/(statistika)/_qr/baza";
import type { QrKod } from "./shema";
import type { Raspon } from "./raspon";

// ---------------------------------------------------------------------------
// POIZVEDBE ZA STATISTIKO
//
// Vsi dnevi in ure so po ljubljanskem času, ne po UTC — sicer bi skeniranje
// ob 23.30 padlo v naslednji dan in "po urah" bi bilo zamaknjeno za 1–2 uri.
// Skeniranja z oznako bot se nikjer ne štejejo.
// ---------------------------------------------------------------------------

const TZ = "Europe/Ljubljana";

type Sql = ReturnType<typeof baza>;

function uslov(sql: Sql, kodId: number | null, raspon: Raspon) {
  const kod = kodId === null ? sql`true` : sql`s.kod_id = ${kodId}`;
  const od =
    raspon.dani === null
      ? sql`true`
      : sql`s.vrijeme >= ((date_trunc('day', now() at time zone ${TZ}) - make_interval(days => ${
          raspon.dani - 1
        })) at time zone ${TZ})`;
  return sql`not s.bot and ${kod} and ${od}`;
}

export type KodSaBrojem = QrKod & { u_rasponu: number; ukupno: number; zadnje: Date | null };

export async function sviKodovi(raspon: Raspon) {
  const sql = baza();
  return sql<KodSaBrojem[]>`
    select k.*,
      count(s.id) filter (where ${uslov(sql, null, raspon)})::int as u_rasponu,
      count(s.id) filter (where not s.bot)::int as ukupno,
      max(s.vrijeme) filter (where not s.bot) as zadnje
    from qr_kodovi k
    left join qr_skeniranja s on s.kod_id = k.id
    group by k.id
    order by k.kreiran desc`;
}

export async function jedanKod(id: number) {
  const sql = baza();
  const [kod] = await sql<QrKod[]>`select * from qr_kodovi where id = ${id}`;
  return kod ?? null;
}

export async function brojke(kodId: number | null, raspon: Raspon) {
  const sql = baza();
  const [r] = await sql<
    { skeniranja: number; jedinstveni: number; boti: number; zadnje: Date | null; prvo: Date | null }[]
  >`
    select
      count(*) filter (where not s.bot)::int as skeniranja,
      count(distinct s.posjetilac) filter (where not s.bot)::int as jedinstveni,
      count(*) filter (where s.bot)::int as boti,
      max(s.vrijeme) filter (where not s.bot) as zadnje,
      min(s.vrijeme) filter (where not s.bot) as prvo
    from qr_skeniranja s
    where ${kodId === null ? sql`true` : sql`s.kod_id = ${kodId}`}
      and ${
        raspon.dani === null
          ? sql`true`
          : sql`s.vrijeme >= ((date_trunc('day', now() at time zone ${TZ}) - make_interval(days => ${
              raspon.dani - 1
            })) at time zone ${TZ})`
      }`;
  return r;
}

export interface Stupac {
  kljuc: string;
  broj: number;
}

/**
 * Skeniranja po dnevih. Dnevi brez skeniranj so zapisani z 0 — graf z
 * manjkajočimi dnevi bi lagal o tem, kako enakomeren je promet.
 * Nad 120 dnevi se združi po tednih, sicer so stolpci tanjši od piksla.
 */
export async function poDanima(kodId: number | null, raspon: Raspon) {
  const sql = baza();
  const kod = kodId === null ? sql`true` : sql`s.kod_id = ${kodId}`;

  const [{ danas, prvi }] = await sql<{ danas: string; prvi: string | null }[]>`
    select to_char((now() at time zone ${TZ})::date, 'YYYY-MM-DD') as danas,
      to_char(min((s.vrijeme at time zone ${TZ})::date), 'YYYY-MM-DD') as prvi
    from qr_skeniranja s where not s.bot and ${kod}`;

  let pocetak: string;
  if (raspon.dani !== null) {
    const d = new Date(`${danas}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - (raspon.dani - 1));
    pocetak = d.toISOString().slice(0, 10);
  } else {
    pocetak = prvi && prvi < danas ? prvi : danas;
  }

  const razmak = (Date.parse(danas) - Date.parse(pocetak)) / 86_400_000 + 1;
  const jedinica = razmak > 120 ? "week" : "day";

  const redovi = await sql<Stupac[]>`
    with dani as (
      select generate_series(
        date_trunc(${jedinica}, ${pocetak}::date)::date,
        ${danas}::date,
        ${jedinica === "week" ? "7 days" : "1 day"}::interval
      )::date as dan
    ),
    brojevi as (
      select date_trunc(${jedinica}, s.vrijeme at time zone ${TZ})::date as dan, count(*)::int as broj
      from qr_skeniranja s
      where not s.bot and ${kod}
        and s.vrijeme >= (${pocetak}::date::timestamp at time zone ${TZ})
      group by 1
    )
    select to_char(d.dan, 'YYYY-MM-DD') as kljuc, coalesce(b.broj, 0)::int as broj
    from dani d left join brojevi b on b.dan = d.dan
    order by d.dan`;

  return { stupci: redovi, jedinica: jedinica as "day" | "week" };
}

export async function poSatima(kodId: number, raspon: Raspon) {
  const sql = baza();
  const redovi = await sql<{ sat: number; broj: number }[]>`
    select extract(hour from s.vrijeme at time zone ${TZ})::int as sat, count(*)::int as broj
    from qr_skeniranja s where ${uslov(sql, kodId, raspon)}
    group by 1`;
  return Array.from({ length: 24 }, (_, sat) => ({
    kljuc: String(sat),
    broj: redovi.find((r) => r.sat === sat)?.broj ?? 0,
  }));
}

export async function poDanuSedmice(kodId: number, raspon: Raspon) {
  const sql = baza();
  const redovi = await sql<{ dan: number; broj: number }[]>`
    select extract(isodow from s.vrijeme at time zone ${TZ})::int as dan, count(*)::int as broj
    from qr_skeniranja s where ${uslov(sql, kodId, raspon)}
    group by 1`;
  return Array.from({ length: 7 }, (_, i) => ({
    kljuc: String(i + 1),
    broj: redovi.find((r) => r.dan === i + 1)?.broj ?? 0,
  }));
}

/** Stolpci, po katerih je dovoljeno razvrščati. Nič od zunaj ne pride v SQL. */
const POLJA = {
  drzava: "s.drzava",
  grad: "case when s.grad is null then null else s.grad || coalesce(', ' || s.drzava, '') end",
  uredjaj: "s.uredjaj",
  os: "s.os",
  preglednik: "s.preglednik",
  proizvodjac: "s.proizvodjac",
  model: "case when s.model is null then null else coalesce(s.proizvodjac || ' ', '') || s.model end",
  jezik: "s.jezik",
} as const;

export type Polje = keyof typeof POLJA;

export async function raspodjela(kodId: number, raspon: Raspon, polje: Polje) {
  const sql = baza();
  return sql<{ vrijednost: string | null; broj: number }[]>`
    select ${sql.unsafe(POLJA[polje])} as vrijednost, count(*)::int as broj
    from qr_skeniranja s where ${uslov(sql, kodId, raspon)}
    group by 1 order by 2 desc, 1`;
}

export type Skeniranje = {
  id: string;
  vrijeme: Date;
  drzava: string | null;
  regija: string | null;
  grad: string | null;
  uredjaj: string | null;
  proizvodjac: string | null;
  model: string | null;
  os: string | null;
  os_verzija: string | null;
  preglednik: string | null;
  jezik: string | null;
  bot: boolean;
};

export async function zadnjaSkeniranja(kodId: number, koliko: number | null, sBotima = false) {
  const sql = baza();
  return sql<Skeniranje[]>`
    select id::text, vrijeme, drzava, regija, grad, uredjaj, proizvodjac, model, os, os_verzija, preglednik, jezik, bot
    from qr_skeniranja s
    where s.kod_id = ${kodId} ${sBotima ? sql`` : sql`and not s.bot`}
    order by s.vrijeme desc
    ${koliko === null ? sql`` : sql`limit ${koliko}`}`;
}
