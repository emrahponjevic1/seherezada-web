import Link from "next/link";
import { RASPONI, type Raspon } from "@/app/(statistika)/_qr/raspon";
import s from "@/app/(statistika)/_qr/Statistika.module.css";

/** En filter nad vsem, kar je spodaj — vse številke na strani se ujemajo. */
export default function FilterRaspona({ putanja, aktivan }: { putanja: string; aktivan: Raspon }) {
  return (
    <nav className={s.filteri} aria-label="Period">
      {RASPONI.map((r) => (
        <Link
          key={r.kljuc}
          href={`${putanja}?raspon=${r.kljuc}`}
          className={`${s.filter} ${r.kljuc === aktivan.kljuc ? s.filterAktivan : ""}`}
          aria-current={r.kljuc === aktivan.kljuc ? "page" : undefined}
          scroll={false}
        >
          {r.naziv}
        </Link>
      ))}
    </nav>
  );
}
