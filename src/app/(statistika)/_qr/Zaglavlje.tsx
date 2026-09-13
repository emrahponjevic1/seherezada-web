import Link from "next/link";
import s from "@/app/(statistika)/_qr/Statistika.module.css";

/** Glava strani po uredniškem vzorcu spletišča (vodni žig + oznaka poglavja). */
export default function Zaglavlje({
  oznaka,
  vodeniZig,
  naslov,
  podnaslov,
  nazad,
  children,
}: {
  oznaka: string;
  vodeniZig: string;
  naslov: string;
  podnaslov?: React.ReactNode;
  nazad?: { href: string; tekst: string };
  children?: React.ReactNode;
}) {
  return (
    <header className={s.glava}>
      <div className={s.glavaTekst}>
        {nazad && (
          <Link href={nazad.href} className={s.nazad}>
            ← {nazad.tekst}
          </Link>
        )}
        <div className={s.chapterTagContainer}>
          <span className={s.tagGhostWatermark} aria-hidden="true">
            {vodeniZig}
          </span>
          <span className={s.chapterIndexTag}>
            <span className={s.chapterDash} />
            {oznaka}
            <span className={s.chapterDash} />
          </span>
        </div>
        <h1 className={s.naslov}>{naslov}</h1>
        {podnaslov && <p className={s.podnaslov}>{podnaslov}</p>}
      </div>
      {children && <div className={s.glavaRadnje}>{children}</div>}
    </header>
  );
}
