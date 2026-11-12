import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, LOCALES, LOCALE_CODES, type LocaleCode } from "@/data/site";
import { anketaPoSlugu } from "./registar";
import { UI } from "./tekst";
import type { Anketa } from "./tipovi";
import Obrazac, { type AnketaZaPrikaz } from "./Obrazac";
import a from "./Anketa.module.css";

// ---------------------------------------------------------------------------
// STRAN ANKETE — DVA ZASLONA
//
// 1. Brez ?jezik= : izbira med šestimi jeziki. Zaslon je v slovenščini in
//    slovenščina je prva in poudarjena (želja lastnika, 12. 11. 2026) — ne
//    jezik telefona. Izbere pa vedno človek sam.
// 2. S ?jezik=de : obrazec v tem jeziku.
//
// Jezik je v naslovu (ne v piškotku), zato osvežitev strani ali poslana
// povezava ostane v istem jeziku.
// ---------------------------------------------------------------------------

function jeJezik(v: string | undefined): v is LocaleCode {
  return !!v && (LOCALE_CODES as readonly string[]).includes(v);
}

/** Samo izbrani jezik gre v brskalnik, ne vseh šest. */
function zaJezik(anketa: Anketa, j: LocaleCode): AnketaZaPrikaz {
  return {
    slug: anketa.slug,
    verzija: anketa.verzija,
    sekcije: anketa.sekcije.map((s) => ({
      naslov: s.naslov[j],
      pitanja: s.pitanja.map((p) => ({
        id: p.id,
        vrsta: p.vrsta,
        pitanje: p.pitanje[j],
        pomoc: p.pomoc?.[j],
        obavezno: !!p.obavezno,
        ...(p.vrsta === "skala" && { max: p.max ?? 5, najnize: p.najnize[j], najvise: p.najvise[j] }),
        ...(p.vrsta === "izbor" && { opcije: p.opcije.map((o) => ({ id: o.id, tekst: o.tekst[j] })) }),
        ...(p.vrsta === "tekst" && { znakova: p.najvise ?? 4000 }),
      })),
    })),
  };
}

function Glava() {
  return (
    <Image src="/images/seherezada-znak.png" alt="Šeherezada" width={56} height={56} className={a.znak} priority />
  );
}

export default async function AnketaStranica({
  slug,
  jezik,
  osnova,
}: {
  slug: string;
  jezik?: string;
  /** Naslov te strani brez ?jezik=, za povezave. */
  osnova: string;
}) {
  const anketa = anketaPoSlugu(slug);
  if (!anketa) notFound();

  // ---- Zaslon 1: izbira jezika ---------------------------------------------
  if (!jeJezik(jezik)) {
    const zadani = DEFAULT_LOCALE.code;
    const redoslijed = [...LOCALES].sort((x, y) => Number(y.code === zadani) - Number(x.code === zadani));

    return (
      <main className={a.sekcija} lang={zadani}>
        <div className={a.uski}>
          <Glava />
          <h1 className={a.naslov}>{anketa.naslov[zadani]}</h1>
          <p className={a.znacka}>{UI.anonimno[zadani]}</p>

          <section className={a.jezici} aria-labelledby="izbor-jezika">
            <h2 id="izbor-jezika" className={a.jeziciNaslov}>
              {UI.izaberiJezik[zadani]}
            </h2>
            <ul className={a.jeziciLista}>
              {redoslijed.map((l) => (
                <li key={l.code}>
                  <Link
                    href={`${osnova}?jezik=${l.code}`}
                    className={`${a.jezik} ${l.code === zadani ? a.jezikZadani : ""}`}
                    hrefLang={l.code}
                    lang={l.code}
                  >
                    <span className={a.jezikIme}>{l.name}</span>
                    <span className={a.jezikKod}>{l.short}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    );
  }

  // ---- Zaslon 2: anketa ------------------------------------------------------
  const j = jezik;
  return (
    <main className={a.sekcija} lang={j}>
      <div className={a.uski}>
        <div className={a.vrh}>
          <Glava />
          <Link href={osnova} className={a.promijeni}>
            {UI.promijeniJezik[j]} · {LOCALES.find((l) => l.code === j)?.short}
          </Link>
        </div>

        <h1 className={a.naslov}>{anketa.naslov[j]}</h1>
        <p className={a.znacka}>{UI.anonimno[j]}</p>

        {anketa.zatvorena ? (
          <section className={a.kartica}>
            <h2 className={a.karticaNaslov}>{UI.zatvorenaNaslov[j]}</h2>
            <p className={a.uvod}>{UI.zatvorenaTekst[j]}</p>
          </section>
        ) : (
          <>
            <section className={`${a.kartica} ${a.uvodKartica}`}>
              {anketa.uvod[j].split(/\n\s*\n/).map((odlomak, i) => (
                <p key={i} className={a.uvod}>
                  {odlomak}
                </p>
              ))}
            </section>

            <Obrazac
              anketa={zaJezik(anketa, j)}
              jezik={j}
              tekst={Object.fromEntries(Object.entries(UI).map(([k, v]) => [k, v[j]])) as Record<keyof typeof UI, string>}
            />
          </>
        )}
      </div>
    </main>
  );
}
