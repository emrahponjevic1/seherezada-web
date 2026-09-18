import Image from "next/image";
import Link from "next/link";
import s from "@/app/(statistika)/_qr/Statistika.module.css";
import L from "@/app/(statistika)/_qr/Liste.module.css";
import { imaBazu } from "@/app/(statistika)/_qr/baza";
import { bazniUrl } from "@/app/(statistika)/_qr/bazniUrl";
import FilterRaspona from "@/app/(statistika)/_qr/FilterRaspona";
import { broj } from "@/app/(statistika)/_qr/format";
import { IkonaPlus } from "@/app/(statistika)/_qr/IkonePanela";
import NemaBaze from "@/app/(statistika)/_qr/NemaBaze";
import Prijava from "@/app/(statistika)/_qr/Prijava";
import { procitajRaspon } from "@/app/(statistika)/_qr/raspon";
import { jePrijavljen } from "@/app/(statistika)/_qr/sesija";
import { pripraviQrTabele } from "@/app/(statistika)/_qr/shema";
import Zaglavlje from "@/app/(statistika)/_qr/Zaglavlje";
import { ZADANA_BOJA, prelivStranice } from "@/app/(statistika)/_linkovi/boje";
import { sveStranice } from "@/app/(statistika)/_linkovi/upiti";

// ---------------------------------------------------------------------------
// LINKTREE — vse strani s povezavami
//
// Vsaka stran je kartica v svojih barvah (isti preliv kot pri gostu), da se
// strani za različne lokale ločijo na prvi pogled. Spodaj dve številki:
// kolikokrat je bila stran odprta in kolikokrat je kdo pritisnil gumb.
// ---------------------------------------------------------------------------

export const metadata = { title: "Linktree" };

export default async function LinktreeListaPage({
  searchParams,
}: {
  searchParams: Promise<{ raspon?: string }>;
}) {
  const { raspon: r } = await searchParams;
  if (!(await jePrijavljen())) return <Prijava />;
  if (!imaBazu()) return <NemaBaze />;

  await pripraviQrTabele();
  const raspon = procitajRaspon(r);
  const stranice = await sveStranice(raspon);
  const domena = bazniUrl().replace(/^https?:\/\//, "");

  return (
    <main className={s.sekcija}>
      <div className={s.kontejner}>
        <Zaglavlje
          naslov="Linktree"
          podnaslov="Stranice s linkovima — jedan QR kod na stolu, sve na jednom mjestu."
        >
          <Link href="/statistika/linkovi/nova" className={s.dugme}>
            <IkonaPlus velicina={18} />
            Novi linktree
          </Link>
        </Zaglavlje>

        {stranice.length > 0 && (
          <div className={L.alati}>
            <FilterRaspona putanja="/statistika/linkovi" aktivan={raspon} />
          </div>
        )}

        <div className={L.mreza}>
          {stranice.map((st) => {
            const preliv = prelivStranice(st.boja || ZADANA_BOJA);
            return (
              <Link
                key={st.id}
                href={`/statistika/linkovi/${st.id}`}
                className={L.lt}
                style={{ "--gore": preliv.gore, "--dolje": preliv.dolje } as React.CSSProperties}
              >
                <div className={L.ltVrh}>
                  <span className={L.ltZnacke}>
                    {st.glavna && <span className={L.ltZnacka}>Glavna</span>}
                    {!st.aktivna && <span className={`${L.ltZnacka} ${L.ltZnackaUgasena}`}>Ugašena</span>}
                  </span>
                  <Image
                    src="/images/seherezada-logo-bijeli.png"
                    alt=""
                    width={709}
                    height={373}
                    className={L.ltLogo}
                  />
                </div>
                <div className={L.ltTijelo}>
                  <span className={L.ltIme}>{st.naziv}</span>
                  <span className={L.ltAdresa}>
                    {domena}/links/{st.slug} · {st.dugmadi} {st.dugmadi === 1 ? "dugme" : "dugmadi"}
                  </span>
                </div>
                <div className={L.kodDno} style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                  <span className={L.kodStat}>
                    <span className={L.kodStatBroj}>{broj(st.otvaranja)}</span>
                    <span className={L.kodStatOznaka}>Otvaranja</span>
                  </span>
                  <span className={L.kodStat}>
                    <span className={L.kodStatBroj}>{broj(st.klikovi)}</span>
                    <span className={L.kodStatOznaka}>Klikova</span>
                  </span>
                </div>
              </Link>
            );
          })}

          <Link href="/statistika/linkovi/nova" className={L.nova}>
            <span>
              <IkonaPlus />
            </span>
            {stranice.length === 0 ? "Napravi prvi linktree" : "Novi linktree"}
          </Link>
        </div>
      </div>
    </main>
  );
}
