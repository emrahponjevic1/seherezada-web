// ---------------------------------------------------------------------------
// ČIŠČENJE IKONE IZ ICONIFY
//
// Ikone iz iskalnika (api.iconify.design) pridejo kot kos SVG-ja, ki ga je
// napisal nekdo drug. Na stran za goste gre vgrajen v HTML, zato tam ne sme
// biti ničesar, kar bi se lahko izvedlo: <script>, on*="…", href, style,
// url(…), <foreignObject> ...
//
// Zato se SVG ne "popravlja", ampak NA NOVO ZGRADI samo iz dovoljenih delov:
// nekaj oblik (path, circle, rect ...), nekaj atributov (d, fill, stroke ...)
// in vrednosti, ki so videti natanko tako, kot morajo (številke, barve).
// Vse ostalo — tudi besedilo med oznakami — odpade. Karkoli pride noter,
// ven lahko pride samo risba.
//
// Ista funkcija teče trikrat: v brskalniku pred predogledom, v strežniški
// akciji pred zapisom v bazo in še ob izrisu za gosta. Tretji krog stane
// nekaj mikrosekund in pomeni, da tudi ročno spremenjena vrstica v bazi ne
// more podtakniti ničesar.
// ---------------------------------------------------------------------------

// type, ne interface: postgres.js sprejme za jsonb samo vrednost z indeksnim
// podpisom, tega pa ima v TypeScriptu le tipski vzdevek.
export type IkonaSvg = {
  /** viewBox, npr. "0 0 24 24". */
  vb: string;
  /** Notranjost <svg>, že očiščena. */
  body: string;
};

/** Predpona v polju `ikona` za ikono iz iskalnika: "x:mdi:instagram". */
export const PREFIKS_VANJSKI = "x:";

/** Ime ikone, kot ga pozna Iconify: "zbirka:ime". */
export const IME_IKONE = /^[a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:-[a-z0-9]+)*$/;

const NAJVEC_ZNAKOV = 20_000;
const NAJVEC_GNEZDENJA = 12;

const ELEMENTI = new Set(["path", "circle", "ellipse", "rect", "line", "polyline", "polygon", "g"]);

const BROJ = /^-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i;
const BROJEVI = /^[-+0-9.eE,\s]+$/;
const BOJA = /^(?:none|currentColor|#[0-9a-f]{3,8})$/i;
const RIJEC = /^[a-z-]+$/;
const PUTANJA = /^[MmLlHhVvCcSsQqTtAaZz0-9.,\s\-+eE]+$/;
const TRANSFORM = /^(?:\s*(?:translate|scale|rotate|matrix|skewX|skewY)\(\s*[-+0-9.eE,\s]+\)\s*)+$/;

/** Atribut in pravilo, ki mu mora ustrezati vrednost. */
const ATRIBUTI: Record<string, RegExp> = {
  d: PUTANJA,
  cx: BROJ, cy: BROJ, r: BROJ, rx: BROJ, ry: BROJ,
  x: BROJ, y: BROJ, width: BROJ, height: BROJ,
  x1: BROJ, y1: BROJ, x2: BROJ, y2: BROJ,
  points: BROJEVI,
  fill: BOJA,
  stroke: BOJA,
  "stroke-width": BROJ,
  "stroke-linecap": RIJEC,
  "stroke-linejoin": RIJEC,
  "stroke-miterlimit": BROJ,
  "fill-rule": RIJEC,
  "clip-rule": RIJEC,
  opacity: BROJ,
  "fill-opacity": BROJ,
  "stroke-opacity": BROJ,
  transform: TRANSFORM,
};

const OZNAKA = /<\s*(\/)?\s*([a-zA-Z][\w:-]*)((?:[^<>"']|"[^"]*"|'[^']*')*?)(\/)?\s*>/g;
const ATRIBUT = /([a-zA-Z][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

/** Iz notranjosti SVG-ja zgradi novo, v kateri je samo dovoljeno. */
export function ocistiTijelo(surovo: string): string {
  if (typeof surovo !== "string" || surovo.length > NAJVEC_ZNAKOV) return "";

  let izlaz = "";
  let preskoci = 0; // globina znotraj nedovoljenega elementa — vse tam odpade
  const odprti: string[] = [];

  for (const m of surovo.matchAll(OZNAKA)) {
    const zapira = Boolean(m[1]);
    const ime = m[2].toLowerCase();
    const sama = Boolean(m[4]);

    if (preskoci > 0) {
      if (zapira) preskoci--;
      else if (!sama) preskoci++;
      continue;
    }

    if (!ELEMENTI.has(ime)) {
      // <mask>, <defs>, <script>, <animate> ... s celotno vsebino vred.
      if (!zapira && !sama) preskoci = 1;
      continue;
    }

    if (zapira) {
      if (odprti[odprti.length - 1] === ime) {
        odprti.pop();
        izlaz += `</${ime}>`;
      }
      continue;
    }

    let atributi = "";
    for (const a of m[3].matchAll(ATRIBUT)) {
      const kljuc = a[1].toLowerCase();
      const vrijednost = (a[2] ?? a[3] ?? "").trim();
      const pravilo = ATRIBUTI[kljuc];
      if (pravilo && vrijednost && pravilo.test(vrijednost)) {
        atributi += ` ${kljuc}="${vrijednost}"`;
      }
    }

    if (sama || ime !== "g") {
      izlaz += `<${ime}${atributi}/>`;
    } else {
      if (odprti.length >= NAJVEC_GNEZDENJA) return "";
      odprti.push(ime);
      izlaz += `<${ime}${atributi}>`;
    }
  }

  // Nezaprte skupine zapremo sami, da HTML okoli ostane cel.
  while (odprti.length) izlaz += `</${odprti.pop()}>`;
  return izlaz;
}

/** viewBox iz štirih števil; karkoli drugega zavrne. */
function ocistiVb(v: unknown): string {
  const deli = String(v ?? "").trim().split(/[\s,]+/);
  if (deli.length !== 4 || !deli.every((d) => BROJ.test(d))) return "";
  if (Number(deli[2]) <= 0 || Number(deli[3]) <= 0) return "";
  return deli.join(" ");
}

/**
 * Očiščena ikona ali null. Null pomeni: ni bilo ničesar uporabnega (prazna
 * risba, napačen viewBox) — takrat gumb ikone preprosto nima.
 */
export function ocistiIkonu(v: unknown): IkonaSvg | null {
  if (!v || typeof v !== "object") return null;
  const izvor = v as Record<string, unknown>;
  const vb = ocistiVb(izvor.vb);
  const body = ocistiTijelo(String(izvor.body ?? ""));
  if (!vb || !body.includes("<")) return null;
  return { vb, body };
}
