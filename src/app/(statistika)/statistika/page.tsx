import Link from "next/link";
import s from "@/app/(statistika)/_qr/Statistika.module.css";
import { imaBazu } from "@/app/(statistika)/_qr/baza";
import NemaBaze from "@/app/(statistika)/_qr/NemaBaze";
import Prijava from "@/app/(statistika)/_qr/Prijava";
import { jePrijavljen } from "@/app/(statistika)/_qr/sesija";
import Zaglavlje from "@/app/(statistika)/_qr/Zaglavlje";
import { bazniUrl } from "@/app/(statistika)/_qr/bazniUrl";
import FilterRaspona from "@/app/(statistika)/_qr/FilterRaspona";
import { broj, datumVrijeme, oznakaDana, relativno } from "@/app/(statistika)/_qr/format";
import QrSlicica from "@/app/(statistika)/_qr/QrSlicica";
import { procitajRaspon } from "@/app/(statistika)/_qr/raspon";
import { pripraviQrTabele } from "@/app/(statistika)/_qr/shema";
import { ZADANI_STIL } from "@/app/(statistika)/_qr/stil";
import StupciGrafikon from "@/app/(statistika)/_qr/StupciGrafikon";
import { brojke, poDanima, sviKodovi } from "@/app/(statistika)/_qr/upiti";

export const metadata = { title: "QR statistika" };

export default async function StatistikaPage({
  searchParams,
}: {
  searchParams: Promise<{ raspon?: string }>;
}) {
  const { raspon: r } = await searchParams;
  if (!(await jePrijavljen())) return <Prijava />;
  if (!imaBazu()) return <NemaBaze />;

  await pripraviQrTabele();
  const raspon = procitajRaspon(r);
  const [kodovi, b, dani] = await Promise.all([sviKodovi(raspon), brojke(null, raspon), poDanima(null, raspon)]);

  const aktivnih = kodovi.filter((k) => k.aktivan).length;
  const najbolji = kodovi.reduce<(typeof kodovi)[number] | null>(
    (z, k) => (k.u_rasponu > (z?.u_rasponu ?? 0) ? k : z),
    null
  );
  const period = raspon.dani === null ? "od početka" : raspon.dani === 1 ? "danas" : `zadnjih ${raspon.naziv}`;

  return (
    <main className={s.sekcija}>
      <div className={s.kontejner}>
        <Zaglavlje
          oznaka="Statistika"
          vodeniZig="QR"
          naslov="QR kodovi"
          podnaslov="Svi kodovi na jednom mjestu: koliko puta je koji skeniran, odakle i s kojeg uređaja."
        >
          <Link href="/statistika/novi" className={s.dugme}>
            + Novi QR kod
          </Link>
        </Zaglavlje>

        <FilterRaspona putanja="/statistika" aktivan={raspon} />

        <div className={s.kpiRed}>
          <div className={s.kpi}>
            <span className={s.kpiOznaka}>Skeniranja</span>
            <span className={s.kpiVrijednost}>{broj(b.skeniranja)}</span>
            <span className={s.kpiDodatak}>{period}</span>
          </div>
          <div className={s.kpi}>
            <span className={s.kpiOznaka}>Jedinstveni posjetioci</span>
            <span className={s.kpiVrijednost}>{broj(b.jedinstveni)}</span>
            <span className={s.kpiDodatak}>isti telefon se broji jednom dnevno</span>
          </div>
          <div className={s.kpi}>
            <span className={s.kpiOznaka}>Aktivni kodovi</span>
            <span className={s.kpiVrijednost}>{aktivnih}</span>
            <span className={s.kpiDodatak}>od ukupno {kodovi.length}</span>
          </div>
          <div className={s.kpi}>
            <span className={s.kpiOznaka}>Najčešće skeniran</span>
            <span className={`${s.kpiVrijednost} ${s.kpiTekst}`}>{najbolji?.naziv ?? "—"}</span>
            <span className={s.kpiDodatak}>
              {najbolji ? `${broj(najbolji.u_rasponu)} skeniranja` : "još nema skeniranja"}
            </span>
          </div>
        </div>

        <section className={s.kartica}>
          <div className={s.karticaGlava}>
            <h2 className={s.karticaNaslov}>
              Skeniranja {dani.jedinica === "week" ? "po sedmicama" : "po danima"} — svi kodovi
            </h2>
            {b.boti > 0 && (
              <span className={s.pomoc}>Isključeno {broj(b.boti)} otvaranja od botova i pregleda linkova.</span>
            )}
          </div>
          <StupciGrafikon
            opis={`Skeniranja svih kodova ${period}`}
            podaci={dani.stupci.map((d) => ({ ...oznakaDana(d.kljuc, dani.jedinica), broj: d.broj }))}
          />
        </section>

        <section className={s.kartica}>
          <h2 className={s.karticaNaslov}>Svi kodovi</h2>
          {kodovi.length === 0 ? (
            <div className={s.prazno}>
              <p>Još nemaš nijedan QR kod.</p>
              <Link href="/statistika/novi" className={s.dugme}>
                Kreiraj prvi kod
              </Link>
            </div>
          ) : (
            <div className={s.tabelaOkvir}>
              <table className={s.tabela}>
                <thead>
                  <tr>
                    <th>Kod</th>
                    <th>Naziv i odredište</th>
                    <th>Način</th>
                    <th className={s.celijaBroj}>Skeniranja ({raspon.naziv.toLowerCase()})</th>
                    <th className={s.celijaBroj}>Ukupno</th>
                    <th>Zadnje skeniranje</th>
                  </tr>
                </thead>
                <tbody>
                  {kodovi.map((k) => {
                    const mjeren = k.nacin === "mjeren";
                    return (
                      <tr key={k.id}>
                        <td>
                          <Link href={`/statistika/${k.id}`} aria-label={`Detalji: ${k.naziv}`}>
                            <QrSlicica
                              podaci={mjeren ? `${bazniUrl()}/q/${k.slug}` : k.cilj}
                              stil={{ ...ZADANI_STIL, ...k.stil }}
                              velicina={56}
                            />
                          </Link>
                        </td>
                        <td>
                          <Link href={`/statistika/${k.id}`} className={s.kodNaziv}>
                            {k.naziv}
                          </Link>
                          <span className={s.kodLink}>{k.cilj}</span>
                        </td>
                        <td>
                          <span className={`${s.cip} ${mjeren ? s.cipMjeren : s.cipDirektan}`}>
                            {mjeren ? "S brojanjem" : "Direktno"}
                          </span>
                          {!k.aktivan && <span className={`${s.cip} ${s.cipPauziran}`}>Pauziran</span>}
                        </td>
                        <td className={s.celijaBroj}>{mjeren ? broj(k.u_rasponu) : "—"}</td>
                        <td className={s.celijaBroj}>{mjeren ? broj(k.ukupno) : "—"}</td>
                        <td>
                          {mjeren ? (
                            <span title={datumVrijeme(k.zadnje)}>{relativno(k.zadnje)}</span>
                          ) : (
                            <span className={s.pomoc}>ne mjeri se</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
