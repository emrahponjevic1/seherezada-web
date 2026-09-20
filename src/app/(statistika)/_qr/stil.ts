// ---------------------------------------------------------------------------
// IZGLED QR KODA
//
// Shrani se v bazo kot JSON, da je mogoče isti kod kadarkoli znova prenesti
// v enaki podobi. Datoteka nima uvozov, ker jo uporabljata oba: brskalnik
// (oblikovalnik) in strežnik (preverjanje, preden gre v bazo).
// ---------------------------------------------------------------------------

export const OBLIKE_TACAKA = [
  ["square", "Kvadrati"],
  ["dots", "Tačke"],
  ["rounded", "Zaobljeni"],
  ["extra-rounded", "Jako zaobljeni"],
  ["classy", "Elegantni"],
  ["classy-rounded", "Elegantni zaobljeni"],
] as const;

export const OBLIKE_OKVIRA = [
  ["square", "Kvadrat"],
  ["extra-rounded", "Zaobljen"],
  ["dot", "Krug"],
] as const;

export const OBLIKE_SREDINE = [
  ["square", "Kvadrat"],
  ["dot", "Krug"],
] as const;

export const KOREKCIJE = [
  ["L", "Niska (7%)"],
  ["M", "Srednja (15%)"],
  ["Q", "Visoka (25%)"],
  ["H", "Najviša (30%) — za logo"],
] as const;

type Vrijednost<T extends readonly (readonly [string, string])[]> = T[number][0];

export interface QrStil {
  oblikTacaka: Vrijednost<typeof OBLIKE_TACAKA>;
  bojaTacaka: string;
  gradijent: boolean;
  bojaTacaka2: string;
  tipGradijenta: "linear" | "radial";
  rotacija: number;
  oblikOkvira: Vrijednost<typeof OBLIKE_OKVIRA>;
  bojaOkvira: string;
  oblikSredine: Vrijednost<typeof OBLIKE_SREDINE>;
  bojaSredine: string;
  bojaPozadine: string;
  providnaPozadina: boolean;
  /** Prazen rob okoli koda, v odstotkih širine. */
  margina: number;
  korekcija: Vrijednost<typeof KOREKCIJE>;
  /** Slika kot data: URL (PNG, JPEG ali WebP) ali null. */
  logo: string | null;
  /** Delež širine koda, ki ga zasede logotip. */
  velicinaLoga: number;
  marginaLoga: number;
  /** Zaobljenost vogalov logotipa v odstotkih krajše stranice; 50 je krog. */
  radijusLoga: number;
  sakrijTackeIzaLoga: boolean;
}

export const ZADANI_STIL: QrStil = {
  oblikTacaka: "square",
  bojaTacaka: "#1c1917",
  gradijent: false,
  bojaTacaka2: "#ea580c",
  tipGradijenta: "linear",
  rotacija: 45,
  oblikOkvira: "square",
  bojaOkvira: "#1c1917",
  oblikSredine: "square",
  bojaSredine: "#1c1917",
  bojaPozadine: "#ffffff",
  providnaPozadina: false,
  margina: 4,
  korekcija: "M",
  logo: null,
  velicinaLoga: 0.3,
  marginaLoga: 4,
  radijusLoga: 0,
  sakrijTackeIzaLoga: true,
};

export const PREDLOSCI: { naziv: string; stil: Partial<QrStil> }[] = [
  { naziv: "Klasični", stil: { ...ZADANI_STIL } },
  {
    naziv: "Šeherezada",
    stil: {
      // Temnejši odtenek oranžne: #ea580c ima na beli podlagi samo 3,6 : 1,
      // kar nekatere kamere že težko preberejo.
      oblikTacaka: "rounded",
      bojaTacaka: "#c2410c",
      gradijent: true,
      bojaTacaka2: "#92400e",
      tipGradijenta: "linear",
      rotacija: 45,
      oblikOkvira: "extra-rounded",
      bojaOkvira: "#1c1917",
      oblikSredine: "dot",
      bojaSredine: "#c2410c",
      bojaPozadine: "#ffffff",
      providnaPozadina: false,
    },
  },
  {
    naziv: "Bordo",
    stil: {
      oblikTacaka: "classy-rounded",
      bojaTacaka: "#a41023",
      gradijent: false,
      oblikOkvira: "extra-rounded",
      bojaOkvira: "#a41023",
      oblikSredine: "dot",
      bojaSredine: "#1c1917",
      bojaPozadine: "#fffcf8",
      providnaPozadina: false,
    },
  },
  {
    naziv: "Tačkice",
    stil: {
      oblikTacaka: "dots",
      bojaTacaka: "#1c1917",
      gradijent: false,
      oblikOkvira: "dot",
      bojaOkvira: "#1c1917",
      oblikSredine: "dot",
      bojaSredine: "#ea580c",
      bojaPozadine: "#ffffff",
      providnaPozadina: false,
    },
  },
];

/** Največja dovoljena velikost logotipa v bazi (data: URL, ~300 KB slike). */
export const NAJVEC_LOGO = 420_000;

const HEX = /^#[0-9a-f]{6}$/i;
const LOGO = /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i;

function izbor<T extends string>(v: unknown, dovoljeno: readonly (readonly [T, string])[], zadano: T): T {
  return dovoljeno.some(([k]) => k === v) ? (v as T) : zadano;
}
const boja = (v: unknown, zadano: string) =>
  typeof v === "string" && HEX.test(v) ? v.toLowerCase() : zadano;
const broj = (v: unknown, min: number, max: number, zadano: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : zadano;
const da = (v: unknown, zadano: boolean) => (typeof v === "boolean" ? v : zadano);

/**
 * Iz česarkoli, kar pride od brskalnika, naredi veljaven stil. Česar ne
 * prepozna, zamenja z zadano vrednostjo — v bazo ne gre nič tujega.
 */
export function ocistiStil(v: unknown): QrStil {
  const s = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const z = ZADANI_STIL;
  return {
    oblikTacaka: izbor(s.oblikTacaka, OBLIKE_TACAKA, z.oblikTacaka),
    bojaTacaka: boja(s.bojaTacaka, z.bojaTacaka),
    gradijent: da(s.gradijent, z.gradijent),
    bojaTacaka2: boja(s.bojaTacaka2, z.bojaTacaka2),
    tipGradijenta: s.tipGradijenta === "radial" ? "radial" : "linear",
    rotacija: broj(s.rotacija, 0, 360, z.rotacija),
    oblikOkvira: izbor(s.oblikOkvira, OBLIKE_OKVIRA, z.oblikOkvira),
    bojaOkvira: boja(s.bojaOkvira, z.bojaOkvira),
    oblikSredine: izbor(s.oblikSredine, OBLIKE_SREDINE, z.oblikSredine),
    bojaSredine: boja(s.bojaSredine, z.bojaSredine),
    bojaPozadine: boja(s.bojaPozadine, z.bojaPozadine),
    providnaPozadina: da(s.providnaPozadina, z.providnaPozadina),
    margina: broj(s.margina, 0, 20, z.margina),
    korekcija: izbor(s.korekcija, KOREKCIJE, z.korekcija),
    logo:
      typeof s.logo === "string" && s.logo.length <= NAJVEC_LOGO && LOGO.test(s.logo)
        ? s.logo
        : null,
    velicinaLoga: broj(s.velicinaLoga, 0.1, 0.5, z.velicinaLoga),
    marginaLoga: broj(s.marginaLoga, 0, 20, z.marginaLoga),
    radijusLoga: broj(s.radijusLoga, 0, 50, z.radijusLoga),
    sakrijTackeIzaLoga: da(s.sakrijTackeIzaLoga, z.sakrijTackeIzaLoga),
  };
}

// ---- Kontrast: ali ga bo telefon sploh prebral ---------------------------

function svjetlina(hex: string) {
  const k = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
}

export function kontrast(a: string, b: string) {
  const [x, y] = [svjetlina(a), svjetlina(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/** Opozorila o berljivosti. Prazen seznam pomeni, da je kod v redu. */
export function upozorenjaStila(s: QrStil): string[] {
  const out: string[] = [];
  if (s.providnaPozadina) {
    out.push("Providna pozadina: kod će se čitati samo ako ga odštampaš na svijetloj, jednobojnoj podlozi.");
  }
  const pozadina = s.providnaPozadina ? "#ffffff" : s.bojaPozadine;
  const prednje = [s.bojaTacaka, s.bojaOkvira, s.bojaSredine, ...(s.gradijent ? [s.bojaTacaka2] : [])];
  const najslabiji = Math.min(...prednje.map((c) => kontrast(c, pozadina)));
  if (najslabiji < 3) {
    out.push(`Premali kontrast (${najslabiji.toFixed(1)} : 1). Mnogi telefoni ga neće prepoznati — potamni tačke ili posvijetli pozadinu.`);
  } else if (najslabiji < 4.5) {
    out.push(`Kontrast je granični (${najslabiji.toFixed(1)} : 1). Obavezno probaj skenirati prije štampe.`);
  }
  if (prednje.some((c) => svjetlina(c) > svjetlina(pozadina))) {
    out.push("Svijetle tačke na tamnoj pozadini: neke kamere takav (obrnuti) kod ne čitaju.");
  }
  if (s.logo && (s.korekcija === "L" || s.korekcija === "M")) {
    out.push("Uz logo postavi korekciju grešaka na „Visoka“ ili „Najviša“, inače logo može pokvariti čitanje.");
  }
  if (s.logo && s.velicinaLoga > 0.4) {
    out.push("Logo je veoma velik. Iznad 40% kod se često ne može pročitati.");
  }
  return out;
}
