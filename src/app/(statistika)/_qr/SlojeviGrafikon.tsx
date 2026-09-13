"use client";

import { useEffect, useRef, useState } from "react";
import s from "./Statistika.module.css";
import p from "./Stranice.module.css";

// ---------------------------------------------------------------------------
// GRAF SKENIRANJ PO KODAH — stolpci ali črte
//
// Stolpci: dan je en stolpec, razdeljen po kodah v stalnem vrstnem redu (id),
// med odseki 2 px zraka, zaobljen samo vrh.
// Črte: vsaka koda svoja črta (2 px) v svoji barvi; navpična črta pokaže
// izbrani dan, oblaček pa vse kode tistega dne.
//
// Legenda nad grafom nosi imena; tabela pod grafom je dostopna brez miške.
// Izbira prikaza se zapomni v brskalniku (localStorage) — samo udobje.
// ---------------------------------------------------------------------------

export interface Serija {
  id: string;
  naziv: string;
  boja: string;
  vrijednosti: number[];
}

export interface OznakaStupca {
  oznaka: string;
  puna: string;
}

type Vrsta = "stupci" | "linije";

const KLJUC_SPOMINA = "statistika-vrsta-grafikona";

function skala(max: number) {
  if (max <= 0) return { vrh: 4, korak: 1 };
  const grubo = max / 4;
  const red = 10 ** Math.floor(Math.log10(grubo));
  const korak = Math.max(1, ([1, 2, 5, 10].find((m) => m * red >= grubo) ?? 10) * red);
  return { vrh: Math.ceil(max / korak) * korak, korak };
}

const LIJEVO = 40;
const DESNO = 12;
const GORE = 22;
const DOLJE = 28;
const RAZMAK = 2;

export default function SlojeviGrafikon({
  oznake,
  serije,
  visina = 240,
  opis,
}: {
  oznake: OznakaStupca[];
  serije: Serija[];
  visina?: number;
  opis: string;
}) {
  const okvir = useRef<HTMLDivElement>(null);
  const [sirina, setSirina] = useState(720);
  const [aktivan, setAktivan] = useState<number | null>(null);
  const [vrsta, setVrsta] = useState<Vrsta>("stupci");

  useEffect(() => {
    const el = okvir.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSirina(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Prebrano šele v brskalniku, da se strežnik in brskalnik ne razlikujeta.
  useEffect(() => {
    try {
      const shranjeno = localStorage.getItem(KLJUC_SPOMINA);
      if (shranjeno === "linije" || shranjeno === "stupci") setVrsta(shranjeno);
    } catch {}
  }, []);

  function izaberi(v: Vrsta) {
    setVrsta(v);
    try {
      localStorage.setItem(KLJUC_SPOMINA, v);
    } catch {}
  }

  const n = Math.max(1, oznake.length);
  const zbirovi = oznake.map((_, i) => serije.reduce((z, se) => z + (se.vrijednosti[i] ?? 0), 0));
  const maxZbir = Math.max(0, ...zbirovi);
  const maxSerije = Math.max(0, ...serije.flatMap((se) => se.vrijednosti));
  const max = vrsta === "stupci" ? maxZbir : maxSerije;
  const { vrh, korak } = skala(max);
  const plotW = sirina - LIJEVO - DESNO;
  const plotH = visina - GORE - DOLJE;
  const traka = plotW / n;
  const w = Math.max(1, Math.min(24, traka - Math.max(2, traka * 0.3)));
  const y = (v: number) => GORE + plotH - (v / vrh) * plotH;
  const baza = y(0);
  const svakiN = Math.max(1, Math.ceil(56 / traka));
  const sredina = (i: number) => LIJEVO + i * traka + traka / 2;

  const tickovi: number[] = [];
  for (let v = 0; v <= vrh; v += korak) tickovi.push(v);

  function odseci(i: number) {
    const x0 = sredina(i) - w / 2;
    const x1 = x0 + w;
    const aktivne = serije.filter((se) => (se.vrijednosti[i] ?? 0) > 0);
    let spodaj = baza;
    return aktivne.map((se, k) => {
      const h = ((se.vrijednosti[i] ?? 0) / vrh) * plotH;
      const vrhOdseka = spodaj - h;
      const zadnji = k === aktivne.length - 1;
      // Zrak nad vsakim odsekom razen najvišjega — ločilo je bela podlaga, ne
      // obroba. Odsek ostane visok vsaj 1 px, da ne izgine.
      const gornji = zadnji ? vrhOdseka : Math.min(spodaj - 1, vrhOdseka + RAZMAK);
      let d: string;
      if (zadnji) {
        const r = Math.min(4, w / 2, spodaj - gornji);
        d = `M${x0},${spodaj}V${gornji + r}Q${x0},${gornji} ${x0 + r},${gornji}H${x1 - r}Q${x1},${gornji} ${x1},${gornji + r}V${spodaj}Z`;
      } else {
        d = `M${x0},${gornji}H${x1}V${spodaj}H${x0}Z`;
      }
      spodaj = vrhOdseka;
      return { id: se.id, boja: se.boja, d };
    });
  }

  const crta = (se: Serija) =>
    oznake.map((_, i) => `${i === 0 ? "M" : "L"}${sredina(i)},${y(se.vrijednosti[i] ?? 0)}`).join("");

  function tipka(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const smjer = e.key === "ArrowRight" ? 1 : -1;
      setAktivan((a) => Math.min(n - 1, Math.max(0, (a ?? (smjer > 0 ? -1 : n)) + smjer)));
    } else if (e.key === "Escape") {
      setAktivan(null);
    }
  }

  const najvisaTacka =
    aktivan === null ? 0 : Math.max(...serije.map((se) => se.vrijednosti[aktivan] ?? 0), 0);
  const tipLijevo = aktivan !== null ? Math.min(sirina - 90, Math.max(90, sredina(aktivan))) : 0;
  const tipGore =
    aktivan !== null ? (vrsta === "stupci" ? y(zbirovi[aktivan]) : y(najvisaTacka)) - 12 : 0;
  const indeksMax = vrsta === "stupci" && maxZbir > 0 ? zbirovi.indexOf(maxZbir) : -1;

  return (
    <div className={s.grafikon}>
      <div className={p.grafAlati}>
        {serije.length >= 2 ? (
          <ul className={p.legenda} aria-label="Legenda">
            {serije.map((se) => (
              <li key={se.id} className={p.legendaStavka}>
                <span className={p.legendaBoja} style={{ background: se.boja }} aria-hidden="true" />
                {se.naziv}
              </li>
            ))}
          </ul>
        ) : (
          <span />
        )}
        <div className={p.prekidac} role="group" aria-label="Vrsta grafikona">
          {(
            [
              ["stupci", "Stupci"],
              ["linije", "Linije"],
            ] as const
          ).map(([v, tekst]) => (
            <button
              key={v}
              type="button"
              className={`${p.prekidacDugme} ${vrsta === v ? p.prekidacAktivan : ""}`}
              aria-pressed={vrsta === v}
              onClick={() => izaberi(v)}
            >
              {tekst}
            </button>
          ))}
        </div>
      </div>

      <div ref={okvir} className={s.grafikonPovrsina} style={{ height: visina }}>
        <svg
          width={sirina}
          height={visina}
          className={s.grafikonSvg}
          role="img"
          aria-label={`${opis} (${vrsta === "stupci" ? "stupci" : "linije"})`}
          tabIndex={0}
          onKeyDown={tipka}
          onBlur={() => setAktivan(null)}
          onPointerLeave={() => setAktivan(null)}
        >
          {tickovi.map((v) => (
            <g key={v}>
              <line x1={LIJEVO} x2={sirina - DESNO} y1={y(v)} y2={y(v)} className={v === 0 ? s.os : s.mreza} />
              <text x={LIJEVO - 8} y={y(v)} className={s.osTekst} textAnchor="end" dominantBaseline="middle">
                {v}
              </text>
            </g>
          ))}

          {oznake.map((o, i) =>
            i % svakiN === 0 ? (
              <text key={`o${i}`} x={sredina(i)} y={visina - 8} className={s.osTekst} textAnchor="middle">
                {o.oznaka}
              </text>
            ) : null
          )}

          {vrsta === "stupci" ? (
            oznake.map((_, i) => (
              <g key={i} className={aktivan === i ? p.stupacIstaknut : undefined}>
                {odseci(i).map((od) => (
                  <path key={od.id} d={od.d} fill={od.boja} />
                ))}
              </g>
            ))
          ) : (
            <>
              {aktivan !== null && (
                <line x1={sredina(aktivan)} x2={sredina(aktivan)} y1={GORE} y2={baza} className={p.krstic} />
              )}
              {serije.map((se) => (
                <path key={se.id} d={crta(se)} className={p.linija} stroke={se.boja} />
              ))}
              {aktivan !== null &&
                serije.map((se) => (
                  <circle
                    key={se.id}
                    cx={sredina(aktivan)}
                    cy={y(se.vrijednosti[aktivan] ?? 0)}
                    r={4.5}
                    fill={se.boja}
                    className={p.tacka}
                  />
                ))}
            </>
          )}

          {oznake.map((_, i) => (
            <rect
              key={`h${i}`}
              x={LIJEVO + i * traka}
              y={GORE}
              width={traka}
              height={plotH}
              fill="transparent"
              onPointerEnter={() => setAktivan(i)}
            />
          ))}

          {indeksMax >= 0 && (
            <text x={sredina(indeksMax)} y={y(maxZbir) - 6} className={s.vrijednostTekst} textAnchor="middle">
              {maxZbir}
            </text>
          )}
        </svg>

        {aktivan !== null && (
          <div className={s.tooltip} style={{ left: tipLijevo, top: tipGore }} aria-live="polite">
            <span className={s.tooltipVrijednost}>{zbirovi[aktivan]} skeniranja</span>
            <span className={s.tooltipOznaka}>{oznake[aktivan].puna}</span>
            {serije
              .filter((se) => vrsta === "linije" || (se.vrijednosti[aktivan] ?? 0) > 0)
              .map((se) => (
                <span key={se.id} className={p.tipRed}>
                  <span className={p.tipKljuc} style={{ background: se.boja }} aria-hidden="true" />
                  <b>{se.vrijednosti[aktivan] ?? 0}</b>
                  <span className={s.tooltipOznaka}>{se.naziv}</span>
                </span>
              ))}
          </div>
        )}
      </div>

      <details className={s.tabelaDetalji}>
        <summary>Prikaži kao tabelu</summary>
        <div className={s.tabelaOkvir}>
          <table className={s.tabela}>
            <thead>
              <tr>
                <th>Period</th>
                {serije.map((se) => (
                  <th key={se.id} className={s.celijaBroj}>
                    {se.naziv}
                  </th>
                ))}
                <th className={s.celijaBroj}>Ukupno</th>
              </tr>
            </thead>
            <tbody>
              {oznake.map((o, i) => (
                <tr key={i}>
                  <td>{o.puna}</td>
                  {serije.map((se) => (
                    <td key={se.id} className={s.celijaBroj}>
                      {se.vrijednosti[i] ?? 0}
                    </td>
                  ))}
                  <td className={s.celijaBroj}>{zbirovi[i]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
