import { after } from "next/server";
import { SITE_URL } from "@/data/site";
import { baza } from "@/app/(statistika)/_qr/baza";
import { podaciSkeniranja } from "@/app/(statistika)/_qr/skeniranje";

// ---------------------------------------------------------------------------
// KRATKA POVEZAVA ZA QR KOD  —  seherezada.net/q/<slug>
//
// Gost skenira kod, telefon odpre to pot, mi pa ga takoj pošljemo na pravi
// cilj (Google ocena, TripAdvisor, meni ...). Vmesne strani ni.
//
// Zapis v bazo teče ŠELE PO odgovoru (after), zato gost na shranjevanje ne
// čaka — preusmeritev traja samo toliko, kolikor branje enega kratkega
// zapisa.
//
// 302 in no-store: telefon si preusmeritve ne sme zapomniti, sicer bi drugo
// skeniranje z istega telefona šlo mimo nas in se ne bi štelo. Poleg tega
// lahko lastnik cilj kadarkoli spremeni.
//
// Neznan ali izklopljen kod pošlje na naslovnico, ne na napako: odtisnjen
// letak mora vedno pripeljati nekam koristno.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";

function preusmjeri(cilj: string) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: cilj,
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

async function obdelaj(zahteva: Request, slug: string, zapisi: boolean) {
  let kod: { id: number; cilj: string; aktivan: boolean } | undefined;
  try {
    const sql = baza();
    [kod] = await sql<{ id: number; cilj: string; aktivan: boolean }[]>`
      select id, cilj, aktivan from qr_kodovi where slug = ${slug.toLowerCase()} limit 1`;
  } catch (e) {
    console.error("QR: baza ni dosegljiva, pošiljam na naslovnico", e);
    return preusmjeri(SITE_URL);
  }

  if (!kod || !kod.aktivan) return preusmjeri(SITE_URL);

  if (zapisi) {
    const podatki = { kod_id: kod.id, ...podaciSkeniranja(zahteva.headers) };
    after(async () => {
      try {
        const sql = baza();
        await sql`insert into qr_skeniranja ${sql(podatki)}`;
      } catch (e) {
        console.error("QR: skeniranja ni bilo mogoče zapisati", e);
      }
    });
  }

  return preusmjeri(kod.cilj);
}

type Kontekst = { params: Promise<{ slug: string }> };

export async function GET(zahteva: Request, { params }: Kontekst) {
  return obdelaj(zahteva, (await params).slug, true);
}

/** HEAD pošiljajo preverjevalniki povezav, ne ljudje — preusmeri, ne štej. */
export async function HEAD(zahteva: Request, { params }: Kontekst) {
  return obdelaj(zahteva, (await params).slug, false);
}
