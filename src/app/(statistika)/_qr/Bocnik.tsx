"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IkonaLinktree,
  IkonaOdjava,
  IkonaPlus,
  IkonaPregled,
  IkonaQr,
  IkonaVanjski,
} from "./IkonePanela";
import o from "./Okvir.module.css";

// ---------------------------------------------------------------------------
// MENI NADZORNE PLOŠČE
//
// Trije deli, vsak s svojo stranjo: Pregled (številke), QR kode, Linktree.
// Ustvarjanje je v meniju vedno pri roki — lastnik ne išče gumba po straneh.
//
// Na telefonu isti trije deli kot zavihki na dnu, četrti je "Novo" z
// izbiro med QR kodo in linktree stranjo.
// ---------------------------------------------------------------------------

type Del = "pregled" | "kodovi" | "linkovi";

/** Kateri del menija je aktiven glede na naslov strani. */
function aktivniDel(pot: string): Del {
  if (pot.startsWith("/statistika/linkovi")) return "linkovi";
  if (pot === "/statistika") return "pregled";
  // /statistika/kodovi, /statistika/novi in /statistika/<id> so vse kode.
  return "kodovi";
}

const STAVKE: { del: Del; href: string; naziv: string; kratko: string; Ikona: typeof IkonaPregled }[] = [
  { del: "pregled", href: "/statistika", naziv: "Pregled", kratko: "Pregled", Ikona: IkonaPregled },
  { del: "kodovi", href: "/statistika/kodovi", naziv: "QR kodovi", kratko: "Kodovi", Ikona: IkonaQr },
  { del: "linkovi", href: "/statistika/linkovi", naziv: "Linktree", kratko: "Linktree", Ikona: IkonaLinktree },
];

function Znak() {
  return (
    <Link href="/statistika" className={o.znak}>
      <Image src="/images/seherezada-znak.png" alt="" width={40} height={40} className={o.znakSlika} />
      <span className={o.znakTekst}>
        <span className={o.znakIme}>Šeherezada</span>
        <span className={o.znakOpis}>Panel</span>
      </span>
    </Link>
  );
}

export default function Bocnik({ odjava }: { odjava: () => Promise<void> }) {
  const pot = usePathname();
  const del = aktivniDel(pot);
  const [novoOtvoreno, setNovoOtvoreno] = useState(false);

  // Meni "Novo" se zapre ob vsakem prehodu na drugo stran.
  useEffect(() => setNovoOtvoreno(false), [pot]);

  return (
    <>
      {/* ---- Računalnik ---- */}
      <aside className={o.bocnik}>
        <Znak />

        <nav className={o.grupa} aria-label="Glavni meni">
          <span className={o.grupaNaslov}>Meni</span>
          {STAVKE.map(({ del: d, href, naziv, Ikona }) => (
            <Link
              key={d}
              href={href}
              className={`${o.navLink} ${del === d ? o.navAktivan : ""}`}
              aria-current={del === d ? "page" : undefined}
            >
              <Ikona />
              {naziv}
            </Link>
          ))}
        </nav>

        <div className={o.grupa}>
          <span className={o.grupaNaslov}>Kreiraj</span>
          <Link href="/statistika/novi" className={o.kreiraj}>
            <IkonaPlus velicina={18} />
            Novi QR kod
          </Link>
          <Link href="/statistika/linkovi/nova" className={o.kreiraj}>
            <IkonaPlus velicina={18} />
            Novi linktree
          </Link>
        </div>

        <div className={o.dno}>
          <a href="/" target="_blank" rel="noreferrer" className={o.dnoLink}>
            <IkonaVanjski velicina={18} />
            Otvori sajt
          </a>
          <form action={odjava}>
            <button type="submit" className={o.dnoLink}>
              <IkonaOdjava velicina={18} />
              Odjava
            </button>
          </form>
        </div>
      </aside>

      {/* ---- Telefon: gornja traka ---- */}
      <header className={o.gore}>
        <Znak />
        <div className={o.goreAlati}>
          <a href="/" target="_blank" rel="noreferrer" className={o.goreDugme} aria-label="Otvori sajt">
            <IkonaVanjski />
          </a>
          <form action={odjava}>
            <button type="submit" className={o.goreDugme} aria-label="Odjava">
              <IkonaOdjava />
            </button>
          </form>
        </div>
      </header>

      {/* ---- Telefon: zavihki spodaj ---- */}
      <nav className={o.dolje} aria-label="Glavni meni">
        {STAVKE.map(({ del: d, href, kratko, Ikona }) => (
          <Link
            key={d}
            href={href}
            className={`${o.doljeLink} ${del === d ? o.doljeAktivan : ""}`}
            aria-current={del === d ? "page" : undefined}
          >
            <Ikona velicina={22} />
            {kratko}
          </Link>
        ))}
        <button
          type="button"
          className={`${o.doljeLink} ${o.doljeNovo}`}
          aria-expanded={novoOtvoreno}
          onClick={() => setNovoOtvoreno((v) => !v)}
        >
          <span>
            <IkonaPlus velicina={18} />
          </span>
          Novo
        </button>
      </nav>

      {novoOtvoreno && (
        <>
          <div className={o.novoZavjesa} onClick={() => setNovoOtvoreno(false)} aria-hidden="true" />
          <div className={o.novoMeni} role="menu">
            <Link href="/statistika/novi" role="menuitem">
              <IkonaQr />
              Novi QR kod
            </Link>
            <Link href="/statistika/linkovi/nova" role="menuitem">
              <IkonaLinktree />
              Novi linktree
            </Link>
          </div>
        </>
      )}
    </>
  );
}
