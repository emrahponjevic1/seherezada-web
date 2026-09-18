import Link from "next/link";
import { IkonaNazad } from "./IkonePanela";
import s from "@/app/(statistika)/_qr/Statistika.module.css";

/**
 * Glava strani nadzorne plošče: povezava nazaj, naslov, podnapis, čipi in
 * gumbi desno.
 *
 * Prva različica je imela uredniški vzorec spletišča (vodni žig in oznako
 * poglavja). V aplikaciji z bočnim menijem je bil to hrup, zato ga ni več;
 * lastnosti `oznaka` in `vodeniZig` ostajata le zato, da stari klici ne
 * pokajo — izrisujeta se ne.
 */
export default function Zaglavlje({
  naslov,
  podnaslov,
  meta,
  nazad,
  children,
}: {
  oznaka?: string;
  vodeniZig?: string;
  naslov: string;
  podnaslov?: React.ReactNode;
  /** Čipi pod naslovom (stanje, vrsta ...). */
  meta?: React.ReactNode;
  nazad?: { href: string; tekst: string };
  children?: React.ReactNode;
}) {
  return (
    <header className={s.glava}>
      <div className={s.glavaTekst}>
        {nazad && (
          <Link href={nazad.href} className={s.nazad}>
            <IkonaNazad velicina={15} />
            {nazad.tekst}
          </Link>
        )}
        <h1 className={s.naslov}>{naslov}</h1>
        {podnaslov && <p className={s.podnaslov}>{podnaslov}</p>}
        {meta && <div className={s.glavaMeta}>{meta}</div>}
      </div>
      {children && <div className={s.glavaRadnje}>{children}</div>}
    </header>
  );
}
