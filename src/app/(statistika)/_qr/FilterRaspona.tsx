"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RASPONI, type Raspon } from "./raspon";
import s from "./Statistika.module.css";
import p from "./Stranice.module.css";

/**
 * En filter nad vsem, kar je spodaj — vse številke na strani se ujemajo.
 * Računalnik: gumbi. Telefon: spustni seznam, ki zamenja naslov strani.
 */
export default function FilterRaspona({ putanja, aktivan }: { putanja: string; aktivan: Raspon }) {
  const router = useRouter();

  return (
    <>
      <nav className={`${s.filteri} ${p.filteriVeci}`} aria-label="Period">
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

      <label className={p.filterPadajuci}>
        <span className={p.filterPadajuciOznaka}>Period</span>
        <select
          className={s.unos}
          value={aktivan.kljuc}
          onChange={(e) => router.push(`${putanja}?raspon=${e.target.value}`, { scroll: false })}
        >
          {RASPONI.map((r) => (
            <option key={r.kljuc} value={r.kljuc}>
              {r.naziv}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
