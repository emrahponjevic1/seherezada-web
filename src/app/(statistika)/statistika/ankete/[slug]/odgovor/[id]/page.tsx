import Link from "next/link";
import { notFound } from "next/navigation";
import { LOCALES } from "@/data/site";
import s from "@/app/(statistika)/_qr/Statistika.module.css";
import { imaBazu } from "@/app/(statistika)/_qr/baza";
import NemaBaze from "@/app/(statistika)/_qr/NemaBaze";
import Prijava from "@/app/(statistika)/_qr/Prijava";
import { jePrijavljen } from "@/app/(statistika)/_qr/sesija";
import Zaglavlje from "@/app/(statistika)/_qr/Zaglavlje";
import ObrisiOdgovor from "@/app/(statistika)/_ankete/ObrisiOdgovor";
import { odgovorZaPanel } from "@/app/(statistika)/_ankete/prikaz";
import { anketaPoSlugu } from "@/app/(statistika)/_ankete/registar";
import { pripraviAnketeTabele } from "@/app/(statistika)/_ankete/shema";
import { jedanOdgovor } from "@/app/(statistika)/_ankete/upiti";
import r from "@/app/(statistika)/_ankete/Rezultati.module.css";

// ---------------------------------------------------------------------------
// EN IZPOLNJEN OBRAZEC
//
// Vsa vprašanja po vrsti z odgovori te osebe, listanje naprej/nazaj in
// brisanje (npr. poskusni ali podvojeni odgovor).
// ---------------------------------------------------------------------------

export const metadata = { title: "Odgovor ankete" };

const datumFmt = new Intl.DateTimeFormat("bs", { day: "numeric", month: "long", year: "numeric" });

export default async function OdgovorPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id: idTekst } = await params;
  if (!(await jePrijavljen())) return <Prijava />;
  if (!imaBazu()) return <NemaBaze />;

  const anketa = anketaPoSlugu(slug);
  const id = Number(idTekst);
  if (!anketa || !Number.isInteger(id)) notFound();

  await pripraviAnketeTabele();
  const o = await jedanOdgovor(slug, id);
  if (!o) notFound();

  const lista = `/statistika/ankete/${slug}?prikaz=pojedinacno`;
  const jezik = LOCALES.find((l) => l.code === o.jezik)?.name ?? o.jezik;

  return (
    <main className={s.sekcija}>
      <div className={s.kontejner}>
        <Zaglavlje
          nazad={{ href: lista, tekst: "Svi odgovori" }}
          naslov={`Odgovor br. ${o.redniBroj}`}
          podnaslov={anketa.naziv}
          meta={
            <>
              <span className={`${s.cip} ${s.cipNaglasak}`}>{jezik}</span>
              <span className={s.cip}>{datumFmt.format(o.datum)}</span>
              {o.verzija !== anketa.verzija && <span className={`${s.cip} ${s.cipPauziran}`}>Stara verzija ankete</span>}
            </>
          }
        >
          {o.prethodni && (
            <Link href={`/statistika/ankete/${slug}/odgovor/${o.prethodni}`} className={s.dugmeSporedno}>
              ← Prethodni
            </Link>
          )}
          {o.sljedeci && (
            <Link href={`/statistika/ankete/${slug}/odgovor/${o.sljedeci}`} className={s.dugmeSporedno}>
              Sljedeći →
            </Link>
          )}
          <ObrisiOdgovor
            slug={slug}
            id={o.id}
            redniBroj={o.redniBroj}
            nakon={o.sljedeci ? `/statistika/ankete/${slug}/odgovor/${o.sljedeci}` : lista}
          />
        </Zaglavlje>

        {anketa.sekcije.map((sek, si) => (
          <section key={si} className={s.kartica}>
            <h2 className={s.karticaNaslov}>
              {si + 1}. {sek.naslov.bs}
            </h2>
            <dl className={r.jedan}>
              {sek.pitanja.map((p) => {
                const odg = odgovorZaPanel(p, o.odgovori[p.id]);
                return (
                  <div key={p.id} className={r.jedanRed}>
                    <dt>{p.pitanje.bs}</dt>
                    <dd className={odg === null ? r.bezOdgovora : p.vrsta === "tekst" ? r.jedanTekst : r.jedanVrijednost}>
                      {odg ?? "— bez odgovora"}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        ))}
      </div>
    </main>
  );
}
