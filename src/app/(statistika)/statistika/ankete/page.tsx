import Link from "next/link";
import s from "@/app/(statistika)/_qr/Statistika.module.css";
import { imaBazu } from "@/app/(statistika)/_qr/baza";
import { bazniUrl } from "@/app/(statistika)/_qr/bazniUrl";
import { broj } from "@/app/(statistika)/_qr/format";
import KopirajDugme from "@/app/(statistika)/_qr/KopirajDugme";
import NemaBaze from "@/app/(statistika)/_qr/NemaBaze";
import Prijava from "@/app/(statistika)/_qr/Prijava";
import { jePrijavljen } from "@/app/(statistika)/_qr/sesija";
import Zaglavlje from "@/app/(statistika)/_qr/Zaglavlje";
import { AKTUELNA, SVE_ANKETE } from "@/app/(statistika)/_ankete/registar";
import { pripraviAnketeTabele } from "@/app/(statistika)/_ankete/shema";
import { pregledAnketa } from "@/app/(statistika)/_ankete/upiti";
import r from "@/app/(statistika)/_ankete/Rezultati.module.css";

// ---------------------------------------------------------------------------
// ANKETE — seznam vseh anket in koliko odgovorov ima vsaka
//
// Ankete se ne ustvarjajo tu: zapisane so v kodi (_ankete/definicije/), ker
// morajo biti prevedene v šest jezikov. Glej _ankete/README.md.
// ---------------------------------------------------------------------------

export const metadata = { title: "Ankete" };

const datumFmt = new Intl.DateTimeFormat("bs", { day: "numeric", month: "numeric", year: "numeric" });

export default async function AnketeListaPage() {
  if (!(await jePrijavljen())) return <Prijava />;
  if (!imaBazu()) return <NemaBaze />;

  await pripraviAnketeTabele();
  const brojevi = await pregledAnketa();
  const domena = bazniUrl();

  return (
    <main className={s.sekcija}>
      <div className={s.kontejner}>
        <Zaglavlje naslov="Ankete" podnaslov="Anonimne ankete za ekipu — rezultati se slažu sami, na svih šest jezika zajedno." />

        <div className={r.lista}>
          {SVE_ANKETE.map((a) => {
            const b = brojevi.get(a.slug);
            const link = a.slug === AKTUELNA ? `${domena}/anketa` : `${domena}/anketa/${a.slug}`;
            return (
              <div key={a.slug} className={r.anketa}>
                <div className={s.glavaMeta} style={{ marginTop: 0 }}>
                  {a.zatvorena ? (
                    <span className={`${s.cip} ${s.cipPauziran}`}>Zatvorena</span>
                  ) : (
                    <span className={`${s.cip} ${s.cipMjeren}`}>Prima odgovore</span>
                  )}
                  {a.slug === AKTUELNA && <span className={`${s.cip} ${s.cipNaglasak}`}>Na /anketa</span>}
                </div>
                <Link href={`/statistika/ankete/${a.slug}`} className={r.ime}>
                  {a.naziv}
                </Link>
                <span className={r.adresa}>{link.replace(/^https?:\/\//, "")}</span>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <KopirajDugme tekst={link} />
                  <a href={link} target="_blank" rel="noreferrer" className={s.dugmeSporedno}>
                    Otvori anketu
                  </a>
                </div>
                <div className={r.brojevi}>
                  <span>
                    <b>{broj(b?.ukupno ?? 0)}</b>
                    Odgovora
                  </span>
                  <span>
                    <b>{b?.zadnji ? datumFmt.format(b.zadnji) : "—"}</b>
                    Zadnji
                  </span>
                </div>
                <Link href={`/statistika/ankete/${a.slug}`} className={s.dugme} style={{ justifyContent: "center" }}>
                  Rezultati
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
