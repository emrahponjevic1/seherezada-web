import Link from "next/link";
import s from "@/app/(statistika)/_qr/Statistika.module.css";
import L from "@/app/(statistika)/_qr/Liste.module.css";
import { imaBazu } from "@/app/(statistika)/_qr/baza";
import { bazniUrl } from "@/app/(statistika)/_qr/bazniUrl";
import { bojeKodova } from "@/app/(statistika)/_qr/boje";
import FilterRaspona from "@/app/(statistika)/_qr/FilterRaspona";
import { broj, datumVrijeme, relativno } from "@/app/(statistika)/_qr/format";
import { IkonaPlus } from "@/app/(statistika)/_qr/IkonePanela";
import ListaKodova, { type KodZaListu } from "@/app/(statistika)/_qr/ListaKodova";
import NemaBaze from "@/app/(statistika)/_qr/NemaBaze";
import Prijava from "@/app/(statistika)/_qr/Prijava";
import { procitajRaspon } from "@/app/(statistika)/_qr/raspon";
import { jePrijavljen } from "@/app/(statistika)/_qr/sesija";
import { pripraviQrTabele } from "@/app/(statistika)/_qr/shema";
import { ZADANI_STIL } from "@/app/(statistika)/_qr/stil";
import { sviKodovi } from "@/app/(statistika)/_qr/upiti";
import Zaglavlje from "@/app/(statistika)/_qr/Zaglavlje";
import { popisStranica } from "@/app/(statistika)/_linkovi/upiti";

// ---------------------------------------------------------------------------
// QR KODE — vse kode kot kartice
//
// Gumbi strani s povezavami tu niso: to so kode za tisk. Gumbi so na
// svoji strani (Linktree), vsak s svojo statistiko.
// ---------------------------------------------------------------------------

export const metadata = { title: "QR kodovi" };

export default async function KodoviPage({
  searchParams,
}: {
  searchParams: Promise<{ raspon?: string }>;
}) {
  const { raspon: r } = await searchParams;
  if (!(await jePrijavljen())) return <Prijava />;
  if (!imaBazu()) return <NemaBaze />;

  await pripraviQrTabele();
  const raspon = procitajRaspon(r);
  const [kodovi, stranice] = await Promise.all([sviKodovi(raspon), popisStranica()]);

  const imeStranice = new Map(stranice.map((st) => [st.id, st.naziv]));
  const boje = bojeKodova(kodovi.map((k) => k.id));

  const zaListu: KodZaListu[] = kodovi.map((k) => {
    const mjeren = k.nacin === "mjeren";
    return {
      id: k.id,
      naziv: k.naziv,
      odrediste: k.vodi_na
        ? `Linktree: ${imeStranice.get(k.vodi_na) ?? "stranica"}`
        : k.cilj.replace(/^https?:\/\//, "").replace(/\/$/, ""),
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

  const aktivnih = kodovi.filter((k) => k.aktivan).length;

  return (
    <main className={s.sekcija}>
      <div className={s.kontejner}>
        <Zaglavlje
          naslov="QR kodovi"
          podnaslov={
            kodovi.length === 0
              ? "Kodovi za stolove, letke i izloge."
              : `${kodovi.length} ${kodovi.length === 1 ? "kod" : "kodova"}, od toga ${aktivnih} aktivnih.`
          }
        >
          <Link href="/statistika/novi" className={s.dugme}>
            <IkonaPlus velicina={18} />
            Novi QR kod
          </Link>
        </Zaglavlje>

        <div className={L.alati}>
          <FilterRaspona putanja="/statistika/kodovi" aktivan={raspon} />
        </div>

        {kodovi.length === 0 ? (
          <div className={s.kartica}>
            <div className={L.praznoVelika}>
              <p>Još nemaš nijedan QR kod.</p>
              <Link href="/statistika/novi" className={s.dugme}>
                <IkonaPlus velicina={18} />
                Napravi prvi kod
              </Link>
            </div>
          </div>
        ) : (
          <ListaKodova kodovi={zaListu} rasponNaziv={raspon.naziv} />
        )}
      </div>
    </main>
  );
}
