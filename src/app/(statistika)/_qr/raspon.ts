// Časovna obdobja za filter na /statistika. null = od začetka.

export const RASPONI = [
  { kljuc: "danas", naziv: "Danas", dani: 1 },
  { kljuc: "7", naziv: "7 dana", dani: 7 },
  { kljuc: "30", naziv: "30 dana", dani: 30 },
  { kljuc: "90", naziv: "90 dana", dani: 90 },
  { kljuc: "365", naziv: "12 mjeseci", dani: 365 },
  { kljuc: "sve", naziv: "Sve", dani: null },
] as const;

export type Raspon = (typeof RASPONI)[number];

export function procitajRaspon(v: string | undefined): Raspon {
  return RASPONI.find((r) => r.kljuc === v) ?? RASPONI[2];
}
