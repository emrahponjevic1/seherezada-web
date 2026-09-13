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
// Računalnik: vrstica kot tabela (slika, ime, številke, zadnje skeniranje).
// Telefon: ena preprosta vrstica — barva, ime, drobno "ukupno · zadnje" in
// veliko število desno. Vse ostalo je na strani kode.
//
// Barvna pika je ista kot barva kode v grafu nad seznamom.
// ---------------------------------------------------------------------------

export interface KodZaListu {
  id: number;
  naziv: string;
  cilj: string;
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
      ? kodovi.filter((k) => k.naziv.toLowerCase().includes(u) || k.cilj.toLowerCase().includes(u))
      : kodovi;
    return [...filtrirani].sort((a, b) => {
      if (redoslijed === "naziv") return a.naziv.localeCompare(b.naziv, "bs");
      if (redoslijed === "novi") return b.kreiran - a.kreiran;
      return b.uRasponu - a.uRasponu || b.ukupno - a.ukupno;
    });
  }, [kodovi, upit, redoslijed]);

  return (
    <div className={p.lista}>
      {kodovi.length > 3 && (
        <div className={p.listaAlati}>
          <input
            type="search"
            className={s.unos}
            placeholder="Traži kod…"
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
        <span className={p.desno}>{rasponNaziv}</span>
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
                <span className={p.kodIme}>
                  <span className={p.kodBoja} style={{ background: k.boja }} aria-hidden="true" />
                  <span className={p.kodImeTekst}>{k.naziv}</span>
                </span>
                <span className={p.kodCilj}>{k.cilj}</span>
                <span className={p.cipovi}>
                  <span className={`${s.cip} ${k.mjeren ? s.cipMjeren : s.cipDirektan}`}>
                    {k.mjeren ? "S brojanjem" : "Direktno"}
                  </span>
                  {!k.aktivan && <span className={`${s.cip} ${s.cipPauziran}`}>Pauziran</span>}
                </span>
                {/* Samo telefon: vse, kar je na računalniku v stolpcih, v eni drobni vrstici. */}
                <span className={p.kodPodlinija}>
                  {!k.aktivan && "Pauziran · "}
                  {k.mjeren ? `ukupno ${k.ukupnoTekst} · ${k.zadnje}` : "direktan — ne mjeri se"}
                </span>
              </span>

              <span className={p.kodBroj} aria-label={`${rasponNaziv}: ${k.mjeren ? k.uRasponuTekst : "ne mjeri se"}`}>
                {k.mjeren ? k.uRasponuTekst : "—"}
              </span>
              <span className={p.kodUkupno}>{k.mjeren ? k.ukupnoTekst : "—"}</span>
              <span className={p.kodZadnje} title={k.zadnjeTacno}>
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
