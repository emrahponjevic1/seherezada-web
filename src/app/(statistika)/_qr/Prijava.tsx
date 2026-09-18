import Image from "next/image";
import { prijava } from "./prijavaAkcije";
import { gesloNastavljeno } from "./sesija";
import s from "./Statistika.module.css";

const PORUKE: Record<string, string> = {
  geslo: "Pogrešna lozinka.",
  prepogosto: "Previše pokušaja. Sačekaj 15 minuta pa probaj ponovo.",
  "nema-gesla": "Lozinka još nije postavljena na serveru.",
};

export default function Prijava({ greska }: { greska?: string }) {
  const nastavljeno = gesloNastavljeno();

  return (
    <main className={s.prijavaOkvir}>
      <form action={prijava} className={s.prijavaKartica}>
        <Image src="/images/seherezada-znak.png" alt="" width={56} height={56} className={s.prijavaZnak} />
        <h1 className={s.naslov}>Šeherezada panel</h1>

        {nastavljeno ? (
          <>
            <p className={s.podnaslov}>QR kodovi, linktree i statistika. Unesi lozinku za pristup.</p>
            <label className={s.polje}>
              <span className={s.oznakaPolja}>Lozinka</span>
              <input
                className={s.unos}
                type="password"
                name="geslo"
                autoComplete="current-password"
                required
                autoFocus
              />
            </label>
            {greska && PORUKE[greska] && (
              <p className={s.greska} role="alert">
                {PORUKE[greska]}
              </p>
            )}
            <button type="submit" className={s.dugme}>
              Prijavi se
            </button>
          </>
        ) : (
          <p className={s.upozorenje}>
            Lozinka nije postavljena. U Vercelu dodaj varijablu okruženja <code>ADMIN_GESLO</code>{" "}
            (Settings → Environment Variables) i ponovo objavi stranicu.
          </p>
        )}
      </form>
    </main>
  );
}
