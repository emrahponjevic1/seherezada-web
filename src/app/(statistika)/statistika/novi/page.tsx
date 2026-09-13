import { bazniUrl } from "@/app/(statistika)/_qr/bazniUrl";
import NemaBaze from "@/app/(statistika)/_qr/NemaBaze";
import Prijava from "@/app/(statistika)/_qr/Prijava";
import QrDizajner from "@/app/(statistika)/_qr/QrDizajner";
import Zaglavlje from "@/app/(statistika)/_qr/Zaglavlje";
import s from "@/app/(statistika)/_qr/Statistika.module.css";
import { imaBazu } from "@/app/(statistika)/_qr/baza";
import { pripraviQrTabele } from "@/app/(statistika)/_qr/shema";
import { jePrijavljen } from "@/app/(statistika)/_qr/sesija";
import { noviSlug } from "@/app/(statistika)/_qr/slug";

export const metadata = { title: "Novi kod" };

export default async function NoviKodPage() {
  if (!(await jePrijavljen())) return <Prijava />;
  if (!imaBazu()) return <NemaBaze />;
  await pripraviQrTabele();

  return (
    <main className={s.sekcija}>
      <div className={s.kontejner}>
        <Zaglavlje
          oznaka="Novi kod"
          vodeniZig="Novi"
          naslov="Kreiraj QR kod"
          podnaslov="Upiši link, izaberi način i uredi izgled. Predogled desno se mijenja uživo."
          nazad={{ href: "/statistika", tekst: "Svi kodovi" }}
        />
        {/* Predlog kratke povezave naredi strežnik, da se strežnik in brskalnik ne razlikujeta. */}
        <QrDizajner bazniUrl={bazniUrl()} predlozeniSlug={noviSlug()} />
      </div>
    </main>
  );
}
