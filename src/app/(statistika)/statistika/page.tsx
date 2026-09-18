import Link from "next/link";
import s from "@/app/(statistika)/_qr/Statistika.module.css";
import p from "@/app/(statistika)/_qr/Stranice.module.css";
import l from "@/app/(statistika)/_linkovi/Panel.module.css";
import { imaBazu } from "@/app/(statistika)/_qr/baza";
import { BOJA_OSTALI, bojeKodova } from "@/app/(statistika)/_qr/boje";
import NemaBaze from "@/app/(statistika)/_qr/NemaBaze";
import Prijava from "@/app/(statistika)/_qr/Prijava";
import { jePrijavljen } from "@/app/(statistika)/_qr/sesija";
import Zaglavlje from "@/app/(statistika)/_qr/Zaglavlje";
import { bazniUrl } from "@/app/(statistika)/_qr/bazniUrl";
import FilterRaspona from "@/app/(statistika)/_qr/FilterRaspona";
import { broj, datumVrijeme, oznakaDana, relativno } from "@/app/(statistika)/_qr/format";
import ListaKodova, { type KodZaListu } from "@/app/(statistika)/_qr/ListaKodova";
import { procitajRaspon } from "@/app/(statistika)/_qr/raspon";
import { pripraviQrTabele } from "@/app/(statistika)/_qr/shema";
import SlojeviGrafikon, { type Serija } from "@/app/(statistika)/_qr/SlojeviGrafikon";
import { ZADANI_STIL } from "@/app/(statistika)/_qr/stil";
import { brojke, poDanimaPoKodu, sviKodovi } from "@/app/(statistika)/_qr/upiti";
import { sveStranice } from "@/app/(statistika)/_linkovi/upiti";

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
  const [kodovi, b, dani, stranice] = await Promise.all([
    sviKodovi(raspon),
    brojke("kodovi", raspon),
    poDanimaPoKodu("kodovi", raspon),
    sveStranice(raspon),
  ]);

  const aktivnih = kodovi.filter((k) => k.aktivan).length;
  const najbolji = kodovi.reduce<(typeof kodovi)[number] | null>(
    (z, k) => (k.u_rasponu > (z?.u_rasponu ?? 0) ? k : z),
    null
  );
  const period = raspon.dani === null ? "od početka" : raspon.dani === 1 ? "danas" : `zadnjih ${raspon.naziv}`;

  // Barva sledi kodi (po nastanku), zato je ista v grafu in v seznamu.
  const boje = bojeKodova(kodovi.map((k) => k.id));
  const serije: Serija[] = [];
  const ostali = new Array<number>(dani.kljucevi.length).fill(0);
  for (const k of [...kodovi].sort((a, c) => a.id - c.id)) {
    const vrijednosti = dani.poKodu.get(k.id);
    if (!vrijednosti) continue;
    const boja = boje.get(k.id)!;
    if (boja.ostali) vrijednosti.forEach((v, i) => (ostali[i] += v));
    else serije.push({ id: String(k.id), naziv: k.naziv, boja: boja.boja, vrijednosti });
  }
  if (ostali.some((v) => v > 0)) {
    serije.push({ id: "ostali", naziv: "Ostali kodovi", boja: BOJA_OSTALI, vrijednosti: ostali });
  }

  const zaListu: KodZaListu[] = kodovi.map((k) => {
    const mjeren = k.nacin === "mjeren";
    return {
      id: k.id,
      naziv: k.naziv,
      cilj: k.cilj,
      boja: boje.get(k.id)!.boja,
      mjeren,
      aktivan: k.aktivan,
      qrPodaci: mjeren ? `${bazniUrl()}/q/${k.slug}` : k.cilj,
      stil: { ...ZADANI_STIL, ...k.stil },
      uRasponu: k.u_rasponu,
      uRasponuTekst: broj(k.u_rasponu),
      ukupno: k.ukupno,
      ukupnoTekst: broj(k.ukupno),
      zadnje: relativno(k.zadnje),
      zadnjeTacno: datumVrijeme(k.zadnje),
      kreiran: new Date(k.kreiran).getTime(),
    };
  });

  return (
    <main className={s.sekcija}>
      <div className={s.kontejner}>
        <Zaglavlje
          oznaka="Statistika"
          vodeniZig="QR"
          naslov="QR kodovi"
          podnaslov="Koliko puta je koji kod skeniran, odakle i s kojeg uređaja."
        >
          <Link href="/statistika/novi" className={s.dugme}>
            + Kreiraj QR kod
          </Link>
          <Link href="/statistika/linkovi/nova" className={s.dugme}>
            + Kreiraj Linktree
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
            <span className={s.kpiOznaka}>Jedinstveni</span>
            <span className={s.kpiVrijednost}>{broj(b.jedinstveni)}</span>
            <span className={s.kpiDodatak}>isti telefon jednom dnevno</span>
          </div>
          <div className={`${s.kpi} ${p.kpiSporedni}`}>
            <span className={s.kpiOznaka}>Aktivni kodovi</span>
            <span className={s.kpiVrijednost}>{aktivnih}</span>
            <span className={s.kpiDodatak}>od ukupno {kodovi.length}</span>
          </div>
          <div className={`${s.kpi} ${p.kpiSporedni}`}>
            <span className={s.kpiOznaka}>Najčešće skeniran</span>
            <span className={`${s.kpiVrijednost} ${s.kpiTekst}`} title={najbolji?.naziv}>
              {najbolji?.naziv ?? "—"}
            </span>
            <span className={s.kpiDodatak}>
              {najbolji ? `${broj(najbolji.u_rasponu)} skeniranja` : "još nema skeniranja"}
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
          <SlojeviGrafikon
            opis={`Skeniranja po kodovima ${period}`}
            oznake={dani.kljucevi.map((kljuc) => oznakaDana(kljuc, dani.jedinica))}
            serije={serije}
          />
        </section>

        <section className={s.kartica}>
          <div className={s.karticaGlava}>
            <h2 className={s.karticaNaslov}>Svi kodovi ({kodovi.length})</h2>
          </div>
          {kodovi.length === 0 ? (
            <div className={s.prazno}>
              <p>Još nemaš nijedan QR kod.</p>
              <Link href="/statistika/novi" className={s.dugme}>
                Kreiraj prvi kod
              </Link>
            </div>
          ) : (
            <ListaKodova kodovi={zaListu} rasponNaziv={raspon.naziv} />
          )}
        </section>

        {/* ---- Stranice s linkovima ----
            Gumbi teh strani so tudi vrstice v qr_kodovi, a v seznamu zgoraj jih
            ni: tam so kode za tisk, tu strani, ki jih koda odpre. */}
        <section className={s.kartica}>
          <div className={s.karticaGlava}>
            <h2 className={s.karticaNaslov}>Linktree stranice ({stranice.length})</h2>
            <span className={s.pomoc}>Jedan kod na stolu, svi linkovi na jednom mjestu</span>
          </div>

          {stranice.length === 0 ? (
            <div className={s.prazno}>
              <p>Još nemaš nijednu stranicu s linkovima.</p>
              <Link href="/statistika/linkovi/nova" className={s.dugme}>
                Kreiraj Linktree
              </Link>
            </div>
          ) : (
            <ul className={l.stranice}>
              {stranice.map((st) => (
                <li key={st.id}>
                  <Link href={`/statistika/linkovi/${st.id}`} className={l.stranicaRed}>
                    <span className={l.stranicaIme}>
                      <span className={l.stranicaNaziv}>
                        {st.naziv}
                        {st.glavna && " · glavna"}
                        {!st.aktivna && " · ugašena"}
                      </span>
                      <span className={l.stranicaAdresa}>
                        /links/{st.slug} · {st.dugmadi} dugmadi
                      </span>
                    </span>
                    <span className={l.stranicaBroj}>
                      <span className={l.stranicaBrojVrijednost}>{broj(st.otvaranja)}</span>
                      <span className={l.stranicaBrojOznaka}>otvaranja</span>
                    </span>
                    <span className={l.stranicaBroj}>
                      <span className={l.stranicaBrojVrijednost}>{broj(st.klikovi)}</span>
                      <span className={l.stranicaBrojOznaka}>klikova</span>
                    </span>
                    <span className={p.kodStrelica} aria-hidden="true">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
