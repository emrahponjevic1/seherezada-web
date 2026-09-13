import { randomInt } from "node:crypto";

// Brez črk, ki jih je na odtisu lahko zamenjati: 0/o, 1/l/i.
const ABECEDA = "abcdefghjkmnpqrstuvwxyz23456789";

export const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

export function noviSlug(dolzina = 6) {
  return Array.from({ length: dolzina }, () => ABECEDA[randomInt(ABECEDA.length)]).join("");
}
