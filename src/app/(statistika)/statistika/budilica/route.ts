import { baza, imaBazu } from "@/app/(statistika)/_qr/baza";

// ---------------------------------------------------------------------------
// BUDILKA ZA BAZO  —  /statistika/budilica
//
// Brezplačni Supabase projekt zaustavi, če 7 dni ni nobene poizvedbe. Potem
// QR statistika in kratke povezave ne delujejo, dokler ga nekdo ročno ne zbudi.
//
// Vercel Cron (vercel.json) to pot pokliče enkrat na dan in pošlje en droben
// upit. Cron teče samo na produkcijski objavi, ne na predogledih.
//
// Vercel pošlje glavo "Authorization: Bearer <CRON_SECRET>", če je
// CRON_SECRET nastavljen. Brez pravega žetona pot ne naredi ničesar, da je
// ne more nihče drug uporabljati za budjenje ali obremenjevanje baze.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(zahteva: Request) {
  const tajna = process.env.CRON_SECRET;
  if (!tajna || zahteva.headers.get("authorization") !== `Bearer ${tajna}`) {
    return new Response("Ni dovoljeno.", { status: 401 });
  }
  if (!imaBazu()) return new Response("Baza ni nastavljena.", { status: 503 });

  try {
    await baza()`select 1`;
    return Response.json({ ok: true, cas: new Date().toISOString() });
  } catch (e) {
    console.error("Budilica: baza ni odgovorila", e);
    return new Response("Baza ni odgovorila.", { status: 502 });
  }
}
