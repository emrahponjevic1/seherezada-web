"use server";

import { baza } from "@/app/(statistika)/_qr/baza";
import { bazniUrl } from "./bazniUrl";
import { jePrijavljen } from "@/app/(statistika)/_qr/sesija";
import { pripraviQrTabele, type Nacin } from "./shema";
import { SLUG, noviSlug } from "./slug";
import { ocistiStil } from "./stil";

// ---------------------------------------------------------------------------
// STREŽNIŠKE AKCIJE ZA QR KODE
//
// Vsaka akcija je javno dosegljiva točka — kdorkoli ji lahko pošlje zahtevo,
// ne samo naš obrazec. Zato vsaka SAMA preveri prijavo in SAMA preveri vse
// podatke, tudi če jih je brskalnik že preveril.
// ---------------------------------------------------------------------------

export interface PodaciKoda {
  id?: number;
  naziv: string;
  cilj: string;
  /**
   * Id strani s povezavami, na katero naj koda vodi. Kadar je postavljen,
   * se cilj sestavi iz naslova te strani in polje cilj se prezre — tako
   * preimenovanje strani ne pusti kode na starem naslovu.
   */
  vodiNa?: number | null;
  nacin: Nacin;
  slug: string;
  aktivan: boolean;
  biljeska: string;
  stil: unknown;
}

type Rezultat = { greska: string } | { id: number };

const ISTEKLA = "Prijava je istekla. Osvježi stranicu i prijavi se ponovo.";

export async function sacuvajKod(p: PodaciKoda): Promise<Rezultat> {
  if (!(await jePrijavljen())) return { greska: ISTEKLA };

  const naziv = String(p.naziv ?? "").trim().slice(0, 80);
  if (!naziv) return { greska: "Upiši naziv koda, npr. „Google recenzija — sto“." };

  // Odredište je lahko naša stran s povezavami. Takrat ga sestavimo sami iz
  // njenega naslova, da ga lastnik ne more natipkati narobe.
  let cilj = String(p.cilj ?? "").trim();
  let vodiNa: number | null = null;
  if (p.vodiNa !== undefined && p.vodiNa !== null) {
    const idStranice = Number(p.vodiNa);
    if (!Number.isInteger(idStranice)) return { greska: "Stranica s linkovima ne postoji." };
    await pripraviQrTabele();
    const [stranica] = await baza()<{ slug: string }[]>`
      select slug from link_stranice where id = ${idStranice}`;
    if (!stranica) return { greska: "Ta stranica s linkovima više ne postoji." };
    vodiNa = idStranice;
    cilj = `${bazniUrl()}/links/${stranica.slug}`;
  }

  let url: URL;
  try {
    url = new URL(cilj);
  } catch {
    return { greska: "Link nije ispravan. Mora početi s https://" };
  }
  if (!["http:", "https:"].includes(url.protocol) || cilj.length > 2000) {
    return { greska: "Link mora početi s https:// (ili http://) i ne smije biti duži od 2000 znakova." };
  }
  // Kod, ki kaže na drug naš kratki link, bi lahko zašel v neskončno zanko.
  if (/(^|\.)seherezada\.net$/i.test(url.hostname) && url.pathname.startsWith("/q/")) {
    return { greska: "Odredište ne može biti drugi QR kratki link. Upiši pravi link." };
  }

  const nacin: Nacin = p.nacin === "direktan" ? "direktan" : "mjeren";
  const aktivan = p.aktivan !== false;
  const biljeska = String(p.biljeska ?? "").trim().slice(0, 500);
  const stil = JSON.parse(JSON.stringify(ocistiStil(p.stil)));

  await pripraviQrTabele();
  const sql = baza();

  try {
    if (p.id !== undefined) {
      const id = Number(p.id);
      if (!Number.isInteger(id)) return { greska: "Kod ne postoji." };
      // Slug se po nastanku ne spreminja: odtisnjeni kodi bi sicer nehali delovati.
      const [r] = await sql<{ id: number }[]>`
        update qr_kodovi set
          naziv = ${naziv}, cilj = ${cilj}, nacin = ${nacin}, aktivan = ${aktivan},
          biljeska = ${biljeska}, stil = ${sql.json(stil)}, vodi_na = ${vodiNa},
          izmijenjen = now()
        where id = ${id}
        returning id`;
      return r ? { id: r.id } : { greska: "Kod više ne postoji." };
    }

    const slug = String(p.slug ?? "").trim().toLowerCase() || noviSlug();
    if (!SLUG.test(slug)) {
      return { greska: "Kratki link smije imati samo mala slova, brojeve i crtice (2–40 znakova)." };
    }
    const [r] = await sql<{ id: number }[]>`
      insert into qr_kodovi (slug, naziv, cilj, nacin, aktivan, biljeska, stil, vodi_na)
      values (${slug}, ${naziv}, ${cilj}, ${nacin}, ${aktivan}, ${biljeska}, ${sql.json(stil)}, ${vodiNa})
      returning id`;
    return { id: r.id };
  } catch (e) {
    if ((e as { code?: string }).code === "23505") {
      return { greska: "Taj kratki link je već zauzet. Izaberi drugi." };
    }
    console.error("QR: shranjevanje ni uspelo", e);
    return { greska: "Čuvanje nije uspjelo (greška baze). Pokušaj ponovo." };
  }
}

export async function obrisiKod(id: number): Promise<{ greska?: string }> {
  if (!(await jePrijavljen())) return { greska: ISTEKLA };
  if (!Number.isInteger(id)) return { greska: "Kod ne postoji." };
  const sql = baza();
  await sql`delete from qr_kodovi where id = ${id}`;
  return {};
}
