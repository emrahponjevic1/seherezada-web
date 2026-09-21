// Provjera hreflanga na SVIM adresama iz sitemapa.
//
// Google odbacuje hreflang koji nije uzajaman. Zato nije dovoljno vidjeti
// da tagovi postoje — treba provjeriti da svaka stranica koju neka druga
// spominje uzvraca istim skupom.
//
// Provjeravamo:
//   1. svaka stranica ima svih 6 jezika + x-default (objava na blogu samo
//      jezike na koje je prevedena + x-default)
//   2. stranica navodi SAMU SEBE (self-reference)
//   3. uzajamnost: ako A navodi B, onda B navodi A istim skupom
//   4. canonical pokazuje na samu sebe
//   5. svaka navedena adresa vraca 200, ne preusmjerenje
const BASE = process.argv[2];
const ZIVI = "https://seherezada.net";

const lok = (u) => BASE + u.slice(ZIVI.length);

async function stranica(u) {
  const r = await fetch(lok(u), { redirect: "manual" });
  const h = r.status === 200 ? await r.text() : "";
  const alt = {};
  for (const m of h.matchAll(
    /<link rel="alternate" hrefLang="([^"]+)" href="([^"]+)"\/>/gi
  )) alt[m[1]] = m[2];
  const c = h.match(/<link rel="canonical" href="([^"]+)"\/>/i);
  return { status: r.status, alt, canonical: c ? c[1] : null };
}

(async () => {
  const xml = await (await fetch(BASE + "/sitemap.xml")).text();
  const adrese = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  console.log("adresa u sitemapu: " + adrese.length);

  const kes = new Map();
  const daj = async (u) => {
    if (!kes.has(u)) kes.set(u, await stranica(u));
    return kes.get(u);
  };

  let greske = 0;
  const javi = (poruka) => { console.log("  ✗ " + poruka); greske++; };

  for (const u of adrese) {
    const s = await daj(u);
    if (s.status !== 200) { javi(u + " -> HTTP " + s.status); continue; }

    // Objava na blogu postoji samo u jezicima na koje je prevedena, pa ima
    // manje tagova. I tada mora imati x-default i bar jedan jezik; da je skup
    // isti na svim verzijama, provjerava petlja ispod.
    const kljucevi = Object.keys(s.alt);
    const objava = /\/blog\/[^/]+$/.test(u);
    if (objava) {
      if (kljucevi.length < 2 || !kljucevi.includes("x-default"))
        javi(u + " ima hreflang " + kljucevi.join(",") + ", ocekujem jezik + x-default");
    } else if (kljucevi.length !== 7)
      javi(u + " ima " + kljucevi.length + " hreflang tagova, ocekujem 7");

    if (!Object.values(s.alt).includes(u))
      javi(u + " ne navodi samu sebe");

    if (s.canonical !== u)
      javi(u + " canonical je " + s.canonical);

    for (const [jezik, druga] of Object.entries(s.alt)) {
      if (jezik === "x-default") continue;
      const d = await daj(druga);
      if (d.status !== 200) { javi(druga + " (iz " + u + ") -> HTTP " + d.status); continue; }
      if (d.alt[jezik] !== druga)
        javi("nije uzajamno: " + u + " -> " + druga + ", a natrag " + d.alt[jezik]);
      // skup mora biti identican na svih sest verzija
      for (const [j2, a2] of Object.entries(s.alt))
        if (d.alt[j2] !== a2)
          javi("razlicit skup: " + u + " ima " + j2 + "=" + a2 +
               ", a " + druga + " ima " + j2 + "=" + d.alt[j2]);
    }
  }

  console.log("provjereno stranica: " + kes.size);
  console.log(greske ? "GRESAKA: " + greske : "sve u redu");
})();
