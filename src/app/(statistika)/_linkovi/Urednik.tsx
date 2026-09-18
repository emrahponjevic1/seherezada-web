"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { DEFAULT_LOCALE, LOCALES, type LocaleCode } from "@/data/site";
import { LOCATIONS } from "@/data/locations";
import { obrisiStranicu, sacuvajLinktree, type DugmeUnos } from "./akcije";
import { BOJE } from "./boje";
import { IKONE, Ikona, kljucIkone, niEmoji } from "./Ikone";
import IconifyPretraga from "./IconifyPretraga";
import { PREFIKS_VANJSKI, type IkonaSvg } from "./svgCisti";
import { INTERNE_STRANI, PREDPONA, nazivInterne } from "./interniCilj";
import { caveat } from "./pisava";
import PoljeTekst from "./PoljeTekst";
import StranicaPrikaz, { type DugmePrikaz } from "./StranicaPrikaz";
import { uzmi } from "./tekst";
import type { LinkDugme, LinkStranica, Tekst } from "./tipovi";
import s from "@/app/(statistika)/_qr/Statistika.module.css";
import p from "./Panel.module.css";

// ---------------------------------------------------------------------------
// UREJEVALNIK STRANI S POVEZAVAMI
//
// Vse na enem zaslonu in en sam Spremi: stran in njeni gumbi se shranijo
// skupaj. Koraka "najprej ustvari stran, potem dodajaj gumbe" ni — lastnik
// napiše, kar hoče, pogleda predogled in shrani.
//
// Desno je isti izris, kot ga dobi gost (StranicaPrikaz), ne približek.
// ---------------------------------------------------------------------------

const OSNOVNI = DEFAULT_LOCALE.code;

type Vrsta = "vanjski" | "interno" | "tel";

interface Red {
  /** Obstojen ključ za React; id ima samo gumb, ki je že v bazi. */
  kljuc: string;
  id?: number;
  ikona: string;
  /** Crtež ikone iz pretrage; null za ikone s seznama in emoji. */
  ikonaSvg: IkonaSvg | null;
  naziv: string;
  naslovi: Tekst;
  podnaslovi: Tekst;
  cilj: string;
  boja: string;
  aktivan: boolean;
  obrisano: boolean;
  otvoreno: boolean;
}

function vrstaCilja(cilj: string): Vrsta {
  if (cilj.startsWith(PREDPONA)) return "interno";
  if (cilj.startsWith("tel:")) return "tel";
  return "vanjski";
}

function opisCilja(cilj: string) {
  const vrsta = vrstaCilja(cilj);
  if (vrsta === "interno") return `${nazivInterne(cilj)} — po jeziku gosta`;
  if (vrsta === "tel") return cilj.replace("tel:", "☎ ");
  return cilj || "još bez odredišta";
}

let brojac = 0;
const noviKljuc = () => `n${++brojac}`;

function uRed(d: LinkDugme): Red {
  return {
    kljuc: `b${d.id}`,
    id: d.id,
    ikona: d.ikona,
    ikonaSvg: d.ikona_svg ?? null,
    naziv: d.naziv,
    naslovi: d.naslovi ?? {},
    podnaslovi: d.podnaslovi ?? {},
    cilj: d.cilj,
    boja: d.boja,
    aktivan: d.aktivan,
    obrisano: false,
    otvoreno: false,
  };
}

export default function Urednik({
  bazniUrl,
  predlozeniSlug,
  stranica,
  dugmad = [],
}: {
  bazniUrl: string;
  predlozeniSlug: string;
  stranica?: LinkStranica;
  dugmad?: LinkDugme[];
}) {
  const router = useRouter();

  const [slug, setSlug] = useState(stranica?.slug ?? predlozeniSlug);
  const [naziv, setNaziv] = useState(stranica?.naziv ?? "");
  // Ime je že v logotipu, zato nova stran naslova nima; podnapis pa je tisti
  // razmaknjeni "FAST FOOD & GRILL" pod njim.
  const [naslov, setNaslov] = useState<Tekst>(stranica?.naslov ?? {});
  const [podnaslov, setPodnaslov] = useState<Tekst>(stranica?.podnaslov ?? { [OSNOVNI]: "Fast Food & Grill" });
  const [pozdrav, setPozdrav] = useState<Tekst>(stranica?.pozdrav ?? {});
  const [podnozje, setPodnozje] = useState<Tekst>(stranica?.podnozje ?? {});
  const [boja, setBoja] = useState(stranica?.boja ?? "");
  const [lokacija, setLokacija] = useState(stranica?.lokacija ?? "");
  const [glavna, setGlavna] = useState(stranica?.glavna ?? false);
  const [aktivna, setAktivna] = useState(stranica?.aktivna ?? true);
  const [redovi, setRedovi] = useState<Red[]>(() => dugmad.map(uRed));

  const [pregledJezik, setPregledJezik] = useState<LocaleCode>(OSNOVNI);
  const [greska, setGreska] = useState<string | null>(null);
  const [poruka, setPoruka] = useState<string | null>(null);
  const [cuvam, start] = useTransition();
  const [brisem, startBrisanja] = useTransition();

  const vidljivi = redovi.filter((r) => !r.obrisano);

  function promijeni(kljuc: string, zakrpa: Partial<Red>) {
    setRedovi((prev) => prev.map((r) => (r.kljuc === kljuc ? { ...r, ...zakrpa } : r)));
  }

  function dodaj() {
    setRedovi((prev) => [
      ...prev,
      {
        kljuc: noviKljuc(),
        ikona: kljucIkone("web"),
        ikonaSvg: null,
        naziv: "",
        naslovi: {},
        podnaslovi: {},
        cilj: "",
        boja: "",
        aktivan: true,
        obrisano: false,
        otvoreno: true,
      },
    ]);
  }

  function pomjeri(kljuc: string, smjer: -1 | 1) {
    setRedovi((prev) => {
      const i = prev.findIndex((r) => r.kljuc === kljuc);
      const j = i + smjer;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const kopija = [...prev];
      [kopija[i], kopija[j]] = [kopija[j], kopija[i]];
      return kopija;
    });
  }

  /** Nov gumb se odstrani takoj; obstoječi ostane prečrtan, dokler se ne shrani. */
  function ukloni(red: Red) {
    if (red.id === undefined) {
      setRedovi((prev) => prev.filter((r) => r.kljuc !== red.kljuc));
      return;
    }
    promijeni(red.kljuc, { obrisano: true, otvoreno: false });
  }

  function sacuvaj() {
    setGreska(null);
    setPoruka(null);

    // Brisanje gumba odnese tudi njegovo statistiko. To se ne sme zgoditi tiho.
    const zaBrisanje = redovi.filter((r) => r.obrisano && r.id !== undefined);
    if (zaBrisanje.length) {
      const imena = zaBrisanje.map((r) => `• ${r.naziv || "bez natpisa"}`).join("\n");
      const potvrda = window.confirm(
        `Trajno brišeš ${zaBrisanje.length} dugme/dugmadi:\n\n${imena}\n\n` +
          "Zajedno s njima nestaje i njihova statistika klikova.\n\n" +
          "Ako dugme samo privremeno skrivaš, odustani i isključi kvačicu umjesto brisanja."
      );
      if (!potvrda) return;
    }

    const zaSlanje: DugmeUnos[] = redovi
      .filter((r) => !r.obrisano)
      .map((r) => ({
        id: r.id,
        ikona: r.ikona,
        ikonaSvg: r.ikonaSvg,
        naziv: r.naziv,
        naslovi: r.naslovi,
        podnaslovi: r.podnaslovi,
        cilj: r.cilj,
        boja: r.boja,
        aktivan: r.aktivan,
      }));

    start(async () => {
      const r = await sacuvajLinktree(
        { id: stranica?.id, slug, naziv, naslov, podnaslov, pozdrav, podnozje, boja, lokacija, glavna, aktivna },
        zaSlanje
      );
      if ("greska" in r) {
        setGreska(r.greska);
        return;
      }
      if (stranica) {
        setPoruka("Sačuvano.");
        router.refresh();
      } else {
        router.push(`/statistika/linkovi/${r.id}`);
      }
    });
  }

  function obrisi() {
    if (!stranica) return;
    const potvrda = window.confirm(
      `Trajno brišeš stranicu „${stranica.naziv}“ i svih ${redovi.length} dugmadi na njoj, ` +
        "zajedno sa statistikom klikova.\n\n" +
        "QR kodovi koji vode na nju ostaju, ali će goste slati na naslovnicu dok im ne zadaš novo odredište."
    );
    if (!potvrda) return;
    startBrisanja(async () => {
      const r = await obrisiStranicu(stranica.id);
      if (r.greska) {
        setGreska(r.greska);
        return;
      }
      router.push("/statistika");
    });
  }

  // ---- Predogled: isti izris, kot ga dobi gost -----------------------------
  const zaPrikaz: DugmePrikaz[] = useMemo(
    () =>
      vidljivi
        .filter((r) => r.aktivan)
        .map((r) => ({
          kljuc: r.kljuc,
          ikona: r.ikona,
          svg: r.ikonaSvg,
          natpis: uzmi(r.naslovi, pregledJezik) || r.naziv || "Natpis dugmeta",
          podnatpis: uzmi(r.podnaslovi, pregledJezik),
          href: "#",
          boja: r.boja,
        })),
    [vidljivi, pregledJezik]
  );

  const poslovalnica = LOCATIONS.find((l) => l.id === lokacija);
  const javniNaslov = `${bazniUrl}/links/${slug}`;

  return (
    <div className={s.dizajner}>
      <div className={s.dizajnerForma}>
        {/* ---- Osnovno ---- */}
        <section className={s.kartica}>
          <h3 className={s.karticaNaslov}>Osnovno</h3>

          <label className={s.polje}>
            <span className={s.oznakaPolja}>Interno ime (vidiš ga samo ti)</span>
            <input
              className={s.unos}
              value={naziv}
              maxLength={80}
              onChange={(e) => setNaziv(e.target.value)}
              placeholder="npr. Stol Trubarjeva"
            />
          </label>

          <label className={s.polje}>
            <span className={s.oznakaPolja}>Adresa stranice</span>
            <span className={s.slugUnos}>
              <span className={s.slugPrefiks}>{bazniUrl.replace(/^https?:\/\//, "")}/links/</span>
              <input
                className={s.unos}
                value={slug}
                maxLength={40}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              />
            </span>
            {stranica && (
              <span className={s.pomoc}>
                Ako promijeniš adresu, QR kodovi koji vode ovamo popravljaju se sami — statistika ostaje.
              </span>
            )}
          </label>

          <PoljeTekst
            oznaka="Naslov (neobavezno)"
            vrijednost={naslov}
            naPromjenu={setNaslov}
            placeholder="npr. TRUBARJEVA 31"
            najvec={60}
            pomoc="Ime je već u logotipu — ovdje dolazi samo ako treba dodatak, npr. koji lokal."
          />
          <PoljeTekst
            oznaka="Podnaslov"
            vrijednost={podnaslov}
            naPromjenu={setPodnaslov}
            placeholder="Fast Food & Grill"
            najvec={80}
          />
          <PoljeTekst
            oznaka="Pozdrav (neobavezno)"
            vrijednost={pozdrav}
            naPromjenu={setPozdrav}
            placeholder="👋 Dobrodošli!"
          />
          <PoljeTekst
            oznaka="Slogan na dnu (neobavezno)"
            vrijednost={podnozje}
            naPromjenu={setPodnozje}
            placeholder="Uvijek svježe, uvijek ukusno!"
            redova={2}
            najvec={200}
            pomoc="Ispisuje se rukopisnim slovima, kao na dnu stranice."
          />

          <div className={s.polje}>
            <span className={s.oznakaPolja}>Boja pozadine</span>
            <div className={p.boje}>
              <button
                type="button"
                className={`${p.boja} ${p.bojaPrazna} ${boja === "" ? p.bojaAktivna : ""}`}
                onClick={() => setBoja("")}
              >
                zadana
              </button>
              {BOJE.map((b) => (
                <button
                  key={b.boja}
                  type="button"
                  title={b.naziv}
                  aria-label={b.naziv}
                  className={`${p.boja} ${boja === b.boja ? p.bojaAktivna : ""}`}
                  style={{ background: b.boja }}
                  onClick={() => setBoja(b.boja)}
                />
              ))}
            </div>
          </div>

          <label className={s.polje}>
            <span className={s.oznakaPolja}>Značka Otvoreno / Zatvoreno</span>
            <select className={s.unos} value={lokacija} onChange={(e) => setLokacija(e.target.value)}>
              <option value="">Bez značke</option>
              {LOCATIONS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} — {l.fullAddress}
                </option>
              ))}
            </select>
            <span className={s.pomoc}>
              Računa se u telefonu gosta prema radnom vremenu iz podataka o lokalu, pa nikad ne kasni.
            </span>
          </label>

          <label className={s.kvacica}>
            <input type="checkbox" checked={aktivna} onChange={(e) => setAktivna(e.target.checked)} />
            <span>
              Aktivna
              <span className={s.pomoc}>Ugašena stranica šalje gosta na naslovnicu umjesto na grešku.</span>
            </span>
          </label>

          <label className={s.kvacica}>
            <input type="checkbox" checked={glavna} onChange={(e) => setGlavna(e.target.checked)} />
            <span>
              Glavna
              <span className={s.pomoc}>
                Ako neko upiše samo {bazniUrl.replace(/^https?:\/\//, "")}/links, bez ičega poslije, otvara mu se
                ova stranica. Glavna može biti samo jedna — kad označiš drugu, s ove se skida sama.
              </span>
            </span>
          </label>
        </section>

        {/* ---- Dugmad ---- */}
        <section className={s.kartica}>
          <div className={s.karticaGlava}>
            <h3 className={s.karticaNaslov}>Dugmad ({vidljivi.length})</h3>
            <button type="button" className={s.dugmeSporedno} onClick={dodaj}>
              + Dodaj dugme
            </button>
          </div>

          {redovi.length === 0 ? (
            <p className={s.prazno}>Još nema nijednog dugmeta. Dodaj prvo — npr. „Meni & cijene“.</p>
          ) : (
            <ul className={p.redovi}>
              {redovi.map((r, i) => {
                const vrsta = vrstaCilja(r.cilj);
                return (
                  <li key={r.kljuc} className={`${p.red} ${r.obrisano ? p.redObrisan : ""}`}>
                    <div className={p.redGlava}>
                      <span className={p.strelice}>
                        <button
                          type="button"
                          className={p.strelica}
                          onClick={() => pomjeri(r.kljuc, -1)}
                          disabled={i === 0 || r.obrisano}
                          aria-label="Pomjeri gore"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          className={p.strelica}
                          onClick={() => pomjeri(r.kljuc, 1)}
                          disabled={i === redovi.length - 1 || r.obrisano}
                          aria-label="Pomjeri dolje"
                        >
                          ▼
                        </button>
                      </span>

                      <span className={p.redIkona} aria-hidden="true">
                        <Ikona ime={r.ikona} svg={r.ikonaSvg} velicina={20} />
                      </span>

                      <span className={p.redInfo}>
                        <span className={p.redNatpis}>{r.naziv || "Bez natpisa"}</span>
                        <span className={p.redCilj}>{opisCilja(r.cilj)}</span>
                      </span>

                      <span className={p.redAlati}>
                        {r.obrisano ? (
                          <button
                            type="button"
                            className={p.alat}
                            onClick={() => promijeni(r.kljuc, { obrisano: false })}
                          >
                            Vrati
                          </button>
                        ) : (
                          <>
                            <input
                              type="checkbox"
                              checked={r.aktivan}
                              onChange={(e) => promijeni(r.kljuc, { aktivan: e.target.checked })}
                              aria-label={`Prikaži „${r.naziv || "dugme"}“ gostu`}
                              title="Prikaži gostu"
                            />
                            <button
                              type="button"
                              className={p.alat}
                              onClick={() => promijeni(r.kljuc, { otvoreno: !r.otvoreno })}
                              aria-expanded={r.otvoreno}
                              aria-label="Uredi dugme"
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              className={`${p.alat} ${p.alatOpasan}`}
                              onClick={() => ukloni(r)}
                              aria-label="Obriši dugme"
                            >
                              🗑
                            </button>
                          </>
                        )}
                      </span>
                    </div>

                    {r.otvoreno && !r.obrisano && (
                      <div className={p.redTijelo}>
                        <div className={s.polje}>
                          <span className={s.oznakaPolja}>Ikona</span>
                          <div className={p.ikone}>
                            {IKONE.map((i) => {
                              const kljuc = kljucIkone(i.kljuc);
                              return (
                                <button
                                  key={i.kljuc}
                                  type="button"
                                  title={i.naziv}
                                  aria-label={i.naziv}
                                  aria-pressed={r.ikona === kljuc}
                                  className={`${p.ikonaIzbor} ${r.ikona === kljuc ? p.ikonaAktivna : ""}`}
                                  onClick={() => promijeni(r.kljuc, { ikona: kljuc, ikonaSvg: null })}
                                >
                                  <Ikona ime={kljuc} velicina={22} />
                                </button>
                              );
                            })}
                          </div>
                          <label className={p.emojiRed}>
                            <span className={s.pomoc}>Ili upiši svoj emoji:</span>
                            <input
                              className={s.unos}
                              value={niEmoji(r.ikona) ? "" : r.ikona}
                              maxLength={8}
                              placeholder="emoji"
                              onChange={(e) => promijeni(r.kljuc, { ikona: e.target.value, ikonaSvg: null })}
                            />
                          </label>

                          <IconifyPretraga
                            odabrano={r.ikona}
                            naOdabir={(ikona, svg) => promijeni(r.kljuc, { ikona, ikonaSvg: svg })}
                          />
                          {r.ikona.startsWith(PREFIKS_VANJSKI) && (
                            <span className={p.izabranaIkona}>
                              <Ikona ime={r.ikona} svg={r.ikonaSvg} velicina={20} />
                              Izabrano iz pretrage: {r.ikona.slice(PREFIKS_VANJSKI.length)}
                            </span>
                          )}
                        </div>

                        <label className={s.polje}>
                          <span className={s.oznakaPolja}>Natpis</span>
                          <input
                            className={s.unos}
                            value={r.naziv}
                            maxLength={80}
                            placeholder="npr. Meni & cijene"
                            onChange={(e) => promijeni(r.kljuc, { naziv: e.target.value })}
                          />
                        </label>

                        <PoljeTekst
                          oznaka="Natpis — prijevodi"
                          vrijednost={r.naslovi}
                          naPromjenu={(t) => promijeni(r.kljuc, { naslovi: t })}
                          placeholder={r.naziv}
                          najvec={80}
                          pomoc="Ostavi prazno da vrijedi natpis odozgo."
                        />

                        <PoljeTekst
                          oznaka="Podnatpis (neobavezno)"
                          vrijednost={r.podnaslovi}
                          naPromjenu={(t) => promijeni(r.kljuc, { podnaslovi: t })}
                          placeholder="npr. Sve što nudimo"
                        />

                        <label className={s.polje}>
                          <span className={s.oznakaPolja}>Vodi na</span>
                          <select
                            className={s.unos}
                            value={vrsta}
                            onChange={(e) => {
                              const v = e.target.value as Vrsta;
                              promijeni(r.kljuc, {
                                cilj: v === "interno" ? `${PREDPONA}/meni` : v === "tel" ? "tel:" : "",
                              });
                            }}
                          >
                            <option value="vanjski">Vanjski link (Google, Instagram, TikTok…)</option>
                            <option value="interno">Stranica našeg sajta (po jeziku gosta)</option>
                            <option value="tel">Telefonski poziv</option>
                          </select>
                        </label>

                        {vrsta === "interno" && (
                          <label className={s.polje}>
                            <span className={s.oznakaPolja}>Koja stranica</span>
                            <select
                              className={s.unos}
                              value={r.cilj}
                              onChange={(e) => promijeni(r.kljuc, { cilj: e.target.value })}
                            >
                              {INTERNE_STRANI.map((st) => (
                                <option key={st.pot} value={`${PREDPONA}${st.pot}`}>
                                  {st.naziv}
                                </option>
                              ))}
                            </select>
                            <span className={s.pomoc}>
                              Nijemac ide na njemačku verziju, Turčin na tursku — automatski.
                            </span>
                          </label>
                        )}

                        {vrsta === "tel" && (
                          <label className={s.polje}>
                            <span className={s.oznakaPolja}>Broj telefona</span>
                            <input
                              className={s.unos}
                              type="tel"
                              inputMode="tel"
                              value={r.cilj.replace("tel:", "")}
                              placeholder="+386 69 314 316"
                              onChange={(e) => promijeni(r.kljuc, { cilj: `tel:${e.target.value.trim()}` })}
                            />
                          </label>
                        )}

                        {vrsta === "vanjski" && (
                          <label className={s.polje}>
                            <span className={s.oznakaPolja}>Link</span>
                            <input
                              className={s.unos}
                              type="url"
                              inputMode="url"
                              value={r.cilj}
                              placeholder="https://www.instagram.com/seherezada_si/"
                              onChange={(e) => promijeni(r.kljuc, { cilj: e.target.value })}
                            />
                          </label>
                        )}

                        <div className={s.polje}>
                          <span className={s.oznakaPolja}>Boja ikone i strelice</span>
                          <div className={p.boje}>
                            <button
                              type="button"
                              className={`${p.boja} ${p.bojaPrazna} ${r.boja === "" ? p.bojaAktivna : ""}`}
                              onClick={() => promijeni(r.kljuc, { boja: "" })}
                            >
                              tamna
                            </button>
                            {BOJE.map((b) => (
                              <button
                                key={b.boja}
                                type="button"
                                title={b.naziv}
                                aria-label={b.naziv}
                                className={`${p.boja} ${r.boja === b.boja ? p.bojaAktivna : ""}`}
                                style={{ background: b.boja }}
                                onClick={() => promijeni(r.kljuc, { boja: b.boja })}
                              />
                            ))}
                          </div>
                        </div>

                        {r.id !== undefined && (
                          <span className={s.pomoc}>
                            Klikovi na ovo dugme:{" "}
                            <a href={`/statistika/${r.id}`} className={s.kodNaziv}>
                              otvori statistiku ↗
                            </a>
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {greska && <p className={s.greska}>{greska}</p>}
        {poruka && <p className={s.uspjeh}>{poruka}</p>}

        <div className={s.preuzimanje}>
          <button type="button" className={s.dugme} onClick={sacuvaj} disabled={cuvam || brisem}>
            {cuvam ? "Čuvam…" : stranica ? "Sačuvaj promjene" : "Spremi stranicu"}
          </button>
          {stranica && (
            <a href={javniNaslov} target="_blank" rel="noreferrer" className={s.dugmeSporedno}>
              Otvori stranicu ↗
            </a>
          )}
        </div>

        {stranica && (
          <section className={s.kartica}>
            <h3 className={s.karticaNaslov}>Brisanje</h3>
            <p className={s.pomoc}>
              Briše stranicu, sva dugmad i njihovu statistiku. QR kodovi koji vode ovamo ostaju i vode na naslovnicu.
            </p>
            <button type="button" className={s.dugmeOpasno} onClick={obrisi} disabled={brisem || cuvam}>
              {brisem ? "Brišem…" : "Obriši stranicu"}
            </button>
          </section>
        )}
      </div>

      {/* ---- Živi predogled ---- */}
      <aside className={s.dizajnerPregled}>
        {/* caveat.variable samo tu: slogan v predogledu mora biti v isti pisavi
            kot pri gostu, ostala nadzorna plošča pa te pisave ne rabi. */}
        <div className={`${p.telefon} ${caveat.variable}`}>
          <div className={p.telefonGlava}>
            <span className={p.telefonNaslov}>Kako vidi gost</span>
            <span>klikni jezik u pregledu</span>
          </div>
          <StranicaPrikaz
            naslov={uzmi(naslov, pregledJezik)}
            podnaslov={uzmi(podnaslov, pregledJezik)}
            pozdrav={uzmi(pozdrav, pregledJezik)}
            podnozje={uzmi(podnozje, pregledJezik)}
            boja={boja}
            hours={poslovalnica?.hours ?? null}
            jezik={pregledJezik}
            dugmad={zaPrikaz}
            jezici={LOCALES.map((l) => ({
              kod: l.code,
              short: l.short,
              href: "#",
              aktivan: l.code === pregledJezik,
            }))}
            naJezik={(kod) => setPregledJezik(kod as LocaleCode)}
            pregled
            praznoOpis="Dodaj dugme pa će se pojaviti ovdje."
          />
        </div>
        <p className={s.pomoc} style={{ marginTop: "0.5rem" }}>
          {zaPrikaz.length} vidljivih dugmadi
        </p>
      </aside>
    </div>
  );
}
