import { DEFAULT_LOCALE, LOCALE_CODES, type LocaleCode } from "@/data/site";
import type { Tekst } from "./tipovi";

// ---------------------------------------------------------------------------
// JEZIK GOSTA IN BESEDILA PO JEZIKIH
//
// Stran s povezavami ne uporablja next-intl: vsa vidna besedila napiše lastnik
// sam v nadzorni plošči, zato jih ni v messages/<jezik>.json. Jezik zato
// izberemo tu, iz glave accept-language, ki jo pošlje telefon.
//
// Na javnem spletišču je samodejno zaznavanje jezika namerno izklopljeno
// (glej src/i18n/routing.ts) — tam bi Googlov robot pristal na /en. Tu te
// nevarnosti ni: stran je noindex in do nje pride samo gost s skeniranjem.
// ---------------------------------------------------------------------------

function jeJezik(v: string): v is LocaleCode {
  return (LOCALE_CODES as readonly string[]).includes(v);
}

/**
 * Hrvaščina, srbščina in črnogorščina dobijo BHS. Telefon iz Zagreba pošlje
 * "hr", tega jezika pa v seznamu ni — brez te preslikave bi gost dobil
 * slovenščino, čeprav razume svoj jezik.
 */
const SRODNI: Record<string, LocaleCode> = { hr: "bs", sr: "bs", sh: "bs", me: "bs" };

/**
 * Jezik gosta: najprej izrecna izbira (?jezik=de), sicer prvi jezik telefona,
 * ki ga imamo. Če ne ujamemo nobenega, privzeti jezik.
 */
export function jezikGosta(accept: string | null, trazeni?: string | null): LocaleCode {
  if (trazeni && jeJezik(trazeni)) return trazeni;
  if (!accept) return DEFAULT_LOCALE.code;

  const zelje = accept
    .split(",")
    .map((dio) => {
      const [oznaka, ...parametri] = dio.trim().split(";");
      const q = parametri.find((p) => p.trim().startsWith("q="));
      const tezina = q ? Number.parseFloat(q.split("=")[1]) : 1;
      return { oznaka: oznaka.trim().toLowerCase(), tezina: Number.isFinite(tezina) ? tezina : 0 };
    })
    .filter((z) => z.oznaka && z.tezina > 0)
    .sort((a, b) => b.tezina - a.tezina);

  for (const { oznaka } of zelje) {
    const osnovni = oznaka.split("-")[0];
    const kod = SRODNI[osnovni] ?? osnovni;
    if (jeJezik(kod)) return kod;
  }
  return DEFAULT_LOCALE.code;
}

/**
 * Besedilo v jeziku gosta, sicer v privzetem jeziku, sicer prazno.
 *
 * Tretje stopnje "vzemi prvo, kar je zapisano" NI namerno. Če ima gumb vpisan
 * samo nemški prevod, bi Anglež dobil nemški napis — to se je zgodilo v prvem
 * preizkusu in je slabše kot osnovni napis. Klicatelj zato na prazno odgovori
 * s svojo osnovno vrednostjo:
 *
 *   uzmi(dugme.naslovi, jezik) || dugme.naziv
 */
export function uzmi(tekst: Tekst | null | undefined, jezik: string): string {
  if (!tekst) return "";
  const svoj = tekst[jezik]?.trim();
  if (svoj) return svoj;
  return tekst[DEFAULT_LOCALE.code]?.trim() ?? "";
}

/**
 * Pripravi besedilo za bazo: samo znani jeziki, obrezano, brez praznih.
 * Vsaka strežniška akcija je javno dosegljiva, zato se vrednostim iz
 * brskalnika ne zaupa.
 */
export function ocistiTekst(vrijednost: unknown, najvec = 120): Tekst {
  if (!vrijednost || typeof vrijednost !== "object") return {};
  const izvor = vrijednost as Record<string, unknown>;
  const cist: Tekst = {};
  for (const jezik of LOCALE_CODES) {
    const v = String(izvor[jezik] ?? "").trim().slice(0, najvec);
    if (v) cist[jezik] = v;
  }
  return cist;
}

/** Ali je v besedilu sploh kaj — za odločitev, ali vrstico izrisati. */
export function imaTekst(tekst: Tekst | null | undefined): boolean {
  return Boolean(tekst && Object.values(tekst).some((v) => v?.trim()));
}
