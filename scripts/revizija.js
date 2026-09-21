// FAZA 5E — zavrsna revizija svih 84 adrese.
//
// Ne provjerava "radi li", nego trazi ono sto bi tiho stetilo u Googleu:
// prazan ili predug naslov, opis koji se ponavlja, stranicu koja je ostala
// na slovenackom, canonical koji pokazuje drugdje, link koji vodi van jezika.
const BASE = process.argv[2];
const ZIVI = "https://seherezada.net";
const lok = (u) => BASE + u.slice(ZIVI.length);

const JEZICI = ["sl", "en", "de", "it", "bs", "tr"];

const ociscen = (x) => x
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
  .replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

function tekst(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ")
             .replace(/<style[\s\S]*?<\/style>/gi, " ")
             .replace(/<!--[\s\S]*?-->/g, " ")
             .replace(/<[^>]+>/g, "\n")
             .split("\n").map((r) => ociscen(r).trim()).filter(Boolean);
}

// Imena razdjeljaka iz prevoda — po njima prepoznajemo kljuc koji je
// procurio u vidljivi tekst. Bez ovoga bi "www.ip-rs.si" bio lazan alarm.
const RAZDJELJCI = new Set(Object.keys(require(require("path").resolve("messages/sl.json"))));

const nalazi = [];
const javi = (vrsta, gdje, sto) => nalazi.push({ vrsta, gdje, sto });

(async () => {
  const xml = await (await fetch(BASE + "/sitemap.xml")).text();
  const adrese = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  const naslovi = new Map();   // naslov -> [adrese]
  const opisi = new Map();
  const straniceSl = new Map(); // slovenacka adresa -> vidljivi tekst
  const zaglavlja = new Map();  // putanja -> {t, d, ogT, ogD}

  for (const u of adrese) {
    const r = await fetch(lok(u), { redirect: "manual" });
    if (r.status !== 200) { javi("HTTP", u, r.status); continue; }
    const h = await r.text();

    // jezik u <html lang>
    const lang = (h.match(/<html lang="([^"]+)"/) || [])[1];
    const put = u.slice(ZIVI.length);
    const ocekivan = JEZICI.find((j) => j !== "sl" && (put === "/" + j || put.startsWith("/" + j + "/"))) || "sl";
    if (lang !== ocekivan) javi("lang", u, `<html lang="${lang}">, ocekujem "${ocekivan}"`);

    // naslov i opis
    const t = ociscen((h.match(/<title>([^<]*)<\/title>/) || [])[1] || "");
    const d = ociscen((h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "");
    if (!t) javi("naslov", u, "prazan <title>");
    else {
      if (t.length > 60) javi("naslov-duzina", u, `${t.length} znakova (Google resava ~60): ${t}`);
      if (!naslovi.has(t)) naslovi.set(t, []);
      naslovi.get(t).push(u);
    }
    if (!d) javi("opis", u, "prazan description");
    else {
      if (d.length > 155) javi("opis-duzina", u, `${d.length} znakova: ${d.slice(0, 70)}…`);
      if (d.length < 70) javi("opis-kratak", u, `${d.length} znakova: ${d}`);
      if (!opisi.has(d)) opisi.set(d, []);
      opisi.get(d).push(u);
    }

    // Zaglavlje na stranoj stranici ne smije biti isto kao slovenacko.
    // Ova provjera je nastala jer je prva verzija gledala samo duzinu i
    // duplikate opisa — pa je slovenacki og:description na pet jezika
    // prosao. Nalaz B iz nezavisne revizije.
    const og = (ime) => ociscen((h.match(
      new RegExp('<meta property="og:' + ime + '" content="([^"]*)"')) || [])[1] || "");
    zaglavlja.set(put, { t, d, ogT: og("title"), ogD: og("description") });

    // canonical
    const c = (h.match(/<link rel="canonical" href="([^"]+)"\/>/) || [])[1];
    if (c !== u) javi("canonical", u, `pokazuje na ${c}`);

    // og
    if (!/property="og:locale"/.test(h)) javi("og", u, "nema og:locale");
    if (!/property="og:image"/.test(h)) javi("og", u, "nema og:image");
    if (!/property="og:image:alt"/.test(h)) javi("og", u, "nema og:image:alt");

    // JSON-LD mora biti ispravan JSON
    for (const m of h.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
      try { JSON.parse(ociscen(m[1])); }
      catch (e) { javi("json-ld", u, "neispravan JSON: " + e.message); }
    }

    const redovi = tekst(h);

    // nezamijenjeni placeholderi i spojene rijeci
    for (const red of redovi)
      if (/\{[a-zA-Z]+\}/.test(red)) javi("placeholder", u, red.slice(0, 90));

    // Kad prevod ne postoji, next-intl ispise SAM KLJUC ("lokacijaStran.nesto").
    // Gost tada vidi ime kljuca umjesto teksta. Ni provjera prevoda ni ova
    // skripta to prije nisu hvatale: kljuc ne postoji ni u slovenackom, pa
    // poredjenje jezika nema sta prijaviti. Naslo se tek okom, na /lokacije.
    for (const red of redovi) {
      const c = red.trim();
      if (/^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+)+$/.test(c) && RAZDJELJCI.has(c.split(".")[0]))
        javi("sirovi-kljuc", u, "vidljiv kljuc prevoda umjesto teksta: " + c);
    }
    const spoj = /([\p{L}\p{N}.,;:!?)”"])<!-- -->([\p{L}(„“])/gu;
    let mm; const bezSkripti = h.replace(/<script[\s\S]*?<\/script>/gi, " ");
    while ((mm = spoj.exec(bezSkripti)))
      javi("spojene-rijeci", u, bezSkripti.slice(mm.index - 30, mm.index + 40).replace(/<[^>]+>/g, ""));

    // svi unutrasnji linkovi moraju ostati u istom jeziku. Izuzetak je link
    // s atributom hrefLang: to je namjeran link na prevod (npr. "Članek je na
    // voljo tudi v jeziku: English" pod naslovom objave), ne zalutali link.
    for (const [, atributi] of h.matchAll(/<a\b([^>]*)>/g)) {
      const hm = atributi.match(/\bhref="(\/[^"#?]*)"/);
      if (!hm || /\bhrefLang="/i.test(atributi)) continue;
      const href = hm[1];
      const j = JEZICI.find((x) => x !== "sl" && (href === "/" + x || href.startsWith("/" + x + "/"))) || "sl";
      if (j !== ocekivan) javi("link-van-jezika", u, `${href} (jezik ${j})`);
    }

    if (ocekivan === "sl") straniceSl.set(put, redovi.join("\n"));
  }

  // Zaglavlje strane stranice ne smije biti doslovno slovenacko.
  // Poredimo svaku stranu adresu sa slovenackom istog tipa: putanja bez
  // jezicnog prefiksa nije ista (rute su prevedene), pa upredjujemo skup
  // svih slovenackih vrijednosti — ako se strana vrijednost nadje medju
  // njima, prevod nije stigao do zaglavlja.
  const slVrijednosti = { t: new Set(), d: new Set(), ogT: new Set(), ogD: new Set() };
  for (const [put, z] of zaglavlja)
    if (!JEZICI.some((j) => j !== "sl" && (put === "/" + j || put.startsWith("/" + j + "/"))))
      for (const k of ["t", "d", "ogT", "ogD"]) if (z[k]) slVrijednosti[k].add(z[k]);

  // Vrijednost sastavljena SAMO od imena i brojeva smije biti ista u svim
  // jezicima: og:title lokala je "Seherezada — Trubarjeva cesta 31, Ljubljana",
  // dakle marka + ulica + grad. To su cinjenice, ne tekst za prevod. Ista
  // zamka kao kod bosanskog trazioca curenja: bez ovoga bi svaki jezik dao
  // lazan alarm.
  const IMENA = ["Šeherezada", "Ljubljana", "Lubiana", "Trubarjeva", "Slovenska", "cesta"];
  const samoImena = (v) => {
    let o = v;
    for (const i of IMENA) o = o.split(i).join("");
    return !/[a-zA-ZčćšžđČĆŠŽĐöüäßşğıİâêîôûàèéìòùñ]/.test(o);
  };

  for (const [put, z] of zaglavlja) {
    const stran = JEZICI.some((j) => j !== "sl" && (put === "/" + j || put.startsWith("/" + j + "/")));
    if (!stran) continue;
    for (const [k, ime] of [["t", "<title>"], ["d", "description"],
                            ["ogT", "og:title"], ["ogD", "og:description"]])
      if (z[k] && slVrijednosti[k].has(z[k]) && !samoImena(z[k]))
        javi("zaglavlje-slovenacko", ZIVI + put, ime + " je doslovno isto kao na slovenackoj stranici: " + z[k].slice(0, 90));
  }

  // naslov i opis moraju biti jedinstveni
  for (const [t, us] of naslovi) if (us.length > 1) javi("naslov-duplikat", us.join(" , "), t);
  for (const [d, us] of opisi) if (us.length > 1) javi("opis-duplikat", us.join(" , "), d.slice(0, 60) + "…");

  // ispis
  const poVrsti = new Map();
  for (const n of nalazi) {
    if (!poVrsti.has(n.vrsta)) poVrsti.set(n.vrsta, []);
    poVrsti.get(n.vrsta).push(n);
  }
  console.log("provjereno adresa: " + adrese.length + "\n");
  if (!nalazi.length) console.log("NEMA NALAZA");
  for (const [v, lista] of poVrsti) {
    console.log("### " + v + "  (" + lista.length + ")");
    for (const n of lista.slice(0, 12)) console.log("    " + n.gdje + "\n        " + n.sto);
    if (lista.length > 12) console.log("    … i jos " + (lista.length - 12));
    console.log("");
  }
})();
