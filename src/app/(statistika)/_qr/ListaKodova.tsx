"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import QrSlicica from "./QrSlicica";
import type { QrStil } from "./stil";
import s from "./Statistika.module.css";
import p from "./Stranice.module.css";

// ---------------------------------------------------------------------------
// SEZNAM KOD
//
// Na računalniku vrstice kot tabela, na telefonu kartice (glej
// Stranice.module.css). Iskanje in razvrščanje tečeta v brskalniku; številke
// in datumi pridejo že oblikovani s strežnika, da se ne razlikujejo.
// ---------------------------------------------------------------------------

export interface KodZaListu {
  id: number;
  naziv: string;
  cilj: string;
  mjeren: boolean;
  aktivan: boolean;
  qrPodaci: string;
  stil: QrStil;
  uRasponu: number;
  uRasponuTekst: string;
  ukupnoTekst: string;
  ukupno: number;
  zadnje: string;
  zadnjeTacno: string;
  kreiran: number;
}

type Redoslijed = "skeniranja" | "novi" | "naziv";

export default function ListaKodova({ kodovi, rasponNaziv }: { kodovi: KodZaListu[]; rasponNaziv: string }) {
  const [upit, setUpit] = useState("");
  const [redoslijed, setRedoslijed] = useState<Redoslijed>("skeniranja");

  const prikaz = useMemo(() => {
    const u = upit.trim().toLowerCase();
    const filtrirani = u
      ? kodovi.filter((k) => k.naziv.toLowerCase().includes(u) || k.cilj.toLowerCase().includes(u))
      : kodovi;
    return [...filtrirani].sort((a, b) => {
      if (redoslijed === "naziv") return a.naziv.localeCompare(b.naziv, "bs");
      if (redoslijed === "novi") return b.kreiran - a.kreiran;
      return b.uRasponu - a.uRasponu || b.ukupno - a.ukupno;
    });
  }, [kodovi, upit, redoslijed]);

  const oznakaRaspona = `Skeniranja (${rasponNaziv.toLowerCase()})`;

  return (
    <div className={p.lista}>
      {kodovi.length > 3 && (
        <div className={p.listaAlati}>
          <input
            type="search"
            className={s.unos}
            placeholder="Traži po nazivu ili linku…"
            value={upit}
            onChange={(e) => setUpit(e.target.value)}
            aria-label="Traži kodove"
          />
          <select
            className={s.unos}
            value={redoslijed}
            onChange={(e) => setRedoslijed(e.target.value as Redoslijed)}
            aria-label="Redoslijed"
          >
            <option value="skeniranja">Najviše skeniranja</option>
            <option value="novi">Najnoviji</option>
            <option value="naziv">Po nazivu (A–Ž)</option>
          </select>
        </div>
      )}

      <div className={p.kodZaglavlje} aria-hidden="true">
        <span />
        <span>Kod</span>
        <span className={p.desno}>{oznakaRaspona}</span>
        <span className={p.desno}>Ukupno</span>
        <span>Zadnje skeniranje</span>
        <span />
      </div>

      <ul className={p.kodovi}>
        {prikaz.map((k) => (
          <li key={k.id}>
            <Link href={`/statistika/${k.id}`} className={p.kodRed}>
              <span className={p.kodSlika}>
                <QrSlicica podaci={k.qrPodaci} stil={k.stil} velicina={56} />
              </span>
              <span className={p.kodInfo}>
                <span className={p.kodIme}>{k.naziv}</span>
                <span className={p.kodCilj}>{k.cilj}</span>
                <span className={p.cipovi}>
                  <span className={`${s.cip} ${k.mjeren ? s.cipMjeren : s.cipDirektan}`}>
                    {k.mjeren ? "S brojanjem" : "Direktno"}
                  </span>
                  {!k.aktivan && <span className={`${s.cip} ${s.cipPauziran}`}>Pauziran</span>}
                </span>
              </span>
              <span className={p.kodBroj} data-oznaka={oznakaRaspona}>
                {k.mjeren ? k.uRasponuTekst : "—"}
              </span>
              <span className={p.kodUkupno} data-oznaka="Ukupno">
                {k.mjeren ? k.ukupnoTekst : "—"}
              </span>
              <span className={p.kodZadnje} data-oznaka="Zadnje" title={k.zadnjeTacno}>
                {k.mjeren ? k.zadnje : "ne mjeri se"}
              </span>
              <span className={p.kodStrelica} aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {prikaz.length === 0 && <p className={s.prazno}>Nijedan kod ne odgovara pretrazi.</p>}
    </div>
  );
}
