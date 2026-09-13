// ---------------------------------------------------------------------------
// BARVE KOD V GRAFU
//
// Kategorialna paleta, preverjena za barvno slepoto (sosednji pari ΔE ≥ 9).
// Tri svetlejše barve imajo na beli podlagi kontrast pod 3 : 1, zato graf
// vedno spremljajo legenda z imeni, oblaček s številkami in tabela.
//
// Barva sledi kodi, ne njeni uvrstitvi: dodeli se po vrstnem redu nastanka
// (id), zato koda obdrži barvo, tudi ko se spremeni število skeniranj ali
// filter obdobja. Deveta in naslednje kode gredo v sivo "Ostali" — nova,
// izmišljena barva bi bila nerazločljiva od obstoječe.
// ---------------------------------------------------------------------------

export const PALETA = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
export const BOJA_OSTALI = "#a8a29e";

export function bojeKodova(idjevi: number[]) {
  const poredani = [...idjevi].sort((a, b) => a - b);
  const previse = poredani.length > PALETA.length;
  const boje = new Map<number, { boja: string; ostali: boolean }>();
  poredani.forEach((id, i) => {
    const ostali = previse && i >= PALETA.length - 1;
    boje.set(id, { boja: ostali ? BOJA_OSTALI : PALETA[i], ostali });
  });
  return boje;
}
