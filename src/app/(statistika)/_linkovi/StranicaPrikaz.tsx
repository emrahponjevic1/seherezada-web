import Image from "next/image";
import { SITE_NAME, SITE_URL } from "@/data/site";
import type { LocaleCode } from "@/data/site";
import { ZADANA_BOJA, bojaIkone, prelivStranice } from "./boje";
import { Ikona } from "./Ikone";
import type { IkonaSvg } from "./svgCisti";
import ZnackaUzivo from "./ZnackaUzivo";
import s from "./Stranica.module.css";

// ---------------------------------------------------------------------------
// IZGLED STRANI S POVEZAVAMI
//
// Ista komponenta izriše javno stran ZA GOSTA in živ predogled v nadzorni
// plošči. Namenoma ena sama: dva izrisa bi se razšla in lastnik bi videl
// nekaj drugega, kot dobi gost.
//
// Komponenta nima svojih podatkov ne poizvedb — vse dobi od zunaj. Zato jo
// sme uporabiti tudi odjemalčeva koda (predogled).
//
// Gumbi so vedno eden pod drugim: bela kartica, ikona levo, napis in drobni
// podnapis na sredini, temen krogec s puščico desno.
// ---------------------------------------------------------------------------

export interface DugmePrikaz {
  kljuc: string;
  ikona: string;
  /** Crtež ikone iz pretrage, kadar se `ikona` začne z "x:". */
  svg?: IkonaSvg | null;
  natpis: string;
  podnatpis: string;
  /** Kam vodi. V predogledu se ne uporablja. */
  href: string;
  boja: string;
}

export interface JezikPrikaz {
  kod: string;
  short: string;
  href: string;
  aktivan: boolean;
}

/** Puščica v krogcu na desni strani gumba. */
function Strelica() {
  return (
    <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h13M12.5 6l6 6-6 6" />
    </svg>
  );
}

/** Globus pred naslovom v podnožju. */
function Globus() {
  return (
    <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.3 2.5 3.6 5.6 3.6 9S14.3 18.5 12 21c-2.3-2.5-3.6-5.6-3.6-9S9.7 5.5 12 3z" />
    </svg>
  );
}

export default function StranicaPrikaz({
  naslov,
  podnaslov,
  pozdrav,
  podnozje,
  boja,
  hours,
  jezik,
  dugmad,
  jezici,
  naJezik,
  pregled = false,
  praznoOpis,
}: {
  naslov: string;
  podnaslov: string;
  pozdrav: string;
  podnozje: string;
  boja: string;
  /** Delovni čas poslovalnice za značko. null = značke ni. */
  hours: { day: string; time: string }[] | null;
  jezik: LocaleCode;
  dugmad: DugmePrikaz[];
  /** Prekidač jezika. */
  jezici?: JezikPrikaz[];
  /**
   * Samo predogled: klik na jezik zamenja jezik predogleda namesto odhoda na
   * drug naslov. Tako se predogled obnaša kot prava stran.
   */
  naJezik?: (kod: string) => void;
  pregled?: boolean;
  praznoOpis?: string;
}) {
  const preliv = prelivStranice(boja || ZADANA_BOJA);
  const domena = SITE_URL.replace(/^https?:\/\//, "");

  return (
    <div
      className={`${s.telo} ${pregled ? s.uPregledu : ""}`}
      style={{ "--gore": preliv.gore, "--dolje": preliv.dolje } as React.CSSProperties}
    >
      <div className={s.okvir}>
        {jezici && jezici.length > 1 && (
          <nav className={s.jezici} aria-label="Jezik">
            {jezici.map((j) =>
              pregled ? (
                <button
                  key={j.kod}
                  type="button"
                  onClick={() => naJezik?.(j.kod)}
                  className={`${s.jezik} ${j.aktivan ? s.jezikAktivan : ""}`}
                  aria-pressed={j.aktivan}
                >
                  {j.short}
                </button>
              ) : (
                <a
                  key={j.kod}
                  href={j.href}
                  hrefLang={j.kod}
                  className={`${s.jezik} ${j.aktivan ? s.jezikAktivan : ""}`}
                  aria-current={j.aktivan ? "true" : undefined}
                >
                  {j.short}
                </a>
              )
            )}
          </nav>
        )}

        <header className={s.glava}>
          {/* Prozorna različica logotipa; naredi jo scripts/prozirni-logo.js.
              next/image jo postreže kot AVIF v pravi velikosti, da gost na
              mobilnih podatkih ne čaka na 35 KB PNG. */}
          <Image
            src="/images/seherezada-logo-bijeli.png"
            alt=""
            width={709}
            height={373}
            className={s.logo}
            priority
            aria-hidden="true"
          />

          {/* Ime je samo v sliki logotipa, zato naslov obstaja vedno — kadar
              lastnik svojega ne napiše, ga vidijo samo bralniki zaslona.
              V predogledu to ni h1: nadzorna plošča ima svojega in dva na
              isti strani bralnika zmedeta. */}
          {pregled ? (
            <p className={naslov ? s.naslov : s.skrivenNaslov}>{naslov || SITE_NAME}</p>
          ) : (
            <h1 className={naslov ? s.naslov : s.skrivenNaslov}>{naslov || SITE_NAME}</h1>
          )}
          {podnaslov && <p className={s.podnaslov}>{podnaslov}</p>}
          {hours && <ZnackaUzivo hours={hours} jezik={jezik} />}
          {pozdrav && <p className={s.pozdrav}>{pozdrav}</p>}
        </header>

        {dugmad.length === 0 ? (
          <p className={s.prazno}>{praznoOpis ?? ""}</p>
        ) : (
          <ul className={s.dugmad}>
            {dugmad.map((d) => {
              const stil = { "--boja-ikone": bojaIkone(d.boja) } as React.CSSProperties;

              const sadrzaj = (
                <>
                  <span className={s.ikonaOkvir}>
                    <Ikona ime={d.ikona} svg={d.svg} velicina={26} />
                  </span>
                  <span className={s.natpisi}>
                    <span className={s.natpis}>{d.natpis}</span>
                    {d.podnatpis && <span className={s.podnatpis}>{d.podnatpis}</span>}
                  </span>
                  <span className={s.strelica}>
                    <Strelica />
                  </span>
                </>
              );

              // V predogledu gumbi niso povezave: lastnik bi se s klikom
              // odselil s strani, ki jo ureja, in izgubil neshranjeno delo.
              return (
                <li key={d.kljuc}>
                  {pregled ? (
                    <span className={s.dugme} style={stil}>
                      {sadrzaj}
                    </span>
                  ) : (
                    <a className={s.dugme} style={stil} href={d.href}>
                      {sadrzaj}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <footer className={s.podnozje}>
          {podnozje && <p className={s.slogan}>{podnozje}</p>}

          {/* Črtici ob strani in globus so temni, naslov bel — tako naslov
              stopi naprej, okrasek pa ostane okrasek. */}
          <div className={s.domenaRed}>
            {pregled ? (
              <span className={s.domena}>
                <span className={s.globus}>
                  <Globus />
                </span>
                {domena}
              </span>
            ) : (
              <a className={s.domena} href={SITE_URL}>
                <span className={s.globus}>
                  <Globus />
                </span>
                {domena}
              </a>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
