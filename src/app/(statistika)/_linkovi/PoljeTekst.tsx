"use client";

import { DEFAULT_LOCALE, LOCALES } from "@/data/site";
import type { Tekst } from "./tipovi";
import s from "@/app/(statistika)/_qr/Statistika.module.css";
import p from "./Panel.module.css";

// ---------------------------------------------------------------------------
// POLJE, KI IMA PREVODE
//
// Zgoraj je eno polje v privzetem jeziku — tisto, ki ga lastnik vedno napiše.
// Prevodi so zloženi pod njim in zaprti: kdor jih ne potrebuje, jih ne vidi,
// kdor jih potrebuje, ima vseh pet v eni vrsti.
//
// Prazen prevod ni napaka. Gost, ki nima svojega, dobi privzetega (glej
// uzmi() v tekst.ts) — nikoli praznega gumba.
// ---------------------------------------------------------------------------

const OSNOVNI = DEFAULT_LOCALE.code;
const OSTALI = LOCALES.filter((l) => l.code !== OSNOVNI);

export default function PoljeTekst({
  oznaka,
  vrijednost,
  naPromjenu,
  placeholder = "",
  redova = 0,
  najvec = 120,
  pomoc,
}: {
  oznaka: string;
  vrijednost: Tekst;
  naPromjenu: (t: Tekst) => void;
  placeholder?: string;
  /** Več kot 0 pomeni textarea namesto vrstice. */
  redova?: number;
  najvec?: number;
  pomoc?: string;
}) {
  const postavi = (jezik: string, v: string) => naPromjenu({ ...vrijednost, [jezik]: v });
  const prevedenih = OSTALI.filter((l) => (vrijednost[l.code] ?? "").trim()).length;

  return (
    <div className={s.polje}>
      <label className={s.polje}>
        <span className={s.oznakaPolja}>{oznaka}</span>
        {redova > 0 ? (
          <textarea
            className={s.unos}
            rows={redova}
            maxLength={najvec}
            value={vrijednost[OSNOVNI] ?? ""}
            placeholder={placeholder}
            onChange={(e) => postavi(OSNOVNI, e.target.value)}
          />
        ) : (
          <input
            className={s.unos}
            maxLength={najvec}
            value={vrijednost[OSNOVNI] ?? ""}
            placeholder={placeholder}
            onChange={(e) => postavi(OSNOVNI, e.target.value)}
          />
        )}
        {pomoc && <span className={s.pomoc}>{pomoc}</span>}
      </label>

      <details className={p.prevodi}>
        <summary className={p.prevodiNaslov}>
          Prijevodi ({prevedenih}/{OSTALI.length})
        </summary>
        <div className={p.prevodiTijelo}>
          {OSTALI.map((l) => (
            <div key={l.code} className={p.prevodRed}>
              <span className={p.prevodOznaka} title={l.name}>
                {l.short}
              </span>
              {redova > 0 ? (
                <textarea
                  className={s.unos}
                  rows={redova}
                  maxLength={najvec}
                  value={vrijednost[l.code] ?? ""}
                  placeholder={vrijednost[OSNOVNI] ?? placeholder}
                  onChange={(e) => postavi(l.code, e.target.value)}
                  aria-label={`${oznaka} — ${l.name}`}
                />
              ) : (
                <input
                  className={s.unos}
                  maxLength={najvec}
                  value={vrijednost[l.code] ?? ""}
                  placeholder={vrijednost[OSNOVNI] ?? placeholder}
                  onChange={(e) => postavi(l.code, e.target.value)}
                  aria-label={`${oznaka} — ${l.name}`}
                />
              )}
            </div>
          ))}
          <span className={s.pomoc}>
            Prazno polje nije greška — gost tada vidi {DEFAULT_LOCALE.name.toLowerCase()}.
          </span>
        </div>
      </details>
    </div>
  );
}
