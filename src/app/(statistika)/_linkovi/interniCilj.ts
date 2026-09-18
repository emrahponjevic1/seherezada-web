import { LOCALES } from "@/data/site";
import { pathnames } from "@/i18n/routing";

// ---------------------------------------------------------------------------
// ODREDIŠTE NA NAŠEM SPLETIŠČU, V JEZIKU GOSTA
//
// Gumb "Meni" ne sme voditi na trdo zapisan /meni: Nemec bi pristal na
// slovenski strani. Zato se tak cilj shrani kot "interno:/meni", ob kliku pa
// se prevede v pravi naslov — /de/speisekarte, /en/menu, /meni.
//
// Tabela prevodov ni prepisana: bere se iz src/i18n/routing.ts, ki je edini
// vir. Če se naslov strani tam spremeni, se gumbi popravijo sami.
// ---------------------------------------------------------------------------

export const PREDPONA = "interno:";

/** Strani, ki jih ima smisel dati na gumb. Vrstni red je vrstni red v izbirniku. */
export const INTERNE_STRANI = [
  { pot: "/meni", naziv: "Meni i cijene" },
  { pot: "/", naziv: "Naslovnica" },
  { pot: "/lokacije", naziv: "Lokacije" },
  { pot: "/galerija", naziv: "Galerija" },
  { pot: "/halal", naziv: "Halal" },
  { pot: "/studentski-boni", naziv: "Studentski boni" },
  { pot: "/kontakt", naziv: "Kontakt" },
  { pot: "/o-nas", naziv: "O nama" },
  { pot: "/pogosta-vprasanja", naziv: "Česta pitanja" },
  { pot: "/zaposlitev", naziv: "Posao kod nas" },
  { pot: "/blog", naziv: "Blog" },
] as const;

/** Ali je cilj interna stran in ali tako stran sploh imamo. */
export function jeInterno(cilj: string): boolean {
  if (!cilj.startsWith(PREDPONA)) return false;
  const pot = cilj.slice(PREDPONA.length);
  return INTERNE_STRANI.some((s) => s.pot === pot);
}

/** Iz "interno:/meni" dobi "/meni". Za nekaj drugega vrne prazno. */
export function internaPot(cilj: string): string {
  return jeInterno(cilj) ? cilj.slice(PREDPONA.length) : "";
}

/**
 * "interno:/meni" + "de" -> "<osnova>/de/speisekarte"
 *
 * Osnova se poda od zunaj (bazniUrl()), ne bere iz src/data/site.ts: na
 * lokalnem računalniku in na Vercelovem predogledu mora gost ostati na istem
 * strežniku, sicer ga gumb odnese na živo spletišče.
 *
 * Neznana pot ali jezik pade na naslovnico: gost mora vedno pristati nekje
 * koristnem, tudi če se tabela poti med tem spremeni.
 */
export function razrijesiInterno(cilj: string, jezik: string, osnova: string): string {
  const pot = internaPot(cilj);
  if (!pot) return osnova;

  const zapis = (pathnames as Record<string, string | Record<string, string>>)[pot];
  const prevedena = typeof zapis === "string" ? zapis : zapis?.[jezik] ?? pot;
  const predpona = LOCALES.find((l) => l.code === jezik)?.prefix ?? "";
  const rep = prevedena === "/" ? "" : prevedena;

  return `${osnova}${predpona}${rep}` || osnova;
}

/** Ime strani za izbirnik v nadzorni plošči. */
export function nazivInterne(cilj: string): string {
  const pot = internaPot(cilj);
  return INTERNE_STRANI.find((s) => s.pot === pot)?.naziv ?? "";
}
