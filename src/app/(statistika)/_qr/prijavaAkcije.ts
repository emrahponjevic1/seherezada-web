"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { baza, imaBazu } from "./baza";
import { gesloNastavljeno, odjaviSesijo, odtisIp, preveriGeslo, ustvariSesijo } from "./sesija";
import { pripraviZajednickeTabele } from "./shemaPrijava";

// ---------------------------------------------------------------------------
// PRIJAVA IN ODJAVA NA /statistika
//
// Zavora: največ 8 poskusov v 15 minutah z istega naslova. Števec je v bazi,
// ker na Vercelu vsaka zahteva lahko teče na drugem primerku strežnika. Če
// baza ni dosegljiva, zavora pade nazaj na pomnilnik — slabše, a ne izklopi
// prijave v celoti.
// ---------------------------------------------------------------------------

const OKNO_MIN = 15;
const NAJVEC_POSKUSOV = 8;
const pomnilnik = new Map<string, number[]>();

function prehitroPomnilnik(kljuc: string) {
  const zdaj = Date.now();
  const prej = (pomnilnik.get(kljuc) ?? []).filter((t) => zdaj - t < OKNO_MIN * 60_000);
  prej.push(zdaj);
  pomnilnik.set(kljuc, prej);
  if (pomnilnik.size > 500) pomnilnik.clear();
  return prej.length > NAJVEC_POSKUSOV;
}

async function prehitro(kljuc: string) {
  if (imaBazu()) {
    try {
      await pripraviZajednickeTabele();
      const sql = baza();
      await sql`delete from admin_prijave where vrijeme < now() - interval '1 day'`;
      await sql`insert into admin_prijave (kljuc) values (${kljuc})`;
      const [{ broj }] = await sql<{ broj: number }[]>`
        select count(*)::int as broj from admin_prijave
        where kljuc = ${kljuc} and vrijeme > now() - make_interval(mins => ${OKNO_MIN})`;
      return broj > NAJVEC_POSKUSOV;
    } catch (e) {
      console.error("Statistika: zavora prijave ne more do baze, uporabljam pomnilnik", e);
    }
  }
  return prehitroPomnilnik(kljuc);
}

export async function prijava(podatki: FormData) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "neznan";
  const kljuc = odtisIp(ip);

  if (!gesloNastavljeno()) redirect("/statistika?greska=nema-gesla");
  if (await prehitro(kljuc)) redirect("/statistika?greska=prepogosto");
  if (!preveriGeslo(String(podatki.get("geslo") ?? ""))) redirect("/statistika?greska=geslo");

  // Uspešna prijava pobriše števec, da lastnik ne ostane zaklenjen zaradi
  // lastnih tipkarskih napak od prej.
  if (imaBazu()) {
    await baza()`delete from admin_prijave where kljuc = ${kljuc}`.catch(() => undefined);
  }
  pomnilnik.delete(kljuc);

  await ustvariSesijo();
  redirect("/statistika");
}

export async function odjava() {
  await odjaviSesijo();
  redirect("/statistika");
}
