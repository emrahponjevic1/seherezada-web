import Link from "next/link";
import { notFound } from "next/navigation";
import { bazniUrl } from "@/app/(statistika)/_qr/bazniUrl";
import FilterRaspona from "@/app/(statistika)/_qr/FilterRaspona";
import NemaBaze from "@/app/(statistika)/_qr/NemaBaze";
import ObrisiKod from "@/app/(statistika)/_qr/ObrisiKod";
import Prijava from "@/app/(statistika)/_qr/Prijava";
import QrDizajner from "@/app/(statistika)/_qr/QrDizajner";
import Raspodjela from "@/app/(statistika)/_qr/Raspodjela";
import StupciGrafikon from "@/app/(statistika)/_qr/StupciGrafikon";
import Zaglavlje from "@/app/(statistika)/_qr/Zaglavlje";
import s from "@/app/(statistika)/_qr/Statistika.module.css";
import { imaBazu } from "@/app/(statistika)/_qr/baza";
import { pripraviQrTabele } from "@/app/(statistika)/_qr/shema";
import {
  DANI_SEDMICE,
  DANI_SEDMICE_PUNO,
  broj,
  datumVrijeme,
  imeDrzave,
  imeJezika,
  imeUredjaja,
  oznakaDana,
  relativno,
} from "@/app/(statistika)/_qr/format";
import { procitajRaspon } from "@/app/(statistika)/_qr/raspon";
import { jePrijavljen } from "@/app/(statistika)/_qr/sesija";
import { ZADANI_STIL } from "@/app/(statistika)/_qr/stil";
import {
  brojke,
  jedanKod,
  poDanima,
  poDanuSedmice,
  poSatima,
  raspodjela,
  zadnjaSkeniranja,
} from "@/app/(statistika)/_qr/upiti";

export const metadata = { title: "Detalji koda" };

type Red = { vrijednost: string | null; broj: number };
const preimenuj = (redovi: Red[], ime: (v: string | null) => string | null = (v) => v) =>
  redovi.map((r) => ({ naziv: ime(r.vrijednost), broj: r.broj }));

export default async function KodPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ raspon?: string }>;
}) {
  const [{ id }, { raspon: r }] = await Promise.all([params, searchParams]);
  if (!(await jePrijavljen())) return <Prijava />;
  if (!imaBazu()) return <NemaBaze />;
  await pripraviQrTabele();

  const kodId = Number(id);
  if (!Number.isInteger(kodId)) notFound();
  const kod = await jedanKod(kodId);
  if (!kod) notFound();

  const raspon = procitajRaspon(r);
  const mjeren = kod.nacin === "mjeren";
  const kratkiLink = `${bazniUrl()}/q/${kod.slug}`;

  const [b, sveUkupno, dani, sati, sedmica, drzave, gradovi, uredjaji, os, preglednici, proizvodjaci, modeli, jezici, zadnja] =
    await Promise.all([
      brojke(kodId, raspon),
      brojke(kodId, procitajRaspon("sve")),
      poDanima(kodId, raspon),
      poSatima(kodId, raspon),
      poDanuSedmice(kodId, raspon),
      raspodjela(kodId, raspon, "drzava"),
      raspodjela(kodId, raspon, "grad"),
      raspodjela(kodId, raspon, "uredjaj"),
      raspodjela(kodId, raspon, "os"),
      raspodjela(kodId, raspon, "preglednik"),
      raspodjela(kodId, raspon, "proizvodjac"),
      raspodjela(kodId, raspon, "model"),
      raspodjela(kodId, raspon, "jezik"),
      zadnjaSkeniranja(kodId, 50),
    ]);

  const period = raspon.dani === null ? "od početka" : raspon.dani === 1 ? "danas" : `zadnjih ${raspon.naziv}`;
  const brojDana =
    raspon.dani ?? Math.max(1, dani.stupci.length * (dani.jedinica === "week" ? 7 : 1));
  const prikaziStatistiku = mjeren || sveUkupno.skeniranja > 0;

  return (
    <main className={s.sekcija}>
      <div className={s.kontejner}>
        <Zaglavlje
          oznaka={mjeren ? "S brojanjem" : "Direktno"}
          vodeniZig="Kod"
          naslov={kod.naziv}
          nazad={{ href: "/statistika", tekst: "Svi kodovi" }}
          podnaslov={
            <>
              {mjeren && (
                <>
                  <a href={kratkiLink} target="_blank" rel="noreferrer" className={s.kodNaziv}>
                    {kratkiLink.replace(/^https?:\/\//, "")}
                  </a>{" "}
                  →{" "}
                </>
              )}
              <a href={kod.cilj} target="_blank" rel="noreferrer" className={s.kodLinkVeliki}>
                {kod.cilj}
              </a>
              {!kod.aktivan && <span className={`${s.cip} ${s.cipPauziran}`}>Pauziran</span>}
            </>
          }
        >
          {prikaziStatistiku && (
            <a href={`/statistika/${kod.id}/csv`} className={s.dugmeSporedno}>
              Preuzmi skeniranja (CSV)
            </a>
          )}
          <ObrisiKod id={kod.id} naziv={kod.naziv} skeniranja={sveUkupno.skeniranja} />
        </Zaglavlje>

        {!mjeren && (
          <p className={s.info}>
            Ovaj kod vodi <b>direktno</b> na odredište, pa naš sajt ne zna kad je skeniran — skeniranja se ne
            mogu brojati.
            {sveUkupno.skeniranja > 0 && " Ispod su skeniranja iz vremena dok je kod bio s brojanjem."} Ako želiš
            statistiku, prebaci način na „S brojanjem“ i odštampaj novu sliku.
          </p>
        )}

        {prikaziStatistiku && (
          <>
            <FilterRaspona putanja={`/statistika/${kod.id}`} aktivan={raspon} />

            <div className={s.kpiRed}>
              <div className={s.kpi}>
                <span className={s.kpiOznaka}>Skeniranja</span>
                <span className={s.kpiVrijednost}>{broj(b.skeniranja)}</span>
                <span className={s.kpiDodatak}>
                  {period} · ukupno {broj(sveUkupno.skeniranja)}
                </span>
              </div>
              <div className={s.kpi}>
                <span className={s.kpiOznaka}>Jedinstveni posjetioci</span>
                <span className={s.kpiVrijednost}>{broj(b.jedinstveni)}</span>
                <span className={s.kpiDodatak}>isti telefon se broji jednom dnevno</span>
              </div>
              <div className={s.kpi}>
                <span className={s.kpiOznaka}>Prosjek dnevno</span>
                <span className={s.kpiVrijednost}>
                  {(b.skeniranja / brojDana).toLocaleString("bs", { maximumFractionDigits: 1 })}
                </span>
                <span className={s.kpiDodatak}>{period}</span>
              </div>
              <div className={s.kpi}>
                <span className={s.kpiOznaka}>Zadnje skeniranje</span>
                <span className={`${s.kpiVrijednost} ${s.kpiTekst}`}>{relativno(sveUkupno.zadnje)}</span>
                <span className={s.kpiDodatak}>
                  {datumVrijeme(sveUkupno.zadnje)}
                  {sveUkupno.prvo && ` · prvo ${datumVrijeme(sveUkupno.prvo)}`}
                </span>
              </div>
            </div>

            <section className={s.kartica}>
              <div className={s.karticaGlava}>
                <h2 className={s.karticaNaslov}>
                  Skeniranja {dani.jedinica === "week" ? "po sedmicama" : "po danima"}
                </h2>
                {b.boti > 0 && (
                  <span className={s.pomoc}>Isključeno {broj(b.boti)} otvaranja od botova i pregleda linkova.</span>
                )}
              </div>
              <StupciGrafikon
                opis={`Skeniranja koda ${kod.naziv} ${period}`}
                podaci={dani.stupci.map((d) => ({ ...oznakaDana(d.kljuc, dani.jedinica), broj: d.broj }))}
              />
            </section>

            <div className={s.mreza2}>
              <section className={s.kartica}>
                <h2 className={s.karticaNaslov}>Po satu u danu</h2>
                <StupciGrafikon
                  visina={200}
                  opis="Skeniranja po satu u danu"
                  podaci={sati.map((t) => ({
                    oznaka: `${t.kljuc}h`,
                    puna: `${t.kljuc.padStart(2, "0")}:00–${t.kljuc.padStart(2, "0")}:59`,
                    broj: t.broj,
                  }))}
                />
              </section>
              <section className={s.kartica}>
                <h2 className={s.karticaNaslov}>Po danu u sedmici</h2>
                <StupciGrafikon
                  visina={200}
                  opis="Skeniranja po danu u sedmici"
                  podaci={sedmica.map((t, i) => ({
                    oznaka: DANI_SEDMICE[i],
                    puna: DANI_SEDMICE_PUNO[i],
                    broj: t.broj,
                  }))}
                />
              </section>
            </div>

            <h2 className={s.podnaslovSekcije}>Ko skenira</h2>
            <div className={s.mreza3}>
              <Raspodjela naslov="Država" redovi={preimenuj(drzave, imeDrzave)} />
              <Raspodjela naslov="Grad" redovi={preimenuj(gradovi)} />
              <Raspodjela naslov="Jezik telefona" redovi={preimenuj(jezici, imeJezika)} />
              <Raspodjela naslov="Vrsta uređaja" redovi={preimenuj(uredjaji, imeUredjaja)} />
              <Raspodjela naslov="Operativni sistem" redovi={preimenuj(os)} />
              <Raspodjela naslov="Preglednik" redovi={preimenuj(preglednici)} />
              <Raspodjela naslov="Proizvođač" redovi={preimenuj(proizvodjaci)} />
              <Raspodjela naslov="Model uređaja" redovi={preimenuj(modeli)} />
            </div>

            <section className={s.kartica}>
              <div className={s.karticaGlava}>
                <h2 className={s.karticaNaslov}>Zadnja skeniranja</h2>
                <span className={s.pomoc}>Zadnjih 50 · sva su u CSV izvozu</span>
              </div>
              {zadnja.length === 0 ? (
                <p className={s.prazno}>Još nema skeniranja.</p>
              ) : (
                <div className={s.tabelaOkvir}>
                  <table className={s.tabela}>
                    <thead>
                      <tr>
                        <th>Vrijeme</th>
                        <th>Lokacija</th>
                        <th>Uređaj</th>
                        <th>Sistem</th>
                        <th>Preglednik</th>
                        <th>Jezik</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zadnja.map((z) => (
                        <tr key={z.id}>
                          <td className={s.bezPrijeloma}>{datumVrijeme(z.vrijeme)}</td>
                          <td>{[z.grad, imeDrzave(z.drzava)].filter(Boolean).join(", ") || "—"}</td>
                          <td>
                            {imeUredjaja(z.uredjaj)}
                            {(z.proizvodjac || z.model) && (
                              <span className={s.kodLink}>{[z.proizvodjac, z.model].filter(Boolean).join(" ")}</span>
                            )}
                          </td>
                          <td>{[z.os, z.os_verzija].filter(Boolean).join(" ") || "—"}</td>
                          <td>{z.preglednik ?? "—"}</td>
                          <td>{z.jezik ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        <h2 className={s.podnaslovSekcije} id="uredi">
          Uredi kod i preuzmi sliku
        </h2>
        <QrDizajner
          bazniUrl={bazniUrl()}
          kod={{
            id: kod.id,
            slug: kod.slug,
            naziv: kod.naziv,
            cilj: kod.cilj,
            nacin: kod.nacin,
            aktivan: kod.aktivan,
            biljeska: kod.biljeska,
            stil: { ...ZADANI_STIL, ...kod.stil },
          }}
        />

        <p className={s.pomoc}>
          Kreiran {datumVrijeme(kod.kreiran)} · izmijenjen {datumVrijeme(kod.izmijenjen)} ·{" "}
          <Link href="/statistika">nazad na sve kodove</Link>
        </p>
      </div>
    </main>
  );
}
