import { broj } from "@/app/(statistika)/_qr/format";
import s from "@/app/(statistika)/_qr/Statistika.module.css";

/**
 * Razdelitev po eni lastnosti (država, naprava ...). Vsaka vrstica ima
 * izpisano število in delež, zato črta samo pomaga oku in ni edini vir.
 */
export default function Raspodjela({
  naslov,
  redovi,
  najvise = 8,
}: {
  naslov: string;
  redovi: { naziv: string | null; broj: number }[];
  najvise?: number;
}) {
  const ukupno = redovi.reduce((z, r) => z + r.broj, 0);
  const prikaz = redovi.slice(0, najvise);
  const ostalo = redovi.slice(najvise).reduce((z, r) => z + r.broj, 0);
  if (ostalo > 0) prikaz.push({ naziv: "Ostalo", broj: ostalo });
  const max = Math.max(1, ...prikaz.map((r) => r.broj));

  return (
    <section className={s.kartica}>
      <h3 className={s.karticaNaslov}>{naslov}</h3>
      {ukupno === 0 ? (
        <p className={s.prazno}>Nema podataka za ovaj period.</p>
      ) : (
        <ul className={s.raspodjela}>
          {prikaz.map((r, i) => (
            <li key={i} className={s.raspodjelaRed}>
              <span className={s.raspodjelaNaziv}>{r.naziv ?? "Nepoznato"}</span>
              <span className={s.raspodjelaBroj}>
                {broj(r.broj)} <small>{Math.round((r.broj / ukupno) * 100)}%</small>
              </span>
              <span className={s.raspodjelaTraka} aria-hidden="true">
                <span className={s.raspodjelaPopuna} style={{ width: `${(r.broj / max) * 100}%` }} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
