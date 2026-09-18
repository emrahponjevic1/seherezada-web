import { bazniUrl } from "@/app/(statistika)/_qr/bazniUrl";
import NemaBaze from "@/app/(statistika)/_qr/NemaBaze";
import Prijava from "@/app/(statistika)/_qr/Prijava";
import Zaglavlje from "@/app/(statistika)/_qr/Zaglavlje";
import s from "@/app/(statistika)/_qr/Statistika.module.css";
import { imaBazu } from "@/app/(statistika)/_qr/baza";
import { jePrijavljen } from "@/app/(statistika)/_qr/sesija";
import { pripraviQrTabele } from "@/app/(statistika)/_qr/shema";
import { noviSlug } from "@/app/(statistika)/_qr/slug";
import Urednik from "@/app/(statistika)/_linkovi/Urednik";

export const metadata = { title: "Novi linktree" };

export default async function NovaStranicaPage() {
  if (!(await jePrijavljen())) return <Prijava />;
  if (!imaBazu()) return <NemaBaze />;
  await pripraviQrTabele();

  return (
    <main className={s.sekcija}>
      <div className={s.kontejner}>
        <Zaglavlje
          oznaka="Novi linktree"
          vodeniZig="Link"
          naslov="Kreiraj Linktree"
          podnaslov="Jedna stranica sa svim linkovima, za jedan QR kod na stolu. Dodaj dugmad odmah — sve se sprema zajedno."
          nazad={{ href: "/statistika/linkovi", tekst: "Linktree" }}
        />
        {/* Predlog naslova naredi strežnik, da se strežnik in brskalnik ne razlikujeta. */}
        <Urednik bazniUrl={bazniUrl()} predlozeniSlug={noviSlug()} />
      </div>
    </main>
  );
}
