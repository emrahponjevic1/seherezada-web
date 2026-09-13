import postgres from "postgres";

// ---------------------------------------------------------------------------
// BAZA ZA QR STATISTIKO (kode, skeniranja, zavora prijave)
//
// Naslov baze ni v kodi. Bere se iz DATABASE_URL, ki ga Vercel vpiše sam,
// ko projektu dodaš Neon (Storage -> Create Database). Lokalno ga vpišeš v
// .env.local.
//
// prepare: false je nujen za Neonov "pooled" naslov (PgBouncer v načinu
// transakcij ne zna shranjenih poizvedb). Na navadnem Postgresu ne škodi.
//
// Odjemalec živi na globalThis, da ga razvojni strežnik ob vsakem shranjevanju
// datoteke ne ustvari znova in ne odpre novih povezav.
//
// Tabele ustvari vsak modul sam (glej shema.ts v _zajednicko in _qr).
// ---------------------------------------------------------------------------

const globalno = globalThis as unknown as { qrBaza?: postgres.Sql };

/**
 * Vercelova integracija s Supabase vpiše POSTGRES_URL (skupni "transaction
 * pooler", vrata 6543), ročna nastavitev pa DATABASE_URL. Sprejmemo oboje.
 */
const surovNaslov = () => process.env.DATABASE_URL || process.env.POSTGRES_URL;

export const imaBazu = () => Boolean(surovNaslov());

/**
 * Supabase v naslov doda parametre za svoja orodja (npr. supa=base-pooler.x).
 * postgres.js bi jih poslal strežniku kot nastavitve povezave in ta bi
 * povezavo lahko zavrnil. Obdržimo samo tiste, ki jih razumemo.
 */
function ocistiNaslov(naslov: string) {
  const url = new URL(naslov);
  for (const k of [...url.searchParams.keys()]) {
    if (!["sslmode", "max"].includes(k)) url.searchParams.delete(k);
  }
  return url.toString();
}

export function baza() {
  const surov = surovNaslov();
  if (!surov) throw new Error("DATABASE_URL (ali POSTGRES_URL) ni nastavljen");
  const naslov = ocistiNaslov(surov);
  // Velikost bazena (max) namenoma ni zapisana tu: postgres.js jo sicer vzame
  // iz naslova (?max=...), zapisana v kodi pa bi naslov povozila.
  globalno.qrBaza ??= postgres(naslov, {
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
  return globalno.qrBaza;
}
