import { after } from "next/server";
import { SITE_URL } from "@/data/site";
import { baza } from "@/app/(statistika)/_qr/baza";
import { bazniUrl } from "@/app/(statistika)/_qr/bazniUrl";
import { pripraviQrTabele } from "@/app/(statistika)/_qr/shema";
import { podaciSkeniranja } from "@/app/(statistika)/_qr/skeniranje";
import { jezikGosta } from "@/app/(statistika)/_linkovi/tekst";
import { PREDPONA, razrijesiInterno } from "@/app/(statistika)/_linkovi/interniCilj";

// ---------------------------------------------------------------------------
// KRATKA POVEZAVA ZA QR KOD  —  seherezada.net/q/<slug>
//
// Gost skenira kod, telefon odpre to pot, mi pa ga takoj pošljemo na pravi
// cilj (Google ocena, TripAdvisor, meni ...). Vmesne strani ni.
//
// Isto pot uporabljajo gumbi na straneh s povezavami: gumb je v bazi vrstica
// v qr_kodovi, zato se klik nanj zabeleži enako kot skeniranje in dobi isto
// statistiko. Za gosta je razlika samo v tem, da namesto kamere uporabi prst.
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

type Zapis = { id: number; cilj: string; aktivan: boolean; vodi_na: number | null };

/** Stolpec ali tabela ne obstaja (Postgres 42703 / 42P01). */
function manjkaShema(e: unknown) {
  const koda = (e as { code?: string }).code;
  return koda === "42703" || koda === "42P01";
}

async function preberi(slug: string) {
  const sql = baza();
  const [kod] = await sql<Zapis[]>`
    select id, cilj, aktivan, vodi_na from qr_kodovi where slug = ${slug.toLowerCase()} limit 1`;
  return kod;
}

async function obdelaj(zahteva: Request, slug: string, zapisi: boolean) {
  let kod: Zapis | undefined;
  try {
    try {
      kod = await preberi(slug);
    } catch (e) {
      // Tabele se dopolnijo šele ob prvem obisku /statistika. Po objavi nove
      // različice bi do takrat vsako skeniranje ODTISNJENE kode padlo na
      // manjkajočem stolpcu (vodi_na) in gosta poslalo na naslovnico.
      // Zato shemo v tem primeru pripravimo tu, enkrat, in poskusimo znova.
      if (!manjkaShema(e)) throw e;
      await pripraviQrTabele();
      kod = await preberi(slug);
    }
  } catch (e) {
    console.error("QR: baza ni dosegljiva, pošiljam na naslovnico", e);
    return preusmjeri(SITE_URL);
  }

  if (!kod || !kod.aktivan) return preusmjeri(SITE_URL);

  // Gumb "Meni" ne sme voditi vseh na slovensko stran. Cilj "interno:/meni" se
  // zato tu prevede v jezik telefona: /de/speisekarte, /en/menu, /meni.
  const cilj = kod.cilj.startsWith(PREDPONA)
    ? razrijesiInterno(kod.cilj, jezikGosta(zahteva.headers.get("accept-language")), bazniUrl())
    : kod.cilj;

  if (zapisi) {
    const podatki = {
      kod_id: kod.id,
      // Katera stran s povezavami se je odprla s tem skeniranjem. Pri gumbih
      // je prazno — njihovi kliki se štejejo prek qr_kodovi.stranica_id.
      // Brez tega bi prevezana koda svoja stara skeniranja preselila k novi
      // strani in številke bi lagale.
      stranica_id: kod.vodi_na,
      ...podaciSkeniranja(zahteva.headers),
    };
    after(async () => {
      try {
        const sql = baza();
        await sql`insert into qr_skeniranja ${sql(podatki)}`;
      } catch (e) {
        console.error("QR: skeniranja ni bilo mogoče zapisati", e);
      }
    });
  }

  return preusmjeri(cilj);
}

type Kontekst = { params: Promise<{ slug: string }> };

export async function GET(zahteva: Request, { params }: Kontekst) {
  return obdelaj(zahteva, (await params).slug, true);
}

/** HEAD pošiljajo preverjevalniki povezav, ne ljudje — preusmeri, ne štej. */
export async function HEAD(zahteva: Request, { params }: Kontekst) {
  return obdelaj(zahteva, (await params).slug, false);
}
