import { PREFIKS_VANJSKI, ocistiIkonu, type IkonaSvg } from "./svgCisti";
import s from "./Stranica.module.css";

// ---------------------------------------------------------------------------
// IKONE ZA GUMBE
//
// Enobarvne črtne ikone, vse narisane v istem slogu: mreža 24 × 24, debelina
// črte 1,75, zaobljeni konci. Emoji so ostali kot možnost, a na beli kartici
// poleg črtnih ikon delujejo neresno, zato je privzeta izbira ta seznam.
//
// ZAPIS V BAZI
// Polje `ikona` pove, za katero vrsto gre:
//   "i:meni"          ikona s tega seznama
//   "x:mdi:instagram" ikona iz iskalnika Iconify; njen crtež je v ikona_svg
//   karkoli drugega   emoji
//
// ZNAKI TUJIH ZNAMK
// Google, TripAdvisor, Facebook, Instagram in TikTok so tu poenostavljeni v
// isti črtni slog. Namenjeni so izključno povezavi na NAŠ profil na tistem
// omrežju — za to jih sme uporabiti vsak.
// ---------------------------------------------------------------------------

/** Predpona, po kateri ločimo ikono s seznama od emojija. */
export const PREFIKS = "i:";

const RISBE: Record<string, React.ReactNode> = {
  meni: (
    <>
      <path d="M4 5.5h5a3 3 0 0 1 3 3v10a2.5 2.5 0 0 0-2.5-2.5H4z" />
      <path d="M20 5.5h-5a3 3 0 0 0-3 3v10a2.5 2.5 0 0 1 2.5-2.5H20z" />
    </>
  ),
  ocjena: <path d="M12 3.6l2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.9l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z" />,
  google: (
    <>
      <path d="M20.3 12.5A8.5 8.5 0 1 1 18 6.2" />
      <path d="M20.4 12.5h-7.7" />
    </>
  ),
  tripadvisor: (
    <>
      <circle cx="7.6" cy="13.2" r="4.3" />
      <circle cx="16.4" cy="13.2" r="4.3" />
      <circle cx="7.6" cy="13.2" r="1.3" />
      <circle cx="16.4" cy="13.2" r="1.3" />
      <path d="M8.6 8.4a9.3 9.3 0 0 1 6.8 0" />
      <path d="M10.4 7.3L12 5.3l1.6 2" />
    </>
  ),
  facebook: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <path d="M15 8.2h-1.5c-1 0-1.7.7-1.7 1.8v10.5" />
      <path d="M9.6 12.4h5.1" />
    </>
  ),
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.9" />
      <circle cx="16.9" cy="7.1" r="0.9" />
    </>
  ),
  tiktok: (
    <>
      <path d="M14.2 4.3v10.4a3.9 3.9 0 1 1-3.1-3.8" />
      <path d="M14.2 4.3c.4 2.4 2.1 4 4.6 4.2" />
    </>
  ),
  boni: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <circle cx="8.8" cy="11" r="2.1" />
      <path d="M5.6 16.5c.7-1.5 1.9-2.3 3.2-2.3s2.5.8 3.2 2.3" />
      <path d="M15 10.2h3.4M15 13.2h3.4" />
    </>
  ),
  lokacija: (
    <>
      <path d="M12 20.8s6.8-5.5 6.8-10.8a6.8 6.8 0 1 0-13.6 0c0 5.3 6.8 10.8 6.8 10.8z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  telefon: (
    <path d="M6.6 3.9h2.9l1.5 3.7-2 1.4a12 12 0 0 0 5.9 5.9l1.4-2 3.7 1.5v2.9a2 2 0 0 1-2.2 2C10.7 18.6 5.4 13.3 4.6 6.1a2 2 0 0 1 2-2.2z" />
  ),
  whatsapp: (
    <>
      <path d="M3.9 20.1l1.3-3.9A8.1 8.1 0 1 1 8 18.9z" />
      <path d="M9.2 9.3c.2 1.9 1.8 3.5 3.7 3.8l.7-1 1.7.7v1.1c0 .6-.5 1-1.1 1a6.6 6.6 0 0 1-5.7-5.7c-.1-.6.4-1.1 1-1.1h1.1z" />
    </>
  ),
  dostava: (
    <>
      <circle cx="6.2" cy="17.3" r="2.6" />
      <circle cx="17.6" cy="17.3" r="2.6" />
      <path d="M8.8 17.3h6.2" />
      <path d="M4.4 14.8v-3.6a2 2 0 0 1 2-2h3.1l3.4 7.6" />
      <path d="M13 5.6h2.9l2.2 9.1" />
    </>
  ),
  web: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.6 12h16.8" />
      <path d="M12 3.6c2.2 2.4 3.4 5.3 3.4 8.4S14.2 18 12 20.4C9.8 18 8.6 15.1 8.6 12S9.8 6 12 3.6z" />
    </>
  ),
  popust: (
    <>
      <path d="M11.4 3.6H20v8.6l-8.9 8.9a1.7 1.7 0 0 1-2.4 0l-6.2-6.2a1.7 1.7 0 0 1 0-2.4z" />
      <circle cx="16.2" cy="7.7" r="1.2" />
      <path d="M8.4 12.1l3.6 3.6" />
    </>
  ),
  rezervacija: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8.4 3.5v3M15.6 3.5v3" />
      <path d="M7.8 14h3.1" />
    </>
  ),
  halal: (
    <>
      <path d="M16.6 4.3a8.5 8.5 0 1 0 3.2 13.2A9.2 9.2 0 0 1 16.6 4.3z" />
      <path d="M18.6 8.3l.8 1.8 2 .3-1.4 1.4.3 2-1.7-.9-1.8.9.4-2-1.5-1.4 2-.3z" />
    </>
  ),
  galerija: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="3" />
      <circle cx="8.8" cy="10" r="1.6" />
      <path d="M4.4 17.2l4.7-4.5a2 2 0 0 1 2.8 0L16 17.2" />
    </>
  ),
  srce: <path d="M12 20s-7.2-4.5-8.6-9A4.9 4.9 0 0 1 12 6.5 4.9 4.9 0 0 1 20.6 11c-1.4 4.5-8.6 9-8.6 9z" />,
};

/** Seznam za izbirnik v nadzorni plošči; vrstni red je vrstni red v mrežici. */
export const IKONE: { kljuc: string; naziv: string }[] = [
  { kljuc: "meni", naziv: "Meni" },
  { kljuc: "ocjena", naziv: "Ocjena" },
  { kljuc: "google", naziv: "Google" },
  { kljuc: "tripadvisor", naziv: "Tripadvisor" },
  { kljuc: "facebook", naziv: "Facebook" },
  { kljuc: "instagram", naziv: "Instagram" },
  { kljuc: "tiktok", naziv: "TikTok" },
  { kljuc: "boni", naziv: "Boni" },
  { kljuc: "lokacija", naziv: "Lokacija" },
  { kljuc: "telefon", naziv: "Telefon" },
  { kljuc: "whatsapp", naziv: "WhatsApp" },
  { kljuc: "dostava", naziv: "Dostava" },
  { kljuc: "rezervacija", naziv: "Rezervacija" },
  { kljuc: "popust", naziv: "Popust" },
  { kljuc: "galerija", naziv: "Galerija" },
  { kljuc: "halal", naziv: "Halal" },
  { kljuc: "web", naziv: "Web" },
  { kljuc: "srce", naziv: "Srce" },
];

/** Ali je vrednost ikona s seznama (in ne emoji). */
export function jeIkona(ime: string) {
  return ime.startsWith(PREFIKS) && RISBE[ime.slice(PREFIKS.length)] !== undefined;
}

/** Ali vrednost NI emoji — torej ikona s seznama ali iz iskalnika. */
export function niEmoji(ime: string) {
  return ime.startsWith(PREFIKS) || ime.startsWith(PREFIKS_VANJSKI);
}

/** Vrednost, kot se zapiše v bazo. */
export function kljucIkone(kljuc: string) {
  return `${PREFIKS}${kljuc}`;
}

/**
 * Izriše ikono gumba: risbo s seznama, ikono iz iskalnika ali emoji.
 * Barvo podeduje od starša (currentColor), zato se ravna po barvi gumba.
 */
export function Ikona({
  ime,
  svg,
  velicina = 24,
}: {
  ime: string;
  /** Crtež ikone iz iskalnika (iz baze ali pravkar izbran). */
  svg?: IkonaSvg | null;
  velicina?: number;
}) {
  if (!ime) return null;

  if (ime.startsWith(PREFIKS_VANJSKI)) {
    // Še en krog čiščenja tik pred izrisom: tudi ročno spremenjena vrstica v
    // bazi ne more podtakniti ničesar. Stane nekaj mikrosekund.
    const cist = ocistiIkonu(svg);
    if (!cist) return null;
    return (
      <svg
        viewBox={cist.vb}
        width={velicina}
        height={velicina}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: cist.body }}
      />
    );
  }

  if (!ime.startsWith(PREFIKS)) {
    return (
      <span className={s.emoji} style={{ fontSize: velicina }} aria-hidden="true">
        {ime}
      </span>
    );
  }

  const risba = RISBE[ime.slice(PREFIKS.length)];
  if (!risba) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      width={velicina}
      height={velicina}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {risba}
    </svg>
  );
}
