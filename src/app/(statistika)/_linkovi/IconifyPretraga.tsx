"use client";

import { useEffect, useState } from "react";
import { Ikona } from "./Ikone";
import { IME_IKONE, PREFIKS_VANJSKI, ocistiIkonu, type IkonaSvg } from "./svgCisti";
import s from "@/app/(statistika)/_qr/Statistika.module.css";
import p from "./Panel.module.css";

// ---------------------------------------------------------------------------
// ISKANJE IKON (ICONIFY)
//
// Samo v nadzorni plošči, samo med izbiranjem. Iskanje gre iz lastnikovega
// brskalnika na api.iconify.design; gost ga nikoli ne pokliče. Izbrana ikona
// se ob Spremi zapiše v bazo in od tam naprej je naša.
//
// PAST: OMEJITEV ZAHTEV (429)
// Prva različica je vsako sličico naložila posebej kot <img> — do 64 zahtev
// na iskanje, in iskanje teče med tipkanjem. Iconify je po nekaj iskanjih
// začel vračati 429 (preveč zahtev), sličice so bile polomljene za lastnika
// in za vsakogar na istem omrežju.
//
// Zdaj:
//   * iskanje je omejeno na nekaj dobrih zbirk (ZBIRKE spodaj),
//   * crteži se naložijo SKUPAJ — ena zahteva na zbirko, ne na ikono,
//   * kar je že naloženo, se ne nalaga znova (predpomnilnik v modulu).
// Tako je iskanje največ ~9 zahtev namesto 65.
//
// Stranski učinek, ki je dobrodošel: sličica je že očiščen crtež, torej
// natanko to, kar bo videl gost — ne slika z Iconifyjevega strežnika.
//
// Referrer iz /statistika je izklopljen v next.config.ts, zato Iconify ne
// izve niti, s katere strani prihaja poizvedba.
// ---------------------------------------------------------------------------

const API = "https://api.iconify.design";

/**
 * Zbirke, po katerih iščemo. Dovolj za vse, kar rabi restavracija: znamke
 * (simple-icons, thesvg, fa6-brands — Glovo, Booking, TripAdvisor ...) in
 * nekaj čistih splošnih zbirk v črtnem ali polnem slogu.
 *
 * thesvg je dodan zaradi Wolta: v simple-icons ga ni, preverjeno.
 */
const ZBIRKE = ["simple-icons", "thesvg", "fa6-brands", "tabler", "lucide", "mdi", "ph", "material-symbols"];

const NAJVEC_ZADETKOV = 48;

type Zadetek = { ime: string; svg: IkonaSvg };
type Stanje = "miruje" | "trazi" | "prazno" | "greska" | "omejeno";

/** Že naloženi crteži, da ponovljeno iskanje ne kliče Iconifyja znova. */
const predpomnilnik = new Map<string, IkonaSvg | null>();

type IkonaIzApi = { body?: string; width?: number; height?: number; left?: number; top?: number };
type ZbirkaIzApi = IkonaIzApi & {
  icons?: Record<string, IkonaIzApi>;
  aliases?: Record<string, { parent?: string }>;
};

class Omejeno extends Error {}

async function naloziJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const odgovor = await fetch(url, { signal });
  if (odgovor.status === 429) throw new Omejeno();
  if (!odgovor.ok) throw new Error(String(odgovor.status));
  return (await odgovor.json()) as T;
}

/** Crteži vseh imen iz ene zbirke v eni zahtevi. */
async function naloziZbirku(zbirka: string, imena: string[], signal: AbortSignal) {
  const manjka = imena.filter((n) => !predpomnilnik.has(`${zbirka}:${n}`));
  if (manjka.length) {
    const podaci = await naloziJson<ZbirkaIzApi>(
      `${API}/${zbirka}.json?icons=${manjka.map(encodeURIComponent).join(",")}`,
      signal
    );
    for (const naziv of manjka) {
      // Iskalnik včasih vrne sinonim; risba je takrat pri "staršu".
      const stars = podaci.aliases?.[naziv]?.parent;
      const ikona = podaci.icons?.[naziv] ?? (stars ? podaci.icons?.[stars] : undefined);
      let svg: IkonaSvg | null = null;
      if (ikona?.body) {
        // Iconify privzeto riše na 16 × 16, kadar zbirka ne pove drugače.
        const w = ikona.width ?? podaci.width ?? 16;
        const h = ikona.height ?? podaci.height ?? 16;
        const l = ikona.left ?? podaci.left ?? 0;
        const t = ikona.top ?? podaci.top ?? 0;
        svg = ocistiIkonu({ vb: `${l} ${t} ${w} ${h}`, body: ikona.body });
      }
      predpomnilnik.set(`${zbirka}:${naziv}`, svg);
    }
  }
  return imena;
}

export default function IconifyPretraga({
  odabrano,
  naOdabir,
}: {
  /** Trenutna vrednost polja `ikona` gumba. */
  odabrano: string;
  naOdabir: (ikona: string, svg: IkonaSvg) => void;
}) {
  const [upit, setUpit] = useState("");
  const [zadeci, setZadeci] = useState<Zadetek[]>([]);
  const [stanje, setStanje] = useState<Stanje>("miruje");

  useEffect(() => {
    const q = upit.trim();
    if (q.length < 2) {
      setZadeci([]);
      setStanje("miruje");
      return;
    }
    const prekid = new AbortController();
    // Daljši zamik kot običajno: vsako iskanje je nekaj zahtev na tuj strežnik.
    const cakaj = setTimeout(async () => {
      setStanje("trazi");
      try {
        const podaci = await naloziJson<{ icons?: unknown }>(
          `${API}/search?query=${encodeURIComponent(q)}&limit=${NAJVEC_ZADETKOV}&prefixes=${ZBIRKE.join(",")}`,
          prekid.signal
        );
        const imena = (Array.isArray(podaci.icons) ? podaci.icons : []).filter(
          (x): x is string => typeof x === "string" && IME_IKONE.test(x)
        );

        const poZbirkama = new Map<string, string[]>();
        for (const ime of imena) {
          const [zbirka, naziv] = ime.split(":");
          poZbirkama.set(zbirka, [...(poZbirkama.get(zbirka) ?? []), naziv]);
        }
        await Promise.all(
          [...poZbirkama].map(([zbirka, nazivi]) => naloziZbirku(zbirka, nazivi, prekid.signal))
        );
        if (prekid.signal.aborted) return;

        const gotovi: Zadetek[] = [];
        for (const ime of imena) {
          const svg = predpomnilnik.get(ime);
          if (svg) gotovi.push({ ime, svg });
        }
        setZadeci(gotovi);
        setStanje(gotovi.length ? "miruje" : "prazno");
      } catch (e) {
        if (prekid.signal.aborted) return;
        setStanje(e instanceof Omejeno ? "omejeno" : "greska");
      }
    }, 500);
    return () => {
      clearTimeout(cakaj);
      prekid.abort();
    };
  }, [upit]);

  return (
    <div className={p.pretraga}>
      <input
        type="search"
        className={s.unos}
        value={upit}
        onChange={(e) => setUpit(e.target.value)}
        placeholder="Traži još ikona — na engleskom: wolt, pizza, wifi, parking…"
        aria-label="Traži ikonu"
      />

      {stanje === "trazi" && <span className={s.pomoc}>Tražim…</span>}
      {stanje === "prazno" && (
        <span className={s.pomoc}>Ništa za „{upit.trim()}“. Probaj jednu riječ na engleskom (npr. „menu“).</span>
      )}
      {stanje === "omejeno" && (
        <span className={s.pomoc}>
          Iconify je privremeno ograničio pretragu (previše zahtjeva). Pričekaj minutu pa probaj ponovo — ugrađene
          ikone iznad rade i dalje.
        </span>
      )}
      {stanje === "greska" && (
        <span className={s.pomoc}>Pretraga trenutno ne radi. Ugrađene ikone iznad rade uvijek.</span>
      )}

      {zadeci.length > 0 && (
        <div className={p.rezultati}>
          {zadeci.map(({ ime, svg }) => {
            const kljuc = `${PREFIKS_VANJSKI}${ime}`;
            return (
              <button
                key={ime}
                type="button"
                title={ime}
                aria-label={ime}
                aria-pressed={odabrano === kljuc}
                className={`${p.ikonaIzbor} ${odabrano === kljuc ? p.ikonaAktivna : ""}`}
                onClick={() => naOdabir(kljuc, svg)}
              >
                {/* Že očiščen crtež — natanko to, kar dobi gost. */}
                <Ikona ime={kljuc} svg={svg} velicina={22} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
