// ---------------------------------------------------------------------------
// BARVE STRANI IN GUMBOV
//
// Samo barve iz CLAUDE.md. Prosto polje za barvo bi prej ali slej dalo stran,
// na kateri belega napisa ni mogoče prebrati; tu je vsaka možnost preverjena.
//
// DVE RAZLIČNI STVARI
//   barva STRANI  — iz nje se naredi barvni preliv čez celo ozadje
//   barva GUMBA   — kartice so bele, zato barva pobarva ikono in krogec s
//                   puščico, ne kartice same. Prazno = temna, kot na predlogi.
// ---------------------------------------------------------------------------

export interface Preliv {
  /** Zgornja barva ozadja. */
  gore: string;
  /** Spodnja barva ozadja. */
  dolje: string;
}

export const BOJE: readonly { boja: string; naziv: string; preliv: Preliv }[] = [
  { boja: "#ea580c", naziv: "Narandžasta", preliv: { gore: "#f2661d", dolje: "#a41023" } },
  { boja: "#f59e0b", naziv: "Zlatna", preliv: { gore: "#f7a81b", dolje: "#c2410c" } },
  { boja: "#ef4444", naziv: "Koralna", preliv: { gore: "#f25c5c", dolje: "#8f1218" } },
  { boja: "#a41023", naziv: "Bordo", preliv: { gore: "#c4162b", dolje: "#6d0b17" } },
  { boja: "#047857", naziv: "Zelena", preliv: { gore: "#0d9668", dolje: "#053f2f" } },
  { boja: "#1c1917", naziv: "Tamna", preliv: { gore: "#44403c", dolje: "#141210" } },
] as const;

/** Privzeta barva strani, kadar lastnik ne izbere ničesar. */
export const ZADANA_BOJA = "#ea580c";

/** Barva ikone in puščice, kadar gumb nima izbrane svoje. */
export const ZADANA_BOJA_IKONE = "#1c1917";

/** Iz brskalnika sprejmemo samo barvo s seznama. Prazno ostane prazno. */
export function ocistiBoju(v: unknown): string {
  const b = String(v ?? "").trim().toLowerCase();
  return BOJE.some((x) => x.boja === b) ? b : "";
}

/** Preliv ozadja za izbrano barvo strani. */
export function prelivStranice(boja: string): Preliv {
  return (BOJE.find((x) => x.boja === boja) ?? BOJE[0]).preliv;
}

/** Barva ikone in krogca s puščico na gumbu. */
export function bojaIkone(svoja: string): string {
  return svoja || ZADANA_BOJA_IKONE;
}
