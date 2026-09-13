"use client";

import { useEffect, useRef, useState } from "react";
import s from "@/app/(statistika)/_qr/Statistika.module.css";

// ---------------------------------------------------------------------------
// STOLPČNI GRAF
//
// Ena serija, ena barva (#ea580c). Tanki stolpci (največ 24 px), zaobljeni
// samo na vrhu, med njimi vedno vsaj 2 px zraka. Označena je samo najvišja
// vrednost; ostalo pove oblaček (miška ali puščice na tipkovnici) in
// tabela pod grafom, ki je dosegljiva tudi brez miške.
// ---------------------------------------------------------------------------

export interface Tacka {
  oznaka: string;
  puna: string;
  broj: number;
}

function skala(max: number) {
  if (max <= 0) return { vrh: 4, korak: 1 };
  const grubo = max / 4;
  const red = 10 ** Math.floor(Math.log10(grubo));
  const korak = Math.max(1, ([1, 2, 5, 10].find((m) => m * red >= grubo) ?? 10) * red);
  return { vrh: Math.ceil(max / korak) * korak, korak };
}

const LIJEVO = 40;
const DESNO = 8;
const GORE = 22;
const DOLJE = 28;

export default function StupciGrafikon({
  podaci,
  visina = 240,
  opis,
  jedinica = "skeniranja",
}: {
  podaci: Tacka[];
  visina?: number;
  opis: string;
  jedinica?: string;
}) {
  const okvir = useRef<HTMLDivElement>(null);
  const [sirina, setSirina] = useState(720);
  const [aktivan, setAktivan] = useState<number | null>(null);

  useEffect(() => {
    const el = okvir.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSirina(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = Math.max(1, podaci.length);
  const plotW = sirina - LIJEVO - DESNO;
  const plotH = visina - GORE - DOLJE;
  const max = Math.max(0, ...podaci.map((p) => p.broj));
  const { vrh, korak } = skala(max);
  const traka = plotW / n;
  const w = Math.max(1, Math.min(24, traka - Math.max(2, traka * 0.3)));
  const y = (v: number) => GORE + plotH - (v / vrh) * plotH;
  const baza = y(0);
  const svakiN = Math.max(1, Math.ceil(56 / traka));
  const indeksMax = max > 0 ? podaci.findIndex((p) => p.broj === max) : -1;

  const tickovi: number[] = [];
  for (let v = 0; v <= vrh; v += korak) tickovi.push(v);

  const sredina = (i: number) => LIJEVO + i * traka + traka / 2;

  function stupac(i: number, v: number) {
    const x0 = sredina(i) - w / 2;
    const x1 = x0 + w;
    const h = baza - y(v);
    if (h <= 0) return "";
    const r = Math.min(4, w / 2, h);
    const vrhY = baza - h;
    return `M${x0},${baza}V${vrhY + r}Q${x0},${vrhY} ${x0 + r},${vrhY}H${x1 - r}Q${x1},${vrhY} ${x1},${vrhY + r}V${baza}Z`;
  }

  function tipka(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const d = e.key === "ArrowRight" ? 1 : -1;
      setAktivan((a) => Math.min(podaci.length - 1, Math.max(0, (a ?? (d > 0 ? -1 : podaci.length)) + d)));
    } else if (e.key === "Escape") {
      setAktivan(null);
    }
  }

  const t = aktivan !== null ? podaci[aktivan] : null;
  const tipLijevo = aktivan !== null ? Math.min(sirina - 70, Math.max(70, sredina(aktivan))) : 0;
  const tipGore = aktivan !== null ? y(podaci[aktivan].broj) - 10 : 0;

  return (
    <div className={s.grafikon}>
      <div ref={okvir} className={s.grafikonPovrsina} style={{ height: visina }}>
        <svg
          width={sirina}
          height={visina}
          className={s.grafikonSvg}
          role="img"
          aria-label={opis}
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

          {podaci.map((p, i) => (
            <g key={i}>
              <path d={stupac(i, p.broj)} className={aktivan === i ? s.stupacAktivan : s.stupac} />
              {i % svakiN === 0 && (
                <text x={sredina(i)} y={visina - 8} className={s.osTekst} textAnchor="middle">
                  {p.oznaka}
                </text>
              )}
              <rect
                x={LIJEVO + i * traka}
                y={GORE}
                width={traka}
                height={plotH}
                fill="transparent"
                onPointerEnter={() => setAktivan(i)}
              />
            </g>
          ))}

          {indeksMax >= 0 && (
            <text x={sredina(indeksMax)} y={y(max) - 6} className={s.vrijednostTekst} textAnchor="middle">
              {max}
            </text>
          )}
        </svg>

        {t && (
          <div className={s.tooltip} style={{ left: tipLijevo, top: tipGore }} aria-live="polite">
            <span className={s.tooltipVrijednost}>
              {t.broj} {jedinica}
            </span>
            <span className={s.tooltipOznaka}>{t.puna}</span>
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
                <th className={s.celijaBroj}>Broj</th>
              </tr>
            </thead>
            <tbody>
              {podaci.map((p, i) => (
                <tr key={i}>
                  <td>{p.puna}</td>
                  <td className={s.celijaBroj}>{p.broj}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
