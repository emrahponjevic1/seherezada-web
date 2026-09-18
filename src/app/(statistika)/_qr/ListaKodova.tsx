"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { IkonaPlus } from "./IkonePanela";
import QrSlicica from "./QrSlicica";
import type { QrStil } from "./stil";
import s from "./Statistika.module.css";
import L from "./Liste.module.css";

// ---------------------------------------------------------------------------
// SEZNAM KOD — KARTICE
//
// Vsaka koda je kartica: slika kode, ime z barvo (ista kot v grafu), kam
// vodi, stanje, spodaj pa tri številke — v obdobju, skupaj in kdaj zadnjič.
// Na koncu mreže je vedno kartica "+ Novi QR kod".
// ---------------------------------------------------------------------------

export interface KodZaListu {
  id: number;
  naziv: string;
  /** Kam vodi, že v berljivi obliki ("Linktree: Stol Trubarjeva" ali domena). */
  odrediste: string;
  boja: string;
  mjeren: boolean;
  aktivan: boolean;
  qrPodaci: string;
  stil: QrStil;
  uRasponu: number;
  uRasponuTekst: string;
  ukupno: number;
  ukupnoTekst: string;
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
      ? kodovi.filter((k) => k.naziv.toLowerCase().includes(u) || k.odrediste.toLowerCase().includes(u))
      : kodovi;
    return [...filtrirani].sort((a, b) => {
      if (redoslijed === "naziv") return a.naziv.localeCompare(b.naziv, "bs");
      if (redoslijed === "novi") return b.kreiran - a.kreiran;
      return b.uRasponu - a.uRasponu || b.ukupno - a.ukupno;
    });
  }, [kodovi, upit, redoslijed]);

  return (
    <>
      {kodovi.length > 3 && (
        <div className={L.alatiDesno}>
          <input
            type="search"
            className={s.unos}
            placeholder="Traži kod…"
            value={upit}
            onChange={(e) => setUpit(e.target.value)}
            aria-label="Traži kodove"
            style={{ maxWidth: 280 }}
          />
          <select
            className={s.unos}
            value={redoslijed}
            onChange={(e) => setRedoslijed(e.target.value as Redoslijed)}
            aria-label="Redoslijed"
            style={{ width: "auto" }}
          >
            <option value="skeniranja">Najviše skeniranja</option>
            <option value="novi">Najnoviji</option>
            <option value="naziv">Po nazivu (A–Ž)</option>
          </select>
        </div>
      )}

      <div className={L.mreza}>
        {prikaz.map((k) => (
          <Link key={k.id} href={`/statistika/${k.id}`} className={L.kod}>
            <div className={L.kodVrh}>
              <span className={L.kodSlika}>
                <QrSlicica podaci={k.qrPodaci} stil={k.stil} velicina={72} />
              </span>
              <span className={L.kodInfo}>
                <span className={L.kodIme}>
                  <span className={L.kodBoja} style={{ background: k.boja }} aria-hidden="true" />
                  <span>{k.naziv}</span>
                </span>
                <span className={L.kodCilj}>{k.odrediste}</span>
                <span className={L.kodCipovi}>
                  <span className={`${s.cip} ${k.mjeren ? s.cipMjeren : s.cipDirektan}`}>
                    {k.mjeren ? "S brojanjem" : "Direktno"}
                  </span>
                  {!k.aktivan && <span className={`${s.cip} ${s.cipPauziran}`}>Pauziran</span>}
                </span>
              </span>
            </div>
            <div className={L.kodDno}>
              <span className={L.kodStat}>
                <span className={L.kodStatBroj}>{k.mjeren ? k.uRasponuTekst : "—"}</span>
                <span className={L.kodStatOznaka}>{rasponNaziv}</span>
              </span>
              <span className={L.kodStat}>
                <span className={L.kodStatBroj}>{k.mjeren ? k.ukupnoTekst : "—"}</span>
                <span className={L.kodStatOznaka}>Ukupno</span>
              </span>
              <span className={L.kodStat} title={k.zadnjeTacno}>
                <span className={L.kodStatBroj} style={{ fontSize: "0.9rem" }}>
                  {k.mjeren ? k.zadnje : "ne mjeri se"}
                </span>
                <span className={L.kodStatOznaka}>Zadnje</span>
              </span>
            </div>
          </Link>
        ))}

        <Link href="/statistika/novi" className={L.nova}>
          <span>
            <IkonaPlus />
          </span>
          Novi QR kod
        </Link>
      </div>

      {prikaz.length === 0 && kodovi.length > 0 && <p className={s.prazno}>Nijedan kod ne odgovara pretrazi.</p>}
    </>
  );
}
