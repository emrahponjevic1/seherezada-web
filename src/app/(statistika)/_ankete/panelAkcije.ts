"use server";

import { baza, imaBazu } from "@/app/(statistika)/_qr/baza";
import { jePrijavljen } from "@/app/(statistika)/_qr/sesija";

// ---------------------------------------------------------------------------
// AKCIJE V PLOŠČI (samo prijavljen lastnik)
//
// Brišemo IZKLJUČNO iz ankete_odgovori in samo eno vrstico, ki mora pripadati
// navedeni anketi. Tabel QR kod ta datoteka ne pozna.
// ---------------------------------------------------------------------------

export async function obrisiOdgovor(slug: string, id: number): Promise<{ greska?: string }> {
  if (!(await jePrijavljen())) return { greska: "Nisi prijavljen." };
  if (!imaBazu()) return { greska: "Baza nije povezana." };
  if (!Number.isInteger(id) || id <= 0) return { greska: "Neispravan odgovor." };

  try {
    const r = await baza()`delete from ankete_odgovori where id = ${id} and anketa = ${String(slug)}`;
    if (r.count === 0) return { greska: "Odgovor ne postoji (možda je već obrisan)." };
    return {};
  } catch (e) {
    console.error("ANKETA: brisanje nije uspjelo", e);
    return { greska: "Brisanje nije uspjelo. Pokušaj ponovo." };
  }
}
