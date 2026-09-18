"use server";

import { revalidatePath } from "next/cache";
import { baza } from "@/app/(statistika)/_qr/baza";
import { bazniUrl } from "@/app/(statistika)/_qr/bazniUrl";
import { jePrijavljen } from "@/app/(statistika)/_qr/sesija";
import { pripraviQrTabele } from "@/app/(statistika)/_qr/shema";
import { SLUG, noviSlug } from "@/app/(statistika)/_qr/slug";
import { LOCATIONS } from "@/data/locations";
import { ocistiBoju } from "./boje";
import { jeInterno } from "./interniCilj";
import { PREFIKS_VANJSKI, IME_IKONE, ocistiIkonu, type IkonaSvg } from "./svgCisti";
import { ocistiTekst } from "./tekst";
import type { Tekst } from "./tipovi";

// ---------------------------------------------------------------------------
// SHRANJEVANJE STRANI S POVEZAVAMI
//
// Ena sama akcija shrani stran IN vse njene gumbe. Tako lastnik napiše vse na
// enem zaslonu in enkrat pritisne Spremi — brez koraka "najprej ustvari stran,
// potem dodajaj gumbe".
//
// Vse teče v eni transakciji: če en gumb pade, se ne shrani nič. Sicer bi
// ostala stran s polovico gumbov in lastnik ne bi vedel, kateri manjkajo.
//
// Akcija je javno dosegljiva točka, zato sama preveri prijavo in sama preveri
// vsak podatek, tudi tistega, ki ga je obrazec že preveril.
// ---------------------------------------------------------------------------

const ISTEKLA = "Prijava je istekla. Osvježi stranicu i prijavi se ponovo.";
const NAJVEC_DUGMADI = 24;

/** Naslovi, ki jih ne damo strani, da ne prekrijejo /links same. */
const ZAUZETI = new Set(["novi", "nova", "uredi", "api", "q", "statistika", "links"]);

export interface DugmeUnos {
  /** Obstoječi gumb obdrži id in s tem svojo statistiko. */
  id?: number;
  ikona: string;
  /** Crtež ikone iz iskalnika. Samo kadar se `ikona` začne z "x:". */
  ikonaSvg?: IkonaSvg | null;
  naziv: string;
  naslovi: Tekst;
  podnaslovi: Tekst;
  cilj: string;
  boja: string;
  aktivan: boolean;
}

export interface StranicaUnos {
  id?: number;
  slug: string;
  naziv: string;
  naslov: Tekst;
  podnaslov: Tekst;
  pozdrav: Tekst;
  podnozje: Tekst;
  boja: string;
  lokacija: string;
  glavna: boolean;
  aktivna: boolean;
}

type Rezultat = { greska: string } | { id: number; slug: string };

/** Naslov strani s povezavami, kakršnega dobi koda za cilj. */
function naslovStranice(slug: string) {
  return `${bazniUrl()}/links/${slug}`;
}

/**
 * Cilj gumba. Dovoljeni so: naša stran po jeziku gosta (interno:), spletni
 * naslov, telefon in e-pošta. Vse drugo zavrnemo — gumb, ki nikamor ne vodi,
 * je slabši od gumba, ki ga ni.
 */
function ocistiCilj(v: unknown): { cilj: string } | { greska: string } {
  const cilj = String(v ?? "").trim();
  if (!cilj) return { greska: "Dugme nema odredište." };
  if (cilj.length > 2000) return { greska: "Odredište je predugo." };

  if (cilj.startsWith("interno:")) {
    return jeInterno(cilj) ? { cilj } : { greska: "Ta stranica sajta ne postoji." };
  }
  if (/^tel:\+?[0-9 ()-]{5,}$/.test(cilj)) return { cilj };
  if (/^mailto:[^\s@]+@[^\s@]+$/.test(cilj)) return { cilj };

  let url: URL;
  try {
    url = new URL(cilj);
  } catch {
    return { greska: `Link „${cilj.slice(0, 40)}“ nije ispravan. Mora početi s https://` };
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    return { greska: "Link mora početi s https:// (ili http://)." };
  }
  // Gumb, ki kaže na naš kratki link, bi lahko zašel v neskončno zanko.
  if (/(^|\.)seherezada\.net$/i.test(url.hostname) && url.pathname.startsWith("/q/")) {
    return { greska: "Odredište ne može biti kratki QR link. Upiši pravi link." };
  }
  return { cilj };
}

export async function sacuvajLinktree(s: StranicaUnos, dugmad: DugmeUnos[]): Promise<Rezultat> {
  if (!(await jePrijavljen())) return { greska: ISTEKLA };

  const naziv = String(s.naziv ?? "").trim().slice(0, 80);
  if (!naziv) return { greska: "Upiši interno ime stranice, npr. „Stol Trubarjeva“." };

  const slug = String(s.slug ?? "").trim().toLowerCase();
  if (!SLUG.test(slug)) {
    return { greska: "Adresa smije imati samo mala slova, brojeve i crtice (2–40 znakova)." };
  }
  if (ZAUZETI.has(slug)) return { greska: `Adresa „${slug}“ je rezervisana. Izaberi drugu.` };

  if (!Array.isArray(dugmad)) return { greska: "Dugmad nisu ispravna." };
  if (dugmad.length > NAJVEC_DUGMADI) {
    return { greska: `Najviše ${NAJVEC_DUGMADI} dugmadi po stranici.` };
  }

  const lokacija = LOCATIONS.some((l) => l.id === s.lokacija) ? s.lokacija : "";

  // Gumbe pripravimo PRED transakcijo: če je kateri narobe, lastnik dobi
  // sporočilo, baza pa se sploh ne dotakne.
  const pripravljeni: (DugmeUnos & { cilj: string; redoslijed: number; ikonaSvg: IkonaSvg | null })[] = [];
  for (const [i, d] of dugmad.entries()) {
    const napis = String(d.naziv ?? "").trim().slice(0, 80);
    if (!napis) return { greska: `${i + 1}. dugme nema natpis.` };

    const cilj = ocistiCilj(d.cilj);
    if ("greska" in cilj) return { greska: `${napis}: ${cilj.greska}` };

    // Ikona iz iskalnika: ime mora biti pravo ime Iconify, crtež pa gre skozi
    // čistilnik tudi tu — brskalniku, ki ga pošilja, ne zaupamo.
    let ikona = String(d.ikona ?? "").trim().slice(0, 80);
    let ikonaSvg: IkonaSvg | null = null;
    if (ikona.startsWith(PREFIKS_VANJSKI)) {
      ikonaSvg = IME_IKONE.test(ikona.slice(PREFIKS_VANJSKI.length)) ? ocistiIkonu(d.ikonaSvg) : null;
      if (!ikonaSvg) return { greska: `${napis}: ikona iz pretrage nije ispravna. Izaberi je ponovo.` };
    } else {
      // Ključ s seznama ("i:tripadvisor") ali emoji — nič dolgega.
      ikona = ikona.slice(0, 24);
    }

    pripravljeni.push({
      id: typeof d.id === "number" && Number.isInteger(d.id) ? d.id : undefined,
      ikona,
      ikonaSvg,
      naziv: napis,
      naslovi: ocistiTekst(d.naslovi, 80),
      podnaslovi: ocistiTekst(d.podnaslovi, 120),
      cilj: cilj.cilj,
      boja: ocistiBoju(d.boja),
      aktivan: d.aktivan !== false,
      redoslijed: i,
    });
  }

  const polja = {
    slug,
    naziv,
    naslov: ocistiTekst(s.naslov, 60),
    podnaslov: ocistiTekst(s.podnaslov, 80),
    pozdrav: ocistiTekst(s.pozdrav, 120),
    podnozje: ocistiTekst(s.podnozje, 200),
    boja: ocistiBoju(s.boja),
    lokacija,
    glavna: s.glavna === true,
    aktivna: s.aktivna !== false,
  };

  await pripraviQrTabele();
  const sql = baza();

  try {
    const { id, stariSlug } = await sql.begin(async (tx) => {
      // Glavna je lahko samo ena; staro pobrišemo prej, sicer pade indeks.
      if (polja.glavna) {
        await tx`update link_stranice set glavna = false where glavna`;
      }

      let id: number;
      let stariSlug = "";

      if (s.id !== undefined) {
        const broj = Number(s.id);
        if (!Number.isInteger(broj)) throw new Error("NEPOSTOJECA");
        const [stara] = await tx<{ slug: string }[]>`
          select slug from link_stranice where id = ${broj}`;
        if (!stara) throw new Error("NEPOSTOJECA");
        stariSlug = stara.slug;

        await tx`
          update link_stranice set
            slug = ${polja.slug}, naziv = ${polja.naziv},
            naslov = ${tx.json(polja.naslov)}, podnaslov = ${tx.json(polja.podnaslov)},
            pozdrav = ${tx.json(polja.pozdrav)}, podnozje = ${tx.json(polja.podnozje)},
            boja = ${polja.boja}, lokacija = ${polja.lokacija},
            glavna = ${polja.glavna}, aktivna = ${polja.aktivna},
            izmijenjena = now()
          where id = ${broj}`;
        id = broj;
      } else {
        const [nova] = await tx<{ id: number }[]>`
          insert into link_stranice (slug, naziv, naslov, podnaslov, pozdrav, podnozje, boja, lokacija, glavna, aktivna)
          values (${polja.slug}, ${polja.naziv}, ${tx.json(polja.naslov)}, ${tx.json(polja.podnaslov)},
                  ${tx.json(polja.pozdrav)}, ${tx.json(polja.podnozje)}, ${polja.boja}, ${polja.lokacija},
                  ${polja.glavna}, ${polja.aktivna})
          returning id`;
        id = nova.id;
      }

      // Gumbi, ki jih v obrazcu ni več, so izbrisani. Skupaj z njimi gre tudi
      // njihova statistika — obrazec na to opozori, preden pošlje.
      const ostaju = pripravljeni.map((d) => d.id).filter((v): v is number => v !== undefined);
      if (ostaju.length) {
        await tx`delete from qr_kodovi where stranica_id = ${id} and id <> all(${ostaju})`;
      } else {
        await tx`delete from qr_kodovi where stranica_id = ${id}`;
      }

      for (const d of pripravljeni) {
        if (d.id !== undefined) {
          // Kratka povezava gumba se NE spreminja: statistika visi na njej.
          await tx`
            update qr_kodovi set
              naziv = ${d.naziv}, cilj = ${d.cilj}, aktivan = ${d.aktivan},
              ikona = ${d.ikona}, ikona_svg = ${d.ikonaSvg ? tx.json(d.ikonaSvg) : null},
              boja = ${d.boja}, redoslijed = ${d.redoslijed},
              naslovi = ${tx.json(d.naslovi)}, podnaslovi = ${tx.json(d.podnaslovi)},
              izmijenjen = now()
            where id = ${d.id} and stranica_id = ${id}`;
          continue;
        }

        // Nov gumb dobi svojo kratko povezavo. Trk je skoraj nemogoč, a ne
        // nemogoč — zato nekaj poskusov, ne en sam.
        let umetnut = false;
        for (let poskus = 0; poskus < 5 && !umetnut; poskus++) {
          try {
            await tx`
              insert into qr_kodovi (slug, naziv, cilj, nacin, aktivan, stil, biljeska,
                                     stranica_id, redoslijed, ikona, ikona_svg, boja, naslovi, podnaslovi)
              values (${noviSlug()}, ${d.naziv}, ${d.cilj}, 'mjeren', ${d.aktivan},
                      '{}'::jsonb, '', ${id}, ${d.redoslijed}, ${d.ikona},
                      ${d.ikonaSvg ? tx.json(d.ikonaSvg) : null}, ${d.boja},
                      ${tx.json(d.naslovi)}, ${tx.json(d.podnaslovi)})`;
            umetnut = true;
          } catch (e) {
            if ((e as { code?: string }).code !== "23505") throw e;
          }
        }
        if (!umetnut) throw new Error("SLUG");
      }

      // Kode, ki vodijo na to stran, morajo po preimenovanju kazati na novi
      // naslov. Odtisnjena koda tega ne ve — njen kratki link je isti.
      if (stariSlug && stariSlug !== polja.slug) {
        await tx`update qr_kodovi set cilj = ${naslovStranice(polja.slug)}, izmijenjen = now()
                 where vodi_na = ${id}`;
      }

      return { id, stariSlug };
    });

    revalidatePath(`/links/${polja.slug}`);
    if (stariSlug && stariSlug !== polja.slug) revalidatePath(`/links/${stariSlug}`);
    revalidatePath("/links");

    return { id, slug: polja.slug };
  } catch (e) {
    const koda = (e as { code?: string }).code;
    const poruka = (e as Error).message;
    if (koda === "23505") return { greska: "Ta adresa je već zauzeta. Izaberi drugu." };
    if (poruka === "NEPOSTOJECA") return { greska: "Stranica više ne postoji." };
    if (poruka === "SLUG") return { greska: "Nije uspjelo kreiranje kratkog linka. Pokušaj ponovo." };
    console.error("LINKTREE: shranjevanje ni uspelo", e);
    return { greska: "Čuvanje nije uspjelo (greška baze). Pokušaj ponovo." };
  }
}

export async function obrisiStranicu(id: number): Promise<{ greska?: string }> {
  if (!(await jePrijavljen())) return { greska: ISTEKLA };
  if (!Number.isInteger(id)) return { greska: "Stranica ne postoji." };

  const sql = baza();
  const [s] = await sql<{ slug: string }[]>`select slug from link_stranice where id = ${id}`;
  // Gumbi odidejo s stranjo (cascade), kode, ki so vodile nanjo, ostanejo in
  // gosta pošljejo na naslovnico, dokler jim lastnik ne da novega cilja.
  await sql`delete from link_stranice where id = ${id}`;

  if (s) revalidatePath(`/links/${s.slug}`);
  revalidatePath("/links");
  return {};
}
