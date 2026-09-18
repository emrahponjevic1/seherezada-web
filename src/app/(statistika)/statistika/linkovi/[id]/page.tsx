import Link from "next/link";
import { notFound } from "next/navigation";
import { bazniUrl } from "@/app/(statistika)/_qr/bazniUrl";
import FilterRaspona from "@/app/(statistika)/_qr/FilterRaspona";
import KopirajDugme from "@/app/(statistika)/_qr/KopirajDugme";
import NemaBaze from "@/app/(statistika)/_qr/NemaBaze";
import Prijava from "@/app/(statistika)/_qr/Prijava";
import SlojeviGrafikon, { type Serija } from "@/app/(statistika)/_qr/SlojeviGrafikon";
import Zaglavlje from "@/app/(statistika)/_qr/Zaglavlje";
import s from "@/app/(statistika)/_qr/Statistika.module.css";
import p from "@/app/(statistika)/_qr/Stranice.module.css";
import l from "@/app/(statistika)/_linkovi/Panel.module.css";
import { imaBazu } from "@/app/(statistika)/_qr/baza";
import { BOJA_OSTALI, bojeKodova } from "@/app/(statistika)/_qr/boje";
import { broj, datumVrijeme, oznakaDana, relativno } from "@/app/(statistika)/_qr/format";
import { procitajRaspon } from "@/app/(statistika)/_qr/raspon";
import { jePrijavljen } from "@/app/(statistika)/_qr/sesija";
import { pripraviQrTabele } from "@/app/(statistika)/_qr/shema";
import { brojke, poDanimaPoKodu } from "@/app/(statistika)/_qr/upiti";
import Urednik from "@/app/(statistika)/_linkovi/Urednik";
import { nazivInterne } from "@/app/(statistika)/_linkovi/interniCilj";
import { Ikona } from "@/app/(statistika)/_linkovi/Ikone";
import {
  dugmadSaBrojem,
  jednaStranica,
  kodoviZaStranicu,
  otvaranjaStranice,
  svaDugmad,
} from "@/app/(statistika)/_linkovi/upiti";

// ---------------------------------------------------------------------------
// STRAN LINKTREEJA
//
// Dva zavihka, kot pri kodi: "Statistika" (privzeto) in "Uredi" (?prikaz=uredi).
//
// Dve številki, ki ju ne smemo zamenjati:
//   OTVARANJA — kolikokrat je bila stran odprta (skeniranja kod, ki vodijo nanjo)
//   KLIKOVI   — kolikokrat je kdo pritisnil gumb na njej
// Razmerje med njima pove, ali stran sploh koga premakne naprej.
// ---------------------------------------------------------------------------

export const metadata = { title: "Linktree" };

function skratiCilj(cilj: string) {
  if (cilj.startsWith("interno:")) return `${nazivInterne(cilj)} — po jeziku gosta`;
  if (cilj.startsWith("tel:")) return cilj.replace("tel:", "☎ ");
  return cilj.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export default async function LinktreePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ raspon?: string; prikaz?: string }>;
}) {
  const [{ id }, { raspon: r, prikaz: trazeniPrikaz }] = await Promise.all([params, searchParams]);
  if (!(await jePrijavljen())) return <Prijava />;
  if (!imaBazu()) return <NemaBaze />;
  await pripraviQrTabele();

  const stranicaId = Number(id);
  if (!Number.isInteger(stranicaId)) notFound();
  const stranica = await jednaStranica(stranicaId);
  if (!stranica) notFound();

  const raspon = procitajRaspon(r);
  const prikaz = trazeniPrikaz === "uredi" ? "uredi" : "statistika";
  const javniNaslov = `${bazniUrl()}/links/${stranica.slug}`;

  const [dugmad, otvaranja, klikovi, dani, kodovi] = await Promise.all([
    dugmadSaBrojem(stranicaId, raspon),
    otvaranjaStranice(stranicaId, raspon),
    brojke({ stranica: stranicaId }, raspon),
    poDanimaPoKodu({ stranica: stranicaId }, raspon),
    kodoviZaStranicu(stranicaId, raspon),
  ]);

  const period = raspon.dani === null ? "od početka" : raspon.dani === 1 ? "danas" : `zadnjih ${raspon.naziv}`;
  // Namerno ni odstotek: en gost lahko pritisne več gumbov, zato bi "stopa
  // klika" presegla 100 % in ne bi pomenila nič. To pove, koliko gumbov v
  // povprečju pritisne gost, ki stran odpre.
  const poOtvaranju =
    otvaranja.otvaranja > 0
      ? (klikovi.skeniranja / otvaranja.otvaranja).toLocaleString("bs", { maximumFractionDigits: 1 })
      : "—";
  const najbolje = dugmad.reduce<(typeof dugmad)[number] | null>(
    (z, d) => (d.u_rasponu > (z?.u_rasponu ?? 0) ? d : z),
    null
  );

  // Barva gumba je ista v grafu in v tabeli; dodeli se po vrstnem redu nastanka.
  const boje = bojeKodova(dugmad.map((d) => d.id));
  const serije: Serija[] = [];
  const ostali = new Array<number>(dani.kljucevi.length).fill(0);
  for (const d of [...dugmad].sort((a, b) => a.id - b.id)) {
    const vrijednosti = dani.poKodu.get(d.id);
    if (!vrijednosti) continue;
    const barva = boje.get(d.id)!;
    if (barva.ostali) vrijednosti.forEach((v, i) => (ostali[i] += v));
    else serije.push({ id: String(d.id), naziv: d.naziv, boja: barva.boja, vrijednosti });
  }
  if (ostali.some((v) => v > 0)) {
    serije.push({ id: "ostali", naziv: "Ostala dugmad", boja: BOJA_OSTALI, vrijednosti: ostali });
  }

  const urlStatistike = `/statistika/linkovi/${stranica.id}${r ? `?raspon=${raspon.kljuc}` : ""}`;
  const urlUredjivanja = `/statistika/linkovi/${stranica.id}?prikaz=uredi`;

  return (
    <main className={s.sekcija}>
      <div className={s.kontejner}>
        <Zaglavlje
          oznaka="Linktree"
          vodeniZig="Link"
          naslov={stranica.naziv}
          nazad={{ href: "/statistika", tekst: "Nazad na pregled" }}
        />

        <section className={`${s.kartica} ${p.kodKartica}`}>
          <div className={p.kodKarticaInfo}>
            <div className={p.cipovi}>
              <span className={`${s.cip} ${stranica.aktivna ? s.cipMjeren : s.cipPauziran}`}>
                {stranica.aktivna ? "Aktivna" : "Ugašena"}
              </span>
              {stranica.glavna && <span className={`${s.cip} ${s.cipDirektan}`}>Glavna</span>}
              <span className={`${s.cip} ${s.cipDirektan}`}>{dugmad.length} dugmadi</span>
            </div>
            <div className={p.linkRed}>
              <span className={p.linkOznaka}>Adresa</span>
              <span className={p.linkVrijednost}>
                <a href={javniNaslov} target="_blank" rel="noreferrer" className={`${s.kodNaziv} ${p.linkTekst}`}>
                  {javniNaslov.replace(/^https?:\/\//, "")}
                </a>
                <KopirajDugme tekst={javniNaslov} />
              </span>
            </div>
            <div className={p.linkRed}>
              <span className={p.linkOznaka}>Kodovi koji vode ovamo</span>
              <span className={p.linkVrijednost}>
                {kodovi.length === 0 ? (
                  <span className={s.pomoc}>
                    Nijedan još. Napravi QR kod i za odredište izaberi ovu stranicu.
                  </span>
                ) : (
                  kodovi.map((k, i) => (
                    <span key={k.id}>
                      {i > 0 && " · "}
                      <Link href={`/statistika/${k.id}`} className={p.linkTekst}>
                        {k.naziv}
                      </Link>{" "}
                      ({broj(k.u_rasponu)})
                    </span>
                  ))
                )}
              </span>
            </div>
          </div>

          <div className={p.kodKarticaBrojke}>
            <span className={p.velikiBroj}>{broj(klikovi.skeniranja)}</span>
            <span className={s.kpiOznaka}>klikova {period}</span>
            <span className={s.kpiDodatak} title={datumVrijeme(klikovi.zadnje)}>
              zadnji {relativno(klikovi.zadnje)}
            </span>
          </div>
        </section>

        <nav className={p.kartice} aria-label="Prikaz stranice">
          <Link
            href={urlStatistike}
            className={`${p.karticaLink} ${prikaz === "statistika" ? p.karticaAktivna : ""}`}
            aria-current={prikaz === "statistika" ? "page" : undefined}
            scroll={false}
          >
            Statistika
          </Link>
          <Link
            href={urlUredjivanja}
            className={`${p.karticaLink} ${prikaz === "uredi" ? p.karticaAktivna : ""}`}
            aria-current={prikaz === "uredi" ? "page" : undefined}
            scroll={false}
          >
            Uredi
          </Link>
        </nav>

        {prikaz === "uredi" ? (
          <Urednik
            bazniUrl={bazniUrl()}
            predlozeniSlug={stranica.slug}
            stranica={stranica}
            dugmad={await svaDugmad(stranicaId)}
          />
        ) : (
          <>
            <FilterRaspona putanja={`/statistika/linkovi/${stranica.id}`} aktivan={raspon} />

            <div className={s.kpiRed}>
              <div className={s.kpi}>
                <span className={s.kpiOznaka}>Otvaranja stranice</span>
                <span className={s.kpiVrijednost}>{broj(otvaranja.otvaranja)}</span>
                <span className={s.kpiDodatak}>skeniranja kodova koji vode ovamo</span>
              </div>
              <div className={s.kpi}>
                <span className={s.kpiOznaka}>Klikovi na dugmad</span>
                <span className={s.kpiVrijednost}>{broj(klikovi.skeniranja)}</span>
                <span className={s.kpiDodatak}>{period}</span>
              </div>
              <div className={`${s.kpi} ${p.kpiSporedni}`}>
                <span className={s.kpiOznaka}>Klikova po otvaranju</span>
                <span className={s.kpiVrijednost}>{poOtvaranju}</span>
                <span className={s.kpiDodatak}>koliko dugmadi pritisne prosječan gost</span>
              </div>
              <div className={`${s.kpi} ${p.kpiSporedni}`}>
                <span className={s.kpiOznaka}>Najjače dugme</span>
                <span className={`${s.kpiVrijednost} ${s.kpiTekst}`} title={najbolje?.naziv}>
                  {najbolje && najbolje.u_rasponu > 0 ? najbolje.naziv : "—"}
                </span>
                <span className={s.kpiDodatak}>
                  {najbolje && najbolje.u_rasponu > 0 ? `${broj(najbolje.u_rasponu)} klikova` : "još nema klikova"}
                </span>
              </div>
            </div>

            <section className={s.kartica}>
              <div className={s.karticaGlava}>
                <h2 className={s.karticaNaslov}>
                  Klikovi {dani.jedinica === "week" ? "po sedmicama" : "po danima"}
                </h2>
                {klikovi.boti > 0 && (
                  <span className={s.pomoc}>Isključeno {broj(klikovi.boti)} otvaranja od botova.</span>
                )}
              </div>
              <SlojeviGrafikon
                opis={`Klikovi po dugmadima ${period}`}
                oznake={dani.kljucevi.map((kljuc) => oznakaDana(kljuc, dani.jedinica))}
                serije={serije}
              />
            </section>

            <section className={s.kartica}>
              <div className={s.karticaGlava}>
                <h2 className={s.karticaNaslov}>Svako dugme posebno</h2>
                <span className={s.pomoc}>Klikni red za punu statistiku tog linka</span>
              </div>

              {dugmad.length === 0 ? (
                <div className={s.prazno}>
                  <p>Ova stranica još nema nijedno dugme.</p>
                  <Link href={urlUredjivanja} className={s.dugme}>
                    Dodaj dugmad
                  </Link>
                </div>
              ) : (
                <ul className={l.tabelaDugmadi}>
                  {dugmad.map((d) => {
                    const udio =
                      otvaranja.otvaranja > 0 ? Math.round((d.u_rasponu / otvaranja.otvaranja) * 100) : 0;
                    return (
                      <li key={d.id}>
                        <Link
                          href={`/statistika/${d.id}`}
                          className={`${l.dugmeRed} ${d.aktivan ? "" : l.dugmeUgasen}`}
                        >
                          <span className={p.kodBoja} style={{ background: boje.get(d.id)?.boja }} aria-hidden="true" />
                          <span className={l.dugmeInfo}>
                            <span className={l.dugmeNatpis}>
                              {/* Prej je tu stal surovi ključ ("i:meni") kot besedilo. */}
                              <span className={l.dugmeIkona}>
                                <Ikona ime={d.ikona} svg={d.ikona_svg} velicina={16} />
                              </span>
                              {d.naziv}
                              {!d.aktivan && " · ugašeno"}
                            </span>
                            <span className={l.dugmeCilj}>{skratiCilj(d.cilj)}</span>
                          </span>
                          <span className={l.dugmeBroj}>{broj(d.u_rasponu)}</span>
                          <span className={l.dugmeUdio}>{otvaranja.otvaranja > 0 ? `${udio} %` : "—"}</span>
                          <span className={l.dugmeZadnje} title={datumVrijeme(d.zadnje)}>
                            {relativno(d.zadnje)}
                          </span>
                          <span className={p.kodStrelica} aria-hidden="true">
                            →
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
