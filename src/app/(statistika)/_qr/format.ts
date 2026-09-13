// Oblikovanje števil, datumov in imen za /statistika. Vse po ljubljanskem času.

const TZ = "Europe/Ljubljana";
const JEZIK = "bs";

export const broj = (n: number) => new Intl.NumberFormat(JEZIK).format(n);

const datumVrijemeFmt = new Intl.DateTimeFormat(JEZIK, {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

export const datumVrijeme = (d: Date | null) => (d ? datumVrijemeFmt.format(d) : "—");

const punDan = new Intl.DateTimeFormat(JEZIK, {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-09-13" -> kratka oznaka za os in dolga za oblaček. */
export function oznakaDana(kljuc: string, jedinica: "day" | "week") {
  const d = new Date(`${kljuc}T12:00:00Z`);
  const kratko = `${d.getUTCDate()}. ${d.getUTCMonth() + 1}.`;
  return jedinica === "week"
    ? { oznaka: kratko, puna: `Sedmica od ${punDan.format(d)}` }
    : { oznaka: kratko, puna: punDan.format(d) };
}

export const DANI_SEDMICE = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];
export const DANI_SEDMICE_PUNO = ["ponedjeljak", "utorak", "srijeda", "četvrtak", "petak", "subota", "nedjelja"];

const relativnoFmt = new Intl.RelativeTimeFormat(JEZIK, { numeric: "auto" });

export function relativno(d: Date | null) {
  if (!d) return "nikad";
  const s = (d.getTime() - Date.now()) / 1000;
  const koraci: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [3600, "minute"],
    [86400, "hour"],
    [604800, "day"],
    [2629800, "week"],
    [31557600, "month"],
  ];
  let prethodni = 1;
  for (const [granica, jedinica] of koraci) {
    if (Math.abs(s) < granica) return relativnoFmt.format(Math.round(s / prethodni), jedinica);
    prethodni = granica;
  }
  return relativnoFmt.format(Math.round(s / 31557600), "year");
}

let drzave: Intl.DisplayNames | null = null;
export function imeDrzave(kod: string | null) {
  if (!kod) return null;
  try {
    drzave ??= new Intl.DisplayNames([JEZIK], { type: "region" });
    return drzave.of(kod.toUpperCase()) ?? kod;
  } catch {
    return kod;
  }
}

let jezici: Intl.DisplayNames | null = null;
export function imeJezika(oznaka: string | null) {
  if (!oznaka) return null;
  try {
    jezici ??= new Intl.DisplayNames([JEZIK], { type: "language" });
    return jezici.of(oznaka) ?? oznaka;
  } catch {
    return oznaka;
  }
}

export const UREDJAJI: Record<string, string> = {
  mobile: "Mobitel",
  tablet: "Tablet",
  desktop: "Računar",
  smarttv: "Smart TV",
  console: "Konzola",
  wearable: "Pametni sat",
  embedded: "Ugrađeni uređaj",
  xr: "VR/AR naočale",
};

export const imeUredjaja = (v: string | null) => (v ? UREDJAJI[v] ?? v : null);
