import { baza, imaBazu } from "@/app/(statistika)/_qr/baza";

// ---------------------------------------------------------------------------
// BUDILKA ZA BAZO IN ROK HRAMBE  —  /statistika/budilica
//
// 1. Brezplačni Supabase projekt zaustavi, če 7 dni ni nobene poizvedbe.
//    Potem QR statistika in kratke povezave ne delujejo, dokler ga nekdo
//    ročno ne zbudi. Ta klic je dnevna poizvedba, ki to prepreči.
//
// 2. GDPR zahteva določen rok hrambe (načelo omejitve shranjevanja). Rok je
//    zapisan v politiki zasebnosti (razdelek 5) in se izvaja TUKAJ, vsak dan:
//      - zapisi o skeniranjih QR kod: 24 mesecev
//      - poskusi prijave (zgoščen IP): 1 dan
//    Če rok spremeniš, spremeni tudi besedilo "varnost3" v messages/*.json.
//
// Vercel Cron (vercel.json) to pot pokliče enkrat na dan. Cron teče samo na
// produkcijski objavi, ne na predogledih. Vercel pošlje glavo
// "Authorization: Bearer <CRON_SECRET>"; brez pravega žetona pot ne naredi
// ničesar.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MESECEV_HRAMBE_SKENIRANJ = 24;

async function tabelaObstaja(ime: string) {
  const [r] = await baza()<{ obstaja: boolean }[]>`select to_regclass(${`public.${ime}`}) is not null as obstaja`;
  return r.obstaja;
}

export async function GET(zahteva: Request) {
  const tajna = process.env.CRON_SECRET;
  if (!tajna || zahteva.headers.get("authorization") !== `Bearer ${tajna}`) {
    return new Response("Ni dovoljeno.", { status: 401 });
  }
  if (!imaBazu()) return new Response("Baza ni nastavljena.", { status: 503 });

  try {
    const sql = baza();
    await sql`select 1`;

    const izbrisano = { skeniranja: 0, poskusiPrijave: 0 };
    if (await tabelaObstaja("qr_skeniranja")) {
      const r = await sql`
        delete from qr_skeniranja
        where vrijeme < now() - make_interval(months => ${MESECEV_HRAMBE_SKENIRANJ})`;
      izbrisano.skeniranja = r.count;
    }
    if (await tabelaObstaja("admin_prijave")) {
      const r = await sql`delete from admin_prijave where vrijeme < now() - interval '1 day'`;
      izbrisano.poskusiPrijave = r.count;
    }

    return Response.json({ ok: true, cas: new Date().toISOString(), izbrisano });
  } catch (e) {
    console.error("Budilica: baza ni odgovorila", e);
    return new Response("Baza ni odgovorila.", { status: 502 });
  }
}
