import Link from "next/link";
import { notFound } from "next/navigation";
import { LOCALES } from "@/data/site";
import s from "@/app/(statistika)/_qr/Statistika.module.css";
import { imaBazu } from "@/app/(statistika)/_qr/baza";
import { broj } from "@/app/(statistika)/_qr/format";
import NemaBaze from "@/app/(statistika)/_qr/NemaBaze";
import Prijava from "@/app/(statistika)/_qr/Prijava";
import Raspodjela from "@/app/(statistika)/_qr/Raspodjela";
import { jePrijavljen } from "@/app/(statistika)/_qr/sesija";
import Zaglavlje from "@/app/(statistika)/_qr/Zaglavlje";
import { anketaPoSlugu, svaPitanja } from "@/app/(statistika)/_ankete/registar";
import { pripraviAnketeTabele } from "@/app/(statistika)/_ankete/shema";
import ObrisiOdgovor from "@/app/(statistika)/_ankete/ObrisiOdgovor";
import type { Anketa, Pitanje } from "@/app/(statistika)/_ankete/tipovi";
import { odgovoriAnkete, type OdgovorRed } from "@/app/(statistika)/_ankete/upiti";
import r from "@/app/(statistika)/_ankete/Rezultati.module.css";

// ---------------------------------------------------------------------------
// REZULTATI ENE ANKETE
//
// Vprašanja so izpisana v bosanščini (jezik plošče), odgovori pa so sešteti
// čez vse jezike — v bazi so ID-ji, ne prevedeno besedilo. Prosti odgovori
// so pokazani tako, kot jih je kdo napisal, z oznako jezika.
//
// Oznaka jezika in datum sta edino, kar je ob odgovoru. Pri zelo majhni
// ekipi lahko že jezik namigne, kdo je pisal — zato pri prostih odgovorih
// ni ničesar drugega.
// ---------------------------------------------------------------------------

export const metadata = { title: "Rezultati ankete" };

const datumFmt = new Intl.DateTimeFormat("bs", { day: "numeric", month: "numeric", year: "numeric" });
const kratkoJezika = (k: string) => LOCALES.find((l) => l.code === k)?.short ?? k.toUpperCase();
const decimalno = new Intl.NumberFormat("bs", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function Skala({ p, redovi }: { p: Extract<Pitanje, { vrsta: "skala" }>; redovi: OdgovorRed[] }) {
  const max = p.max ?? 5;
  const ocjene = redovi.map((x) => x.odgovori[p.id]).filter((v): v is number => typeof v === "number");
  const prosjek = ocjene.length ? ocjene.reduce((z, v) => z + v, 0) / ocjene.length : null;
  const po = Array.from({ length: max }, (_, i) => ({
    naziv: `${i + 1}${i === 0 ? ` — ${p.najnize.bs}` : i === max - 1 ? ` — ${p.najvise.bs}` : ""}`,
    broj: ocjene.filter((v) => v === i + 1).length,
  })).reverse();

  return (
    <>
      <div className={r.prosjek}>
        {prosjek === null ? "—" : decimalno.format(prosjek)}
        <small>
          prosjek od {max} · {broj(ocjene.length)} ocjena
        </small>
      </div>
      <Trake redovi={po} />
    </>
  );
}

function Izbor({ p, redovi }: { p: Extract<Pitanje, { vrsta: "izbor" }>; redovi: OdgovorRed[] }) {
  const po = p.opcije.map((o) => ({ naziv: o.tekst.bs, broj: redovi.filter((x) => x.odgovori[p.id] === o.id).length }));
  return <Trake redovi={po} />;
}

function Tekst({ p, redovi, slug }: { p: Extract<Pitanje, { vrsta: "tekst" }>; redovi: OdgovorRed[]; slug: string }) {
  const tekstovi = redovi.filter((x) => typeof x.odgovori[p.id] === "string");
  if (!tekstovi.length) return <p className={s.prazno}>Niko još nije napisao odgovor na ovo pitanje.</p>;
  return (
    <>
      <span className={r.vrsta}>
        {broj(tekstovi.length)} od {broj(redovi.length)} napisalo odgovor
      </span>
      <ul className={r.tekstovi}>
        {tekstovi.map((x) => (
          <li key={x.id}>
            <p>{String(x.odgovori[p.id])}</p>
            <span className={r.tekstMeta}>
              <span className={r.jezikCip}>{kratkoJezika(x.jezik)}</span>
              {datumFmt.format(x.datum)}
              <Link href={`/statistika/ankete/${slug}/odgovor/${x.id}`} className={r.otvori}>
                Cijeli odgovor →
              </Link>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Črte brez lastne kartice — vprašanje je že kartica. Vrstni red ostane, kot je podan. */
function Trake({ redovi }: { redovi: { naziv: string; broj: number }[] }) {
  const ukupno = redovi.reduce((z, x) => z + x.broj, 0);
  const max = Math.max(1, ...redovi.map((x) => x.broj));
  return (
    <ul className={s.raspodjela}>
      {redovi.map((x, i) => (
        <li key={i} className={s.raspodjelaRed}>
          <span className={s.raspodjelaNaziv}>{x.naziv}</span>
          <span className={s.raspodjelaBroj}>
            {broj(x.broj)} <small>{ukupno ? Math.round((x.broj / ukupno) * 100) : 0}%</small>
          </span>
          <span className={s.raspodjelaTraka} aria-hidden="true">
            <span className={s.raspodjelaPopuna} style={{ width: `${(x.broj / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Kratek povzetek obrazca za seznam: prvi napisani odgovor, sicer ocene. */
function isjecak(anketa: Anketa, x: OdgovorRed) {
  const pitanja = svaPitanja(anketa);
  const tekst = pitanja.find((p) => p.vrsta === "tekst" && typeof x.odgovori[p.id] === "string");
  if (tekst) return `„${String(x.odgovori[tekst.id]).slice(0, 140)}“`;
  const ocjene = pitanja.filter((p) => p.vrsta === "skala" && typeof x.odgovori[p.id] === "number").map((p) => x.odgovori[p.id]);
  return ocjene.length ? `Ocjene: ${ocjene.join(" · ")} — bez napisanog teksta` : "Bez napisanog teksta";
}

function Pojedinacni({ anketa, redovi }: { anketa: Anketa; redovi: OdgovorRed[] }) {
  const lista = `/statistika/ankete/${anketa.slug}?prikaz=pojedinacno`;
  return (
    <ul className={r.pojedinacni}>
      {redovi.map((x, i) => {
        const redniBroj = redovi.length - i;
        return (
          <li key={x.id}>
            <Link href={`/statistika/ankete/${anketa.slug}/odgovor/${x.id}`} className={r.pojedinacniLink}>
              <span className={r.pojedinacniNaslov}>
                Odgovor br. {redniBroj}
                <span className={r.jezikCip}>{kratkoJezika(x.jezik)}</span>
                <span className={r.tekstMeta}>{datumFmt.format(x.datum)}</span>
              </span>
              <span className={r.pojedinacniIsjecak}>{isjecak(anketa, x)}</span>
            </Link>
            <ObrisiOdgovor slug={anketa.slug} id={x.id} redniBroj={redniBroj} nakon={lista} malo />
          </li>
        );
      })}
    </ul>
  );
}

const VRSTA: Record<Pitanje["vrsta"], string> = { skala: "Ocjena 1–5", izbor: "Jedan izbor", tekst: "Slobodan odgovor" };

export default async function RezultatiAnketePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ prikaz?: string }>;
}) {
  const [{ slug }, { prikaz }] = await Promise.all([params, searchParams]);
  const pojedinacno = prikaz === "pojedinacno";
  if (!(await jePrijavljen())) return <Prijava />;
  if (!imaBazu()) return <NemaBaze />;

  const anketa = anketaPoSlugu(slug);
  if (!anketa) notFound();

  await pripraviAnketeTabele();
  const redovi = await odgovoriAnkete(slug);

  const poJeziku = LOCALES.map((l) => ({ naziv: l.name, broj: redovi.filter((x) => x.jezik === l.code).length }))
    .filter((x) => x.broj > 0)
    .sort((a, b) => b.broj - a.broj);
  const stareVerzije = redovi.filter((x) => x.verzija !== anketa.verzija).length;

  return (
    <main className={s.sekcija}>
      <div className={s.kontejner}>
        <Zaglavlje
          nazad={{ href: "/statistika/ankete", tekst: "Ankete" }}
          naslov={anketa.naziv}
          podnaslov={`${broj(redovi.length)} ${redovi.length === 1 ? "odgovor" : "odgovora"} · ${svaPitanja(anketa).length} pitanja`}
        >
          {redovi.length > 0 && (
            <a href={`/statistika/ankete/${slug}/csv`} className={s.dugmeSporedno}>
              Preuzmi za Excel (CSV)
            </a>
          )}
        </Zaglavlje>

        {stareVerzije > 0 && (
          <p className={s.info}>
            {broj(stareVerzije)} odgovora je iz ranije verzije ankete (pitanja su se u međuvremenu mijenjala).
          </p>
        )}

        {redovi.length === 0 ? (
          <section className={s.kartica}>
            <p className={s.prazno}>Još nema odgovora. Pošalji ekipi link na anketu.</p>
          </section>
        ) : (
          <>
            <nav className={`${s.filteri} ${r.prikazi}`} aria-label="Prikaz">
              <Link
                href={`/statistika/ankete/${slug}`}
                className={`${s.filter} ${!pojedinacno ? s.filterAktivan : ""}`}
                aria-current={!pojedinacno ? "page" : undefined}
              >
                Sažetak
              </Link>
              <Link
                href={`/statistika/ankete/${slug}?prikaz=pojedinacno`}
                className={`${s.filter} ${pojedinacno ? s.filterAktivan : ""}`}
                aria-current={pojedinacno ? "page" : undefined}
              >
                Pojedinačni odgovori ({broj(redovi.length)})
              </Link>
            </nav>
          </>
        )}

        {redovi.length > 0 && pojedinacno && <Pojedinacni anketa={anketa} redovi={redovi} />}

        {redovi.length > 0 && !pojedinacno && (
          <>
            <div className={s.mreza2}>
              <Raspodjela naslov="Jezik ankete" redovi={poJeziku} najvise={6} />
            </div>

            {anketa.sekcije.map((sek, si) => (
              <section key={si} className={r.sekcija}>
                <h2 className={s.podnaslovSekcije}>
                  {si + 1}. {sek.naslov.bs}
                </h2>
                {sek.pitanja.map((p) => (
                  <article key={p.id} className={s.kartica}>
                    <span className={r.vrsta}>{VRSTA[p.vrsta]}</span>
                    <h3 className={r.pitanjeNaslov}>{p.pitanje.bs}</h3>
                    {p.vrsta === "skala" && <Skala p={p} redovi={redovi} />}
                    {p.vrsta === "izbor" && <Izbor p={p} redovi={redovi} />}
                    {p.vrsta === "tekst" && <Tekst p={p} redovi={redovi} slug={slug} />}
                  </article>
                ))}
              </section>
            ))}
          </>
        )}
      </div>
    </main>
  );
}
