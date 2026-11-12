"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { posaljiAnketu } from "./akcije";
import type { UI } from "./tekst";
import a from "./Anketa.module.css";

// ---------------------------------------------------------------------------
// OBRAZEC ANKETE (v brskalniku)
//
// Dobi anketo samo v izbranem jeziku. Obvezna vprašanja preveri tu, da človek
// takoj vidi, kaj manjka; strežnik vse preveri še enkrat (akcije.ts).
//
// "Že poslano" si zapomni samo ta telefon (localStorage) in je le opomnik:
// ekipa si lahko deli tablico v lokalu, zato je gumb za novo izpolnjevanje
// vedno na voljo. Na strežniku ni ničesar, kar bi povezalo dva odgovora.
// ---------------------------------------------------------------------------

export interface PitanjeZaPrikaz {
  id: string;
  vrsta: "skala" | "izbor" | "tekst";
  pitanje: string;
  pomoc?: string;
  obavezno: boolean;
  max?: number;
  najnize?: string;
  najvise?: string;
  opcije?: { id: string; tekst: string }[];
  znakova?: number;
}

export interface AnketaZaPrikaz {
  slug: string;
  verzija: number;
  sekcije: { naslov: string; pitanja: PitanjeZaPrikaz[] }[];
}

type Tekst = Record<keyof typeof UI, string>;
type Stanje = "popunjava" | "poslano" | "vecPoslano";

const kljuc = (a: AnketaZaPrikaz) => `anketa:${a.slug}:v${a.verzija}`;

function procitajZapis(k: string) {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
}
function zapisi(k: string) {
  try {
    window.localStorage.setItem(k, "1");
  } catch {
    // Zasebni način ali blokirana shramba: opomnika ni, anketa vseeno dela.
  }
}

export default function Obrazac({ anketa, jezik, tekst }: { anketa: AnketaZaPrikaz; jezik: string; tekst: Tekst }) {
  const [odgovori, setOdgovori] = useState<Record<string, number | string>>({});
  const [oznaceni, setOznaceni] = useState<Set<string>>(new Set());
  const [poruka, setPoruka] = useState<string | null>(null);
  const [stanje, setStanje] = useState<Stanje>("popunjava");
  const [salje, startTransition] = useTransition();
  const zamka = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (procitajZapis(kljuc(anketa))) setStanje("vecPoslano");
  }, [anketa]);

  const pitanja = anketa.sekcije.flatMap((s) => s.pitanja);
  const odgovoreno = pitanja.filter((p) => {
    const v = odgovori[p.id];
    return typeof v === "number" || (typeof v === "string" && v.trim() !== "");
  }).length;

  function postavi(id: string, v: number | string) {
    setOdgovori((o) => ({ ...o, [id]: v }));
    if (oznaceni.has(id)) {
      const n = new Set(oznaceni);
      n.delete(id);
      setOznaceni(n);
      // Zadnje manjkajoče je odgovorjeno: opozorilo nima več česa kazati.
      if (n.size === 0) setPoruka(null);
    }
  }

  function pokaziPrvi(ids: string[]) {
    setOznaceni(new Set(ids));
    setPoruka(tekst.nedostaje);
    const el = ids[0] && document.getElementById(`p-${ids[0]}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function posalji(e: React.FormEvent) {
    e.preventDefault();
    const nedostaju = pitanja.filter((p) => p.obavezno && odgovori[p.id] === undefined).map((p) => p.id);
    if (nedostaju.length) return pokaziPrvi(nedostaju);

    setPoruka(null);
    startTransition(async () => {
      try {
        const r = await posaljiAnketu(anketa.slug, jezik, odgovori, zamka.current?.value ?? "");
        if (r.ok) {
          zapisi(kljuc(anketa));
          setStanje("poslano");
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (r.greska === "nedostaje" && r.nedostaju.length) {
          pokaziPrvi(r.nedostaju);
        } else if (r.greska === "zatvorena") {
          setPoruka(tekst.zatvorenaTekst);
        } else {
          setPoruka(tekst.greska);
        }
      } catch {
        setPoruka(tekst.greska);
      }
    });
  }

  function ispocetka() {
    setOdgovori({});
    setOznaceni(new Set());
    setPoruka(null);
    setStanje("popunjava");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (stanje === "poslano" || stanje === "vecPoslano") {
    return (
      <section className={`${a.kartica} ${a.hvala}`} role="status">
        <span className={a.hvalaZnak} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h2 className={a.karticaNaslov}>{stanje === "poslano" ? tekst.hvalaNaslov : tekst.vecPoslano}</h2>
        {stanje === "poslano" && <p className={a.uvod}>{tekst.hvalaTekst}</p>}
        <button type="button" className={a.dugmeSporedno} onClick={ispocetka}>
          {tekst.popuniPonovo}
        </button>
      </section>
    );
  }

  return (
    <form onSubmit={posalji} noValidate className={a.obrazac}>
      <div className={a.napredak} aria-live="polite">
        <span>
          {tekst.odgovoreno}: <b>{odgovoreno}</b>/{pitanja.length}
        </span>
        <span className={a.napredakTraka} aria-hidden="true">
          <span style={{ width: `${(odgovoreno / pitanja.length) * 100}%` }} />
        </span>
      </div>

      {/* Zamka za robote: človek je ne vidi in je ne more doseči s tipkovnico. */}
      <input ref={zamka} type="text" name="web" tabIndex={-1} autoComplete="off" className={a.zamka} aria-hidden="true" />

      {anketa.sekcije.map((sekcija, si) => (
        <section key={si} className={a.kartica}>
          <h2 className={a.sekcijaNaslov}>
            <span className={a.sekcijaBroj}>{si + 1}</span>
            {sekcija.naslov}
          </h2>

          {sekcija.pitanja.map((p) => (
            <Polje
              key={p.id}
              p={p}
              vrijednost={odgovori[p.id]}
              oznaceno={oznaceni.has(p.id)}
              postavi={(v) => postavi(p.id, v)}
              tekst={tekst}
            />
          ))}
        </section>
      ))}

      <div className={a.dno}>
        {poruka && (
          <p className={a.greska} role="alert">
            {poruka}
          </p>
        )}
        <button type="submit" className={a.dugme} disabled={salje}>
          {salje ? tekst.saljem : tekst.posalji}
        </button>
        <p className={a.sitno}>{tekst.anonimnoDetalj}</p>
      </div>
    </form>
  );
}

function Polje({
  p,
  vrijednost,
  oznaceno,
  postavi,
  tekst,
}: {
  p: PitanjeZaPrikaz;
  vrijednost: number | string | undefined;
  oznaceno: boolean;
  postavi: (v: number | string) => void;
  tekst: Tekst;
}) {
  const naslovId = `n-${p.id}`;

  return (
    <div id={`p-${p.id}`} className={`${a.pitanje} ${oznaceno ? a.pitanjeOznaceno : ""}`}>
      <p id={naslovId} className={a.pitanjeTekst}>
        {p.pitanje}
        {p.obavezno && (
          <span className={a.obavezno} title={tekst.obavezno} aria-label={tekst.obavezno}>
            *
          </span>
        )}
      </p>
      {p.pomoc && <p className={a.pomoc}>{p.pomoc}</p>}

      {p.vrsta === "skala" && (
        <div className={a.skala}>
          <div className={a.skalaBrojevi} role="radiogroup" aria-labelledby={naslovId}>
            {Array.from({ length: p.max ?? 5 }, (_, i) => i + 1).map((n) => (
              <label key={n} className={`${a.skalaBroj} ${vrijednost === n ? a.odabrano : ""}`}>
                <input type="radio" name={p.id} value={n} checked={vrijednost === n} onChange={() => postavi(n)} />
                {n}
              </label>
            ))}
          </div>
          <div className={a.skalaOznake} aria-hidden="true">
            <span>1 = {p.najnize}</span>
            <span>
              {p.max ?? 5} = {p.najvise}
            </span>
          </div>
        </div>
      )}

      {p.vrsta === "izbor" && (
        <div className={a.izbor} role="radiogroup" aria-labelledby={naslovId}>
          {p.opcije?.map((o) => (
            <label key={o.id} className={`${a.opcija} ${vrijednost === o.id ? a.odabrano : ""}`}>
              <input type="radio" name={p.id} value={o.id} checked={vrijednost === o.id} onChange={() => postavi(o.id)} />
              <span className={a.krug} aria-hidden="true" />
              {o.tekst}
            </label>
          ))}
        </div>
      )}

      {p.vrsta === "tekst" && (
        <textarea
          className={a.tekst}
          aria-labelledby={naslovId}
          rows={4}
          maxLength={p.znakova}
          placeholder={tekst.vasOdgovor}
          value={typeof vrijednost === "string" ? vrijednost : ""}
          onChange={(e) => postavi(e.target.value)}
        />
      )}
    </div>
  );
}
