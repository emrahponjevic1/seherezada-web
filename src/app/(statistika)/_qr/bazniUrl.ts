import { SITE_URL } from "@/data/site";

/**
 * Naslov, na katerega kaže kratka povezava v QR kodi.
 *
 *   produkcija   https://seherezada.net
 *   predogled    stalni naslov veje na Vercelu (VERCEL_BRANCH_URL), sicer bi
 *                skeniran kod šel na živo stran, ki /q/ še nima, in dobil 404
 *   lokalno      QR_BAZNI_URL iz .env.development.local (npr.
 *                http://192.168.1.88:3000), da telefon v domačem omrežju
 *                pride do računalnika
 *
 * Kod, prenesen s predogleda ali lokalno, se NE sme natisniti — deluje samo,
 * dokler obstaja tista veja oziroma računalnik.
 */
export function bazniUrl() {
  const rocno = process.env.QR_BAZNI_URL;
  if (rocno) return rocno.replace(/\/+$/, "");

  const veja = process.env.VERCEL_BRANCH_URL;
  if (process.env.VERCEL_ENV === "preview" && veja) return `https://${veja}`;

  return SITE_URL;
}
