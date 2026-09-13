import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// ---------------------------------------------------------------------------
// PRIJAVA NA /statistika
//
// Eno geslo, brez uporabniških računov. Geslo NI v kodi — bere se iz
// ADMIN_GESLO — ime je ostalo od prej, geslo velja za /statistika (lokalno .env.local, na spletu Vercel -> Environment Variables).
//
// Piškotek vsebuje samo čas izteka in podpis. Podpis je narejen s ključem,
// izpeljanim iz gesla, zato sprememba gesla takoj odjavi vse naprave.
// ---------------------------------------------------------------------------

const PISKOTEK = "statistika_sesija";
const POT = "/statistika";
const TRAJANJE_S = 30 * 24 * 60 * 60;

function kljuc(namjena: string) {
  return createHmac("sha256", process.env.ADMIN_GESLO ?? "").update(namjena).digest();
}

export const gesloNastavljeno = () => Boolean(process.env.ADMIN_GESLO);

export function preveriGeslo(vnos: string) {
  const geslo = process.env.ADMIN_GESLO;
  if (!geslo) return false;
  // Primerjamo izvlečka enake dolžine, da čas primerjave ne izda ničesar.
  const a = createHash("sha256").update(vnos).digest();
  const b = createHash("sha256").update(geslo).digest();
  return timingSafeEqual(a, b);
}

const podpis = (vsebina: string) =>
  createHmac("sha256", kljuc("sesija")).update(vsebina).digest("base64url");

export async function ustvariSesijo() {
  const istece = String(Date.now() + TRAJANJE_S * 1000);
  (await cookies()).set(PISKOTEK, `${istece}.${podpis(istece)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: POT,
    maxAge: TRAJANJE_S,
  });
}

export async function jePrijavljen() {
  // Piškotek beremo PRED preverjanjem gesla. cookies() Nextu pove, da je stran
  // odvisna od obiskovalca; brez tega bi build brez ADMIN_GESLO stran zapekel
  // kot statično — za vedno z obrazcem za prijavo.
  const vrednost = (await cookies()).get(PISKOTEK)?.value;
  if (!gesloNastavljeno() || !vrednost) return false;
  const [istece, dobljeni] = vrednost.split(".");
  if (!istece || !dobljeni || Number(istece) < Date.now()) return false;
  const pricakovani = Buffer.from(podpis(istece));
  const prejeti = Buffer.from(dobljeni);
  return pricakovani.length === prejeti.length && timingSafeEqual(pricakovani, prejeti);
}

export async function odjaviSesijo() {
  (await cookies()).delete({ name: PISKOTEK, path: POT });
}

/** Podpis IP naslova za zavoro prijave — sam naslov se ne shrani. */
export function odtisIp(ip: string) {
  return createHmac("sha256", kljuc("prijava")).update(ip).digest("base64url").slice(0, 22);
}

/**
 * Anonimni odtis obiskovalca za štetje "edinstvenih" skeniranj QR kod.
 *
 * IP naslova ne shranimo nikoli. Shranimo le podpis (IP + brskalnik + dan),
 * ki se vsak dan spremeni — isti telefon jutri dobi drug odtis, zato ga ni
 * mogoče slediti čez dneve. To je namenoma: več ne potrebujemo, GDPR pa
 * zahteva, da ne zbiramo več, kot potrebujemo.
 */
export function odtisPosjetioca(ip: string, brskalnik: string, dan: string) {
  return createHmac("sha256", kljuc("posjetilac"))
    .update(`${dan}|${ip}|${brskalnik}`)
    .digest("base64url")
    .slice(0, 22);
}
