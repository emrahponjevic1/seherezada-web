import Link from "next/link";
import { notFound } from "next/navigation";
import { bazniUrl } from "@/app/(statistika)/_qr/bazniUrl";
import FilterRaspona from "@/app/(statistika)/_qr/FilterRaspona";
import KopirajDugme from "@/app/(statistika)/_qr/KopirajDugme";
import NemaBaze from "@/app/(statistika)/_qr/NemaBaze";
import ObrisiKod from "@/app/(statistika)/_qr/ObrisiKod";
import Prijava from "@/app/(statistika)/_qr/Prijava";
import QrDizajner from "@/app/(statistika)/_qr/QrDizajner";
import QrSlicica from "@/app/(statistika)/_qr/QrSlicica";
import Raspodjela from "@/app/(statistika)/_qr/Raspodjela";
import StupciGrafikon from "@/app/(statistika)/_qr/StupciGrafikon";
import ViseNaTelefonu from "@/app/(statistika)/_qr/ViseNaTelefonu";
import Zaglavlje from "@/app/(statistika)/_qr/Zaglavlje";
import s from "@/app/(statistika)/_qr/Statistika.module.css";
import p from "@/app/(statistika)/_qr/Stranice.module.css";
import { imaBazu } from "@/app/(statistika)/_qr/baza";
import { bojeKodova } from "@/app/(statistika)/_qr/boje";
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
import { procitajRaspon, type Raspon } from "@/app/(statistika)/_qr/raspon";
import { popisStranica } from "@/app/(statistika)/_linkovi/upiti";
import { jeInterno, nazivInterne } from "@/app/(statistika)/_linkovi/interniCilj";
import { jePrijavljen } from "@/app/(statistika)/_qr/sesija";
import { ZADANI_STIL } from "@/app/(statistika)/_qr/stil";
import {
  brojke,
  idjeviKodova,
  jedanKod,
  poDanima,
  poDanuSedmice,
  poSatima,
  raspodjela,
  zadnjaSkeniranja,
} from "@/app/(statistika)/_qr/upiti";

// ---------------------------------------------------------------------------
// STRAN KODE
//
// Dva zavihka: "Statistika" (privzeto) in "Uredi i preuzmi" (?prikaz=uredi).
// Statistične poizvedbe tečejo samo, ko je odprt zavihek statistike.
//
// Na telefonu je privzeto vidno samo bistveno (2 številki, graf po dnevih,
// država, mesto, naprava, sistem, zadnja skeniranja); ostalo je za gumbom
// "Više statistike". Na računalniku je vse vidno.
// ---------------------------------------------------------------------------

export const metadata = { title: "Detalji koda" };

type Red = { vrijednost: string | null; broj: number };
const preimenuj = (redovi: Red[], ime: (v: string | null) => string | null = (v) => v) =>
  redovi.map((r) => ({ naziv: ime(r.vrijednost), broj: r.broj }));

async function Statistika({
  kodId,
  naziv,
  raspon,
  jeDugme,
}: {
  kodId: number;
  naziv: string;
  raspon: Raspon;
  /** Gumb na strani s povezavami se ne skenira, ampak klikne. */
  jeDugme: boolean;
}) {
  const opseg = { kod: kodId };
  const R = jeDugme
    ? { veliko: "Klikovi", malo: "klikova", ko: "Ko klikne", zadnja: "Zadnji klikovi", nema: "Još nema klikova." }
    : { veliko: "Skeniranja", malo: "skeniranja", ko: "Ko skenira", zadnja: "Zadnja skeniranja", nema: "Još nema skeniranja." };
  const [b, dani, sati, sedmica, drzave, gradovi, uredjaji, os, preglednici, proizvodjaci, modeli, jezici, zadnja] =
    await Promise.all([
      brojke(opseg, raspon),
      poDanima(opseg, raspon),
      poSatima(opseg, raspon),
      poDanuSedmice(opseg, raspon),
      raspodjela(opseg, raspon, "drzava"),
      raspodjela(opseg, raspon, "grad"),
      raspodjela(opseg, raspon, "uredjaj"),
      raspodjela(opseg, raspon, "os"),
      raspodjela(opseg, raspon, "preglednik"),
      raspodjela(opseg, raspon, "proizvodjac"),
      raspodjela(opseg, raspon, "model"),
      raspodjela(opseg, raspon, "jezik"),
      zadnjaSkeniranja(kodId, 50),
    ]);

  const period = raspon.dani === null ? "od početka" : raspon.dani === 1 ? "danas" : `zadnjih ${raspon.naziv}`;
  const brojDana = raspon.dani ?? Math.max(1, dani.stupci.length * (dani.jedinica === "week" ? 7 : 1));
  const najcesciSat = sati.reduce((z, t) => (t.broj > z.broj ? t : z), sati[0]);

  return (
    <>
      <FilterRaspona putanja={`/statistika/${kodId}`} aktivan={raspon} />

      <div className={s.kpiRed}>
        <div className={s.kpi}>
          <span className={s.kpiOznaka}>{R.veliko}</span>
          <span className={s.kpiVrijednost}>{broj(b.skeniranja)}</span>
          <span className={s.kpiDodatak}>{period}</span>
        </div>
        <div className={s.kpi}>
          <span className={s.kpiOznaka}>Jedinstveni</span>
          <span className={s.kpiVrijednost}>{broj(b.jedinstveni)}</span>
          <span className={s.kpiDodatak}>isti telefon jednom dnevno</span>
        </div>
        <div className={`${s.kpi} ${p.kpiSporedni}`}>
          <span className={s.kpiOznaka}>Prosjek dnevno</span>
          <span className={s.kpiVrijednost}>
            {(b.skeniranja / brojDana).toLocaleString("bs", { maximumFractionDigits: 1 })}
          </span>
          <span className={s.kpiDodatak}>{period}</span>
        </div>
        <div className={`${s.kpi} ${p.kpiSporedni}`}>
          <span className={s.kpiOznaka}>Najviše {R.malo}</span>
          <span className={s.kpiVrijednost}>
            {najcesciSat.broj > 0
              ? `${najcesciSat.kljuc.padStart(2, "0")}–${String((Number(najcesciSat.kljuc) + 1) % 24).padStart(2, "0")}h`
              : "—"}
          </span>
          <span className={s.kpiDodatak}>najčešće doba dana</span>
        </div>
      </div>

      <section className={s.kartica}>
        <div className={s.karticaGlava}>
          <h2 className={s.karticaNaslov}>
            {R.veliko} {dani.jedinica === "week" ? "po sedmicama" : "po danima"}
          </h2>
          {b.boti > 0 && (
            <span className={s.pomoc}>Isključeno {broj(b.boti)} otvaranja od botova i pregleda linkova.</span>
          )}
        </div>
        <StupciGrafikon
          opis={`${R.veliko} — ${naziv} ${period}`}
          podaci={dani.stupci.map((d) => ({ ...oznakaDana(d.kljuc, dani.jedinica), broj: d.broj }))}
        />
      </section>

      <h2 className={s.podnaslovSekcije}>{R.ko}</h2>
      <div className={p.mrezaRaspodjela}>
        <Raspodjela naslov="Država" redovi={preimenuj(drzave, imeDrzave)} />
        <Raspodjela naslov="Grad" redovi={preimenuj(gradovi)} />
        <Raspodjela naslov="Vrsta uređaja" redovi={preimenuj(uredjaji, imeUredjaja)} />
        <Raspodjela naslov="Operativni sistem" redovi={preimenuj(os)} />
      </div>

      <ViseNaTelefonu oznaka="Više statistike (sati, dani, jezik, preglednik, model)">
        <div className={s.mreza2}>
          <section className={s.kartica}>
            <h2 className={s.karticaNaslov}>Po satu u danu</h2>
            <StupciGrafikon
              visina={200}
              opis={`${R.veliko} po satu u danu`}
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
              opis={`${R.veliko} po danu u sedmici`}
              podaci={sedmica.map((t, i) => ({ oznaka: DANI_SEDMICE[i], puna: DANI_SEDMICE_PUNO[i], broj: t.broj }))}
            />
          </section>
        </div>
        <div className={p.mrezaRaspodjela}>
          <Raspodjela naslov="Jezik telefona" redovi={preimenuj(jezici, imeJezika)} />
          <Raspodjela naslov="Preglednik" redovi={preimenuj(preglednici)} />
          <Raspodjela naslov="Proizvođač" redovi={preimenuj(proizvodjaci)} />
          <Raspodjela naslov="Model uređaja" redovi={preimenuj(modeli)} />
        </div>
      </ViseNaTelefonu>

      <section className={s.kartica}>
        <div className={s.karticaGlava}>
          <h2 className={s.karticaNaslov}>{R.zadnja}</h2>
          <span className={s.pomoc}>Zadnjih 50 · sva su u CSV izvozu</span>
        </div>
        {zadnja.length === 0 ? (
          <p className={s.prazno}>{R.nema}</p>
        ) : (
          <div>
            <div className={p.skZaglavlje} aria-hidden="true">
              <span>Vrijeme</span>
              <span>Lokacija</span>
              <span>Uređaj</span>
              <span>Sistem</span>
              <span>Preglednik</span>
              <span>Jezik</span>
            </div>
            <ul className={p.skeniranja}>
              {zadnja.map((z) => {
                const model = [z.proizvodjac, z.model].filter(Boolean).join(" ");
                const sistem = [z.os, z.os_verzija].filter(Boolean).join(" ");
                return (
                  <li key={z.id} className={p.skeniranje}>
                    <span className={p.skVrijeme}>
                      <b>{relativno(z.vrijeme)}</b>
                      <small>{datumVrijeme(z.vrijeme)}</small>
                    </span>
                    <span className={p.skLokacija}>
                      {[z.grad, imeDrzave(z.drzava)].filter(Boolean).join(", ") || "Nepoznato"}
                    </span>
                    {/* Računalnik: štirje stolpci. Telefon: ena drobna vrstica pod časom. */}
                    <span className={p.skDetalji}>
                      <span>
                        {imeUredjaja(z.uredjaj)}
                        {model && <small>{model}</small>}
                      </span>
                      <span data-prazno={sistem ? undefined : "da"}>{sistem || "—"}</span>
                      <span data-prazno={z.preglednik ? undefined : "da"}>{z.preglednik ?? "—"}</span>
                      <span data-prazno={z.jezik ? undefined : "da"}>{z.jezik ?? "—"}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </>
  );
}

export default async function KodPage({
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

  const kodId = Number(id);
  if (!Number.isInteger(kodId)) notFound();
  const kod = await jedanKod(kodId);
  if (!kod) notFound();

  const raspon = procitajRaspon(r);
  const mjeren = kod.nacin === "mjeren";
  // Vrstica z stranica_id ni koda za tisk, ampak gumb na strani s povezavami.
  // Ureja se tam, ne tu, zato zavihka z oblikovalnikom ne pokažemo.
  const jeDugme = kod.stranica_id !== null;
  const potStranice = `/statistika/linkovi/${kod.stranica_id}`;
  const kratkiLink = `${bazniUrl()}/q/${kod.slug}`;
  const stil = { ...ZADANI_STIL, ...kod.stil };
  const [ukupno, idjevi, stranice] = await Promise.all([
    brojke({ kod: kodId }, procitajRaspon("sve")),
    idjeviKodova(),
    popisStranica(),
  ]);
  // Ista barva kot pri tej kodi v grafu in seznamu na /statistika.
  const boja = bojeKodova(idjevi).get(kod.id)?.boja ?? "#ea580c";

  const imaStatistiku = mjeren || ukupno.skeniranja > 0;
  const prikaz = jeDugme ? "statistika" : trazeniPrikaz === "uredi" || !imaStatistiku ? "uredi" : "statistika";
  const urlStatistike = `/statistika/${kod.id}${r ? `?raspon=${raspon.kljuc}` : ""}`;
  const urlUredjivanja = jeDugme ? `${potStranice}?prikaz=uredi` : `/statistika/${kod.id}?prikaz=uredi`;

  return (
    <main className={s.sekcija} style={{ "--boja-koda": boja } as React.CSSProperties}>
      <div className={s.kontejner}>
        <Zaglavlje
          oznaka={jeDugme ? "Dugme" : mjeren ? "S brojanjem" : "Direktno"}
          vodeniZig={jeDugme ? "Link" : "Kod"}
          naslov={kod.naziv}
          nazad={
            jeDugme
              ? { href: potStranice, tekst: "Nazad na stranicu" }
              : { href: "/statistika", tekst: "Svi kodovi" }
          }
        />

        {/* ---- Kartica koda: slika, linkovi, ukupno ---- */}
        <section className={`${s.kartica} ${p.kodKartica}`}>
          <Link
            href={urlUredjivanja}
            className={p.kodKarticaSlika}
            aria-label={jeDugme ? "Uredi dugme" : "Uredi i preuzmi QR kod"}
            scroll={false}
          >
            <QrSlicica podaci={mjeren ? kratkiLink : kod.cilj} stil={stil} velicina={112} />
          </Link>

          <div className={p.kodKarticaInfo}>
            <div className={p.cipovi}>
              <span className={p.kodBoja} style={{ background: boja }} aria-hidden="true" />
              <span className={`${s.cip} ${mjeren ? s.cipMjeren : s.cipDirektan}`}>{mjeren ? "S brojanjem" : "Direktno"}</span>
              <span className={`${s.cip} ${kod.aktivan ? s.cipMjeren : s.cipPauziran}`}>{kod.aktivan ? "Aktivan" : "Pauziran"}</span>
            </div>
            {mjeren && (
              <div className={p.linkRed}>
                <span className={p.linkOznaka}>Kratki link</span>
                <span className={p.linkVrijednost}>
                  <a href={kratkiLink} target="_blank" rel="noreferrer" className={`${s.kodNaziv} ${p.linkTekst}`}>
                    {kratkiLink.replace(/^https?:\/\//, "")}
                  </a>
                  <KopirajDugme tekst={kratkiLink} />
                </span>
              </div>
            )}
            <div className={p.linkRed}>
              <span className={p.linkOznaka}>Odredište</span>
              <span className={p.linkVrijednost}>
                {/* "interno:/meni" ni naslov, ampak navodilo — pokažemo ime strani,
                    ker bi povezava s to shemo vodila v prazno. */}
                {jeInterno(kod.cilj) ? (
                  <span className={s.kodLinkVeliki}>{nazivInterne(kod.cilj)} — po jeziku gosta</span>
                ) : (
                  <a href={kod.cilj} target="_blank" rel="noreferrer" className={`${s.kodLinkVeliki} ${p.linkTekst}`}>
                    {kod.cilj}
                  </a>
                )}
              </span>
            </div>
            {kod.biljeska && (
              <div className={`${p.linkRed} ${p.samoVeci}`}>
                <span className={p.linkOznaka}>Bilješka</span>
                <span className={p.linkVrijednost}>{kod.biljeska}</span>
              </div>
            )}
          </div>

          {imaStatistiku && (
            <div className={p.kodKarticaBrojke}>
              <span className={p.velikiBroj}>{broj(ukupno.skeniranja)}</span>
              <span className={s.kpiOznaka}>{jeDugme ? "klikova ukupno" : "skeniranja ukupno"}</span>
              <span className={s.kpiDodatak} title={datumVrijeme(ukupno.zadnje)}>
                zadnje {relativno(ukupno.zadnje)}
              </span>
            </div>
          )}
        </section>

        {/* ---- Zavihka ---- */}
        <nav className={p.kartice} aria-label="Prikaz koda">
          {imaStatistiku && (
            <Link
              href={urlStatistike}
              className={`${p.karticaLink} ${prikaz === "statistika" ? p.karticaAktivna : ""}`}
              aria-current={prikaz === "statistika" ? "page" : undefined}
              scroll={false}
            >
              Statistika
            </Link>
          )}
          <Link
            href={urlUredjivanja}
            className={`${p.karticaLink} ${prikaz === "uredi" ? p.karticaAktivna : ""}`}
            aria-current={prikaz === "uredi" ? "page" : undefined}
            scroll={false}
          >
            {jeDugme ? "Uredi dugme" : "Uredi i preuzmi"}
          </Link>
          {prikaz === "statistika" && (
            <span className={p.karticeDesno}>
              <a href={`/statistika/${kod.id}/csv`} className={s.dugmeSporedno}>
                Preuzmi CSV
              </a>
            </span>
          )}
        </nav>

        {prikaz === "statistika" ? (
          <>
            {!mjeren && (
              <p className={s.info}>
                Kod sada vodi <b>direktno</b> na odredište, pa se nova skeniranja ne broje. Ispod su skeniranja iz
                vremena dok je bio s brojanjem.
              </p>
            )}
            <Statistika kodId={kod.id} naziv={kod.naziv} raspon={raspon} jeDugme={jeDugme} />
          </>
        ) : (
          <>
            {!mjeren && (
              <p className={s.info}>
                Ovaj kod vodi <b>direktno</b> na odredište, pa se skeniranja ne mogu brojati. Za statistiku prebaci način
                na „S brojanjem“ i odštampaj novu sliku.
              </p>
            )}

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
                stil,
                vodiNa: kod.vodi_na,
              }}
              stranice={stranice}
            />

            <section className={`${s.kartica} ${p.opasnaZona}`}>
              <div>
                <h2 className={s.karticaNaslov}>Brisanje koda</h2>
                <p className={s.pomoc}>
                  Briše kod i {ukupno.skeniranja > 0 ? `svih ${broj(ukupno.skeniranja)} skeniranja` : "njegovu statistiku"}. Već
                  odštampani kodovi s kratkim linkom vodit će na naslovnicu. Ne može se vratiti.
                </p>
                <p className={s.pomoc}>
                  Kreiran {datumVrijeme(kod.kreiran)} · izmijenjen {datumVrijeme(kod.izmijenjen)}
                </p>
              </div>
              <ObrisiKod id={kod.id} naziv={kod.naziv} skeniranja={ukupno.skeniranja} />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
