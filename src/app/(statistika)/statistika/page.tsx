import Link from "next/link";
import s from "@/app/(statistika)/_qr/Statistika.module.css";
import L from "@/app/(statistika)/_qr/Liste.module.css";
import { imaBazu } from "@/app/(statistika)/_qr/baza";
import { bojeKodova } from "@/app/(statistika)/_qr/boje";
import NemaBaze from "@/app/(statistika)/_qr/NemaBaze";
import Prijava from "@/app/(statistika)/_qr/Prijava";
import { jePrijavljen } from "@/app/(statistika)/_qr/sesija";
import Zaglavlje from "@/app/(statistika)/_qr/Zaglavlje";
import FilterRaspona from "@/app/(statistika)/_qr/FilterRaspona";
import { broj, oznakaDana } from "@/app/(statistika)/_qr/format";
import { procitajRaspon } from "@/app/(statistika)/_qr/raspon";
import { pripraviQrTabele } from "@/app/(statistika)/_qr/shema";
import SlojeviGrafikon, { type Serija } from "@/app/(statistika)/_qr/SlojeviGrafikon";
import { brojke, poDanimaPoKodu, sviKodovi } from "@/app/(statistika)/_qr/upiti";
import {
  IkonaKlik,
  IkonaLinktree,
  IkonaOsoba,
  IkonaQr,
  IkonaSken,
  IkonaStrelica,
} from "@/app/(statistika)/_qr/IkonePanela";
import { Ikona } from "@/app/(statistika)/_linkovi/Ikone";
import { idjeviDugmadi, najDugmad, sveStranice } from "@/app/(statistika)/_linkovi/upiti";

// ---------------------------------------------------------------------------
// PREGLED
//
// Prva stran po prijavi: koliko se je v izbranem obdobju zgodilo (skeniranja
// kod IN kliki na gumbe linktreeja), kako je šlo po dnevih in kaj najbolje
// deluje. Seznami vseh kod in strani so na svojih straneh v meniju.
//
// Skeniranja in kliki sta ločeni številki — ena je gost pred mizo s
// kamero, druga gost, ki je na strani s povezavami pritisnil gumb.
// ---------------------------------------------------------------------------

export const metadata = { title: "Pregled" };

const BOJA_SKENIRANJA = "#ea580c";
const BOJA_KLIKOVA = "#44403c";

export default async function PregledPage({
  searchParams,
}: {
  searchParams: Promise<{ raspon?: string }>;
}) {
  const { raspon: r } = await searchParams;
  if (!(await jePrijavljen())) return <Prijava />;
  if (!imaBazu()) return <NemaBaze />;

  await pripraviQrTabele();
  const raspon = procitajRaspon(r);
  const [kodovi, bKodovi, bKlikovi, dani, stranice, topDugmad, dugmadIdjevi] = await Promise.all([
    sviKodovi(raspon),
    brojke("kodovi", raspon),
    brojke("dugmad", raspon),
    poDanimaPoKodu("sve", raspon),
    sveStranice(raspon),
    najDugmad(raspon, 5),
    idjeviDugmadi(),
  ]);

  const period = raspon.dani === null ? "od početka" : raspon.dani === 1 ? "danas" : `zadnjih ${raspon.naziv}`;
  const aktivnih = kodovi.filter((k) => k.aktivan).length;

  // Skupni graf: vsa skeniranja kod v eni plasti, vsi kliki gumbov v drugi.
  const skeniranja = new Array<number>(dani.kljucevi.length).fill(0);
  const klikovi = new Array<number>(dani.kljucevi.length).fill(0);
  for (const [id, niz] of dani.poKodu) {
    const cilj = dugmadIdjevi.has(id) ? klikovi : skeniranja;
    niz.forEach((v, i) => (cilj[i] += v));
  }
  const serije: Serija[] = [
    { id: "skeniranja", naziv: "Skeniranja QR kodova", boja: BOJA_SKENIRANJA, vrijednosti: skeniranja },
    { id: "klikovi", naziv: "Klikovi na linktree", boja: BOJA_KLIKOVA, vrijednosti: klikovi },
  ];

  const boje = bojeKodova(kodovi.map((k) => k.id));
  const najKodovi = [...kodovi].sort((a, b) => b.u_rasponu - a.u_rasponu || b.ukupno - a.ukupno).slice(0, 5);
  const maxKod = Math.max(1, ...najKodovi.map((k) => k.u_rasponu));
  const maxDugme = Math.max(1, ...topDugmad.map((d) => d.u_rasponu));

  const nistaJos = kodovi.length === 0 && stranice.length === 0;

  return (
    <main className={s.sekcija}>
      <div className={s.kontejner}>
        <Zaglavlje naslov="Pregled" podnaslov={`Skeniranja QR kodova i klikovi na linktree — ${period}.`}>
          <FilterRaspona putanja="/statistika" aktivan={raspon} />
        </Zaglavlje>

        {nistaJos && (
          <div className={L.zacetak}>
            <Link href="/statistika/novi" className={L.zacetakKartica}>
              <span className={L.zacetakIkona}>
                <IkonaQr velicina={22} />
              </span>
              <span className={L.zacetakNaslov}>Napravi prvi QR kod</span>
              <span className={L.zacetakOpis}>
                Kod za stol, letak ili izlog. Svako skeniranje se broji, a odredište mijenjaš bez nove štampe.
              </span>
            </Link>
            <Link href="/statistika/linkovi/nova" className={L.zacetakKartica}>
              <span className={L.zacetakIkona}>
                <IkonaLinktree velicina={22} />
              </span>
              <span className={L.zacetakNaslov}>Napravi prvi linktree</span>
              <span className={L.zacetakOpis}>
                Jedna stranica s menijem, ocjenama i mrežama — za jedan QR kod na stolu.
              </span>
            </Link>
          </div>
        )}

        <div className={s.kpiRed}>
          <div className={s.kpi}>
            <div className={s.kpiGlava}>
              <span className={s.kpiOznaka}>Skeniranja</span>
              <span className={s.kpiIkona}>
                <IkonaSken velicina={18} />
              </span>
            </div>
            <span className={s.kpiVrijednost}>{broj(bKodovi.skeniranja)}</span>
            <span className={s.kpiDodatak}>QR kodova, {period}</span>
          </div>
          <div className={s.kpi}>
            <div className={s.kpiGlava}>
              <span className={s.kpiOznaka}>Klikovi</span>
              <span className={s.kpiIkona}>
                <IkonaKlik velicina={18} />
              </span>
            </div>
            <span className={s.kpiVrijednost}>{broj(bKlikovi.skeniranja)}</span>
            <span className={s.kpiDodatak}>na dugmad linktreeja</span>
          </div>
          <div className={s.kpi}>
            <div className={s.kpiGlava}>
              <span className={s.kpiOznaka}>Posjetioci</span>
              <span className={s.kpiIkona}>
                <IkonaOsoba velicina={18} />
              </span>
            </div>
            <span className={s.kpiVrijednost}>{broj(bKodovi.jedinstveni)}</span>
            <span className={s.kpiDodatak}>isti telefon jednom dnevno</span>
          </div>
          <div className={s.kpi}>
            <div className={s.kpiGlava}>
              <span className={s.kpiOznaka}>Aktivni kodovi</span>
              <span className={s.kpiIkona}>
                <IkonaQr velicina={18} />
              </span>
            </div>
            <span className={s.kpiVrijednost}>
              {aktivnih}
              <span style={{ fontSize: "1rem", color: "#a8a29e", fontWeight: 700 }}> / {kodovi.length}</span>
            </span>
            <span className={s.kpiDodatak}>
              + {stranice.length} {stranice.length === 1 ? "linktree stranica" : "linktree stranice"}
            </span>
          </div>
        </div>

        <section className={s.kartica}>
          <div className={s.karticaGlava}>
            <h2 className={s.karticaNaslov}>Aktivnost {dani.jedinica === "week" ? "po sedmicama" : "po danima"}</h2>
            {bKodovi.boti + bKlikovi.boti > 0 && (
              <span className={s.pomoc}>
                Isključeno {broj(bKodovi.boti + bKlikovi.boti)} otvaranja od botova i pregleda linkova.
              </span>
            )}
          </div>
          <SlojeviGrafikon
            opis={`Skeniranja i klikovi ${period}`}
            oznake={dani.kljucevi.map((kljuc) => oznakaDana(kljuc, dani.jedinica))}
            serije={serije}
          />
        </section>

        <div className={s.mreza2}>
          <section className={s.kartica}>
            <div className={s.karticaGlava}>
              <h2 className={s.karticaNaslov}>Najjači QR kodovi</h2>
              <Link href="/statistika/kodovi" className={s.karticaLinkDesno}>
                Svi kodovi <IkonaStrelica velicina={14} />
              </Link>
            </div>
            {najKodovi.length === 0 ? (
              <div className={s.prazno}>
                <p>Još nema QR kodova.</p>
                <Link href="/statistika/novi" className={s.dugmeSporedno}>
                  Napravi prvi kod
                </Link>
              </div>
            ) : (
              <ul className={L.top}>
                {najKodovi.map((k) => (
                  <li key={k.id}>
                    <Link href={`/statistika/${k.id}`} className={L.topRed}>
                      <span className={L.marker}>
                        <span className={L.markerTocka} style={{ background: boje.get(k.id)?.boja }} />
                      </span>
                      <span className={L.topInfo}>
                        <span className={L.topIme}>{k.naziv}</span>
                        <span className={L.topPod}>
                          {k.vodi_na ? "→ linktree" : k.cilj.replace(/^https?:\/\//, "")}
                        </span>
                      </span>
                      <span className={L.topBroj}>{broj(k.u_rasponu)}</span>
                      <span className={L.topTraka}>
                        <span
                          className={L.topPopuna}
                          style={{ width: `${(k.u_rasponu / maxKod) * 100}%`, background: boje.get(k.id)?.boja }}
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={s.kartica}>
            <div className={s.karticaGlava}>
              <h2 className={s.karticaNaslov}>Najklikanija dugmad</h2>
              <Link href="/statistika/linkovi" className={s.karticaLinkDesno}>
                Svi linktree <IkonaStrelica velicina={14} />
              </Link>
            </div>
            {topDugmad.length === 0 ? (
              <div className={s.prazno}>
                <p>Još nema linktree stranica s dugmadima.</p>
                <Link href="/statistika/linkovi/nova" className={s.dugmeSporedno}>
                  Napravi linktree
                </Link>
              </div>
            ) : (
              <ul className={L.top}>
                {topDugmad.map((d) => (
                  <li key={d.id}>
                    <Link href={`/statistika/${d.id}`} className={L.topRed}>
                      <span className={L.marker}>
                        <Ikona ime={d.ikona} svg={d.ikona_svg} velicina={18} />
                      </span>
                      <span className={L.topInfo}>
                        <span className={L.topIme}>{d.naziv}</span>
                        <span className={L.topPod}>{d.stranica}</span>
                      </span>
                      <span className={L.topBroj}>{broj(d.u_rasponu)}</span>
                      <span className={L.topTraka}>
                        <span
                          className={L.topPopuna}
                          style={{ width: `${(d.u_rasponu / maxDugme) * 100}%`, background: BOJA_KLIKOVA }}
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
