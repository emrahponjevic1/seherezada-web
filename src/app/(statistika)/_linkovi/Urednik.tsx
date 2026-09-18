"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { DEFAULT_LOCALE, LOCALES, type LocaleCode } from "@/data/site";
import { LOCATIONS } from "@/data/locations";
import {
  IkonaKanta,
  IkonaOlovka,
  IkonaPlus,
  IkonaRucka,
  IkonaStrelica,
  IkonaVanjski,
} from "@/app/(statistika)/_qr/IkonePanela";
import { obrisiStranicu, sacuvajLinktree, type DugmeUnos } from "./akcije";
import { BOJE, ZADANA_BOJA, prelivStranice } from "./boje";
import IconifyPretraga from "./IconifyPretraga";
import { IKONE, Ikona, kljucIkone, niEmoji } from "./Ikone";
import { INTERNE_STRANI, PREDPONA, nazivInterne } from "./interniCilj";
import { caveat } from "./pisava";
import PoljeTekst from "./PoljeTekst";
import StranicaPrikaz, { type DugmePrikaz } from "./StranicaPrikaz";
import { PREFIKS_VANJSKI, type IkonaSvg } from "./svgCisti";
import { uzmi } from "./tekst";
import type { LinkDugme, LinkStranica, Tekst } from "./tipovi";
import s from "@/app/(statistika)/_qr/Statistika.module.css";
import p from "./Panel.module.css";
import u from "./Urednik.module.css";

// ---------------------------------------------------------------------------
// UREJEVALNIK STRANI S POVEZAVAMI — po vzoru Linktree admina
//
// Levo trije zavihki:
//   Dugmad    gumbi kot kartice; vlečeš jih za ročko (miška, prst ali
//             puščici na tipkovnici), vklopiš s stikalom, urediš na mestu
//   Izgled    barva, besedila, značka
//   Postavke  ime, naslov strani, aktivna / glavna, brisanje
// Desno telefon, ki ves čas stoji na mestu — isti izris, kot ga dobi gost.
//
// Vse se shrani skupaj, enim Spremi. Vrstica z zavihki in Spremi je lepljiva,
// zato je gumb vedno pri roki; pokaže tudi, ali so spremembe neshranjene.
// ---------------------------------------------------------------------------

const OSNOVNI = DEFAULT_LOCALE.code;

type Vrsta = "vanjski" | "interno" | "tel";
type Zavihek = "dugmad" | "izgled" | "postavke";

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
  if (vrsta === "tel") return cilj.replace("tel:", "☎ ") || "☎";
  return cilj.replace(/^https?:\/\//, "") || "još bez odredišta";
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

/** Stikalo vklop / izklop. */
function Prekidac({
  ukljuceno,
  naPromjenu,
  oznaka,
}: {
  ukljuceno: boolean;
  naPromjenu: (v: boolean) => void;
  oznaka: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ukljuceno}
      aria-label={oznaka}
      title={oznaka}
      className={`${u.prekidac} ${ukljuceno ? u.prekidacUkljucen : ""}`}
      onClick={() => naPromjenu(!ukljuceno)}
    />
  );
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

  const [zavihek, setZavihek] = useState<Zavihek>("dugmad");
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
  const [sacuvanoPrije, setSacuvanoPrije] = useState(false);
  const [cuvam, start] = useTransition();
  const [brisem, startBrisanja] = useTransition();

  // ---- Neshranjene spremembe --------------------------------------------------
  // Posnetek vsega, kar se shrani. Primerjava s posnetkom ob zadnjem
  // shranjevanju pove, ali je kaj novega — brez posebnega sledenja po poljih.
  const posnetek = JSON.stringify({
    slug, naziv, naslov, podnaslov, pozdrav, podnozje, boja, lokacija, glavna, aktivna,
    redovi: redovi.map(({ kljuc: _k, otvoreno: _o, ...r }) => r),
  });
  const [shranjen, setShranjen] = useState(posnetek);
  const izmjene = posnetek !== shranjen;

  // Brskalnik opozori, preden lastnik zapre ali osveži stran z neshranjenim delom.
  useEffect(() => {
    if (!izmjene) return;
    const opozori = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", opozori);
    return () => window.removeEventListener("beforeunload", opozori);
  }, [izmjene]);

  const vidljivi = redovi.filter((r) => !r.obrisano);

  function promijeni(kljuc: string, zakrpa: Partial<Red>) {
    setSacuvanoPrije(false);
    setRedovi((prev) => prev.map((r) => (r.kljuc === kljuc ? { ...r, ...zakrpa } : r)));
  }

  function dodaj() {
    setZavihek("dugmad");
    setRedovi((prev) => [
      // Nov gumb pride na vrh in odprt — kot pri Linktreeju.
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
      ...prev.map((r) => ({ ...r, otvoreno: false })),
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

  // ---- Vlečenje za ročko ------------------------------------------------------
  // Kazalčni dogodki delujejo enako za miško in prst. Mesto kartice je število
  // DRUGIH kartic, katerih sredina je nad kazalcem — ne zamenjava s sosedom.
  // Zamenjava s sosedom je pri hitrem potegu preskakovala: dogodkov je manj,
  // kot je kartic, in kartica je obtičala mesto ali dve prekratko.
  const [vuce, setVuce] = useState<string | null>(null);
  const kartice = useRef(new Map<string, HTMLLIElement>());
  const redoviRef = useRef(redovi);
  redoviRef.current = redovi;

  /** Mesto, kamor spada vlečena kartica, glede na višino kazalca. */
  function premjestiNa(kljuc: string, y: number) {
    const trenutni = redoviRef.current;
    const i = trenutni.findIndex((r) => r.kljuc === kljuc);
    if (i < 0) return;
    const ostali = trenutni.filter((r) => r.kljuc !== kljuc);
    let cilj = 0;
    for (const r of ostali) {
      const okvir = kartice.current.get(r.kljuc)?.getBoundingClientRect();
      if (okvir && y > okvir.top + okvir.height / 2) cilj++;
    }
    if (cilj === i) return;
    const nov = [...ostali];
    nov.splice(cilj, 0, trenutni[i]);
    redoviRef.current = nov;
    setRedovi(nov);
  }

  // Poteg poslušamo na oknu, ne na ročki: ko React karto premakne v DOM-u, jo
  // za hip vzame iz dokumenta in ročka izgubi zajem kazalca — poteg bi obstal
  // po enem mestu.
  function pocniVuci(e: React.PointerEvent<HTMLButtonElement>, kljuc: string) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    setVuce(kljuc);
    const id = e.pointerId;
    const premik = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      ev.preventDefault();
      premjestiNa(kljuc, ev.clientY);
    };
    const konec = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      setVuce(null);
      window.removeEventListener("pointermove", premik);
      window.removeEventListener("pointerup", konec);
      window.removeEventListener("pointercancel", konec);
    };
    window.addEventListener("pointermove", premik, { passive: false });
    window.addEventListener("pointerup", konec);
    window.addEventListener("pointercancel", konec);
  }

  // ---- Spremi -----------------------------------------------------------------
  function sacuvaj() {
    setGreska(null);

    if (!naziv.trim()) {
      setZavihek("postavke");
      setGreska("Upiši interno ime stranice, npr. „Stol Trubarjeva“.");
      return;
    }

    // Brisanje gumba odnese tudi njegovo statistiko. To se ne sme zgoditi tiho.
    const zaBrisanje = redovi.filter((r) => r.obrisano && r.id !== undefined);
    if (zaBrisanje.length) {
      const imena = zaBrisanje.map((r) => `• ${r.naziv || "bez natpisa"}`).join("\n");
      const potvrda = window.confirm(
        `Trajno brišeš ${zaBrisanje.length} dugme/dugmadi:\n\n${imena}\n\n` +
          "Zajedno s njima nestaje i njihova statistika klikova.\n\n" +
          "Ako dugme samo privremeno skrivaš, odustani i isključi prekidač umjesto brisanja."
      );
      if (!potvrda) return;
    }

    const zaSlanje: DugmeUnos[] = vidljivi.map((r) => ({
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
      if (!stranica) {
        router.push(`/statistika/linkovi/${r.id}`);
        return;
      }
      // Novi gumbi zdaj imajo id — vpišemo ga, sicer bi jih naslednji Spremi
      // izbrisal in ustvaril znova (nova kratka povezava, izgubljeni kliki).
      const noviRedovi = vidljivi.map((red, i) => ({ ...red, id: r.dugmad[i] ?? red.id }));
      setRedovi(noviRedovi);
      setShranjen(
        JSON.stringify({
          slug, naziv, naslov, podnaslov, pozdrav, podnozje, boja, lokacija, glavna, aktivna,
          redovi: noviRedovi.map(({ kljuc: _k, otvoreno: _o, ...x }) => x),
        })
      );
      setSacuvanoPrije(true);
      router.refresh();
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
      router.push("/statistika/linkovi");
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
  const domena = bazniUrl.replace(/^https?:\/\//, "");
  const javniNaslov = `${bazniUrl}/links/${slug}`;

  const oznakaStanja = cuvam
    ? null
    : izmjene
      ? { tekst: "Nesačuvane izmjene", klasa: u.stanjeIzmjene }
      : sacuvanoPrije
        ? { tekst: "Sačuvano", klasa: u.stanjeSacuvano }
        : null;

  return (
    <div className={u.urednik}>
      <div className={u.radno}>
        {/* ---- Zavihki in Spremi ---- */}
        <div className={u.traka}>
          <div className={u.tabovi} role="tablist" aria-label="Uređivanje stranice">
            {(
              [
                ["dugmad", "Dugmad"],
                ["izgled", "Izgled"],
                ["postavke", "Postavke"],
              ] as const
            ).map(([k, t]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={zavihek === k}
                className={`${u.tab} ${zavihek === k ? u.tabAktivan : ""}`}
                onClick={() => setZavihek(k)}
              >
                {t}
                {k === "dugmad" && <span className={u.tabBroj}>{vidljivi.length}</span>}
              </button>
            ))}
          </div>
          <div className={u.trakaDesno}>
            {oznakaStanja && <span className={`${u.stanje} ${oznakaStanja.klasa}`}>{oznakaStanja.tekst}</span>}
            <button type="button" className={s.dugme} onClick={sacuvaj} disabled={cuvam || brisem}>
              {cuvam ? "Čuvam…" : stranica ? "Sačuvaj" : "Kreiraj stranicu"}
            </button>
          </div>
        </div>

        {greska && (
          <p className={s.greska} role="alert">
            {greska}
          </p>
        )}

        {/* ================= DUGMAD ================= */}
        {zavihek === "dugmad" && (
          <>
            <button type="button" className={u.dodaj} onClick={dodaj}>
              <IkonaPlus velicina={20} />
              Dodaj dugme
            </button>

            {redovi.length === 0 ? (
              <div className={u.prazno}>
                <b>Još nema nijednog dugmeta.</b>
                <span>Dodaj prvo — npr. „Meni & cijene“ ili „Ocijenite nas“.</span>
              </div>
            ) : (
              <ul className={u.lista}>
                {redovi.map((r) => {
                  const vrsta = vrstaCilja(r.cilj);
                  return (
                    <li
                      key={r.kljuc}
                      ref={(el) => {
                        if (el) kartice.current.set(r.kljuc, el);
                        else kartice.current.delete(r.kljuc);
                      }}
                      className={[
                        u.karta,
                        r.otvoreno ? u.kartaOtvorena : "",
                        vuce === r.kljuc ? u.vuce : "",
                        r.obrisano ? u.obrisana : "",
                        !r.aktivan && !r.obrisano ? u.kartaUgasena : "",
                      ].join(" ")}
                    >
                      <div className={u.kartaGlava}>
                        <button
                          type="button"
                          className={u.rucka}
                          aria-label={`Pomjeri „${r.naziv || "dugme"}“ — povuci ili strelicama gore i dolje`}
                          disabled={r.obrisano}
                          onPointerDown={(e) => pocniVuci(e, r.kljuc)}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowUp") {
                              e.preventDefault();
                              pomjeri(r.kljuc, -1);
                            } else if (e.key === "ArrowDown") {
                              e.preventDefault();
                              pomjeri(r.kljuc, 1);
                            }
                          }}
                        >
                          <IkonaRucka />
                        </button>

                        <span className={u.kartaIkona} aria-hidden="true">
                          <Ikona ime={r.ikona} svg={r.ikonaSvg} velicina={20} />
                        </span>

                        <button
                          type="button"
                          className={u.kartaInfo}
                          onClick={() => !r.obrisano && promijeni(r.kljuc, { otvoreno: !r.otvoreno })}
                          aria-expanded={r.otvoreno}
                        >
                          <span className={`${u.kartaNatpis} ${r.naziv ? "" : u.kartaNatpisPrazan}`}>
                            {r.naziv || "Novo dugme — upiši natpis"}
                          </span>
                          <span className={u.kartaCilj}>{opisCilja(r.cilj)}</span>
                        </button>

                        <span className={u.kartaAlati}>
                          {r.obrisano ? (
                            <button
                              type="button"
                              className={s.dugmeSporedno}
                              style={{ minHeight: 36, padding: "0.3rem 0.8rem" }}
                              onClick={() => promijeni(r.kljuc, { obrisano: false })}
                            >
                              Vrati
                            </button>
                          ) : (
                            <>
                              <Prekidac
                                ukljuceno={r.aktivan}
                                naPromjenu={(v) => promijeni(r.kljuc, { aktivan: v })}
                                oznaka={r.aktivan ? "Vidljivo gostu — klikni da sakriješ" : "Sakriveno — klikni da prikažeš"}
                              />
                              <button
                                type="button"
                                className={`${u.alat} ${r.otvoreno ? u.alatAktivan : ""}`}
                                onClick={() => promijeni(r.kljuc, { otvoreno: !r.otvoreno })}
                                aria-expanded={r.otvoreno}
                                aria-label="Uredi dugme"
                              >
                                <IkonaOlovka velicina={18} />
                              </button>
                              <button
                                type="button"
                                className={`${u.alat} ${u.alatOpasan}`}
                                onClick={() => ukloni(r)}
                                aria-label="Obriši dugme"
                              >
                                <IkonaKanta velicina={18} />
                              </button>
                            </>
                          )}
                        </span>
                      </div>

                      {r.otvoreno && !r.obrisano && (
                        <div className={u.kartaTijelo}>
                          <label className={s.polje}>
                            <span className={s.oznakaPolja}>Natpis</span>
                            <input
                              className={s.unos}
                              value={r.naziv}
                              maxLength={80}
                              placeholder="npr. Meni & cijene"
                              autoFocus={!r.naziv}
                              onChange={(e) => promijeni(r.kljuc, { naziv: e.target.value })}
                            />
                          </label>

                          <PoljeTekst
                            oznaka="Podnatpis (neobavezno)"
                            vrijednost={r.podnaslovi}
                            naPromjenu={(t) => promijeni(r.kljuc, { podnaslovi: t })}
                            placeholder="npr. Sve što nudimo"
                          />

                          <div className={u.odjeljak}>
                            <span className={u.odjeljakNaslov}>Vodi na</span>
                            <div className={u.vrste} role="radiogroup" aria-label="Vrsta odredišta">
                              {(
                                [
                                  ["vanjski", "Link"],
                                  ["interno", "Stranica sajta"],
                                  ["tel", "Poziv"],
                                ] as const
                              ).map(([v, t]) => (
                                <button
                                  key={v}
                                  type="button"
                                  role="radio"
                                  aria-checked={vrsta === v}
                                  className={`${u.vrsta} ${vrsta === v ? u.vrstaAktivna : ""}`}
                                  onClick={() =>
                                    vrsta !== v &&
                                    promijeni(r.kljuc, {
                                      cilj: v === "interno" ? `${PREDPONA}/meni` : v === "tel" ? "tel:" : "",
                                    })
                                  }
                                >
                                  {t}
                                </button>
                              ))}
                            </div>

                            {vrsta === "vanjski" && (
                              <input
                                className={s.unos}
                                type="url"
                                inputMode="url"
                                value={r.cilj}
                                placeholder="https://www.instagram.com/seherezada_si/"
                                aria-label="Link"
                                onChange={(e) => promijeni(r.kljuc, { cilj: e.target.value })}
                              />
                            )}
                            {vrsta === "interno" && (
                              <>
                                <select
                                  className={s.unos}
                                  value={r.cilj}
                                  aria-label="Koja stranica"
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
                              </>
                            )}
                            {vrsta === "tel" && (
                              <input
                                className={s.unos}
                                type="tel"
                                inputMode="tel"
                                value={r.cilj.replace("tel:", "")}
                                placeholder="+386 69 314 316"
                                aria-label="Broj telefona"
                                onChange={(e) => promijeni(r.kljuc, { cilj: `tel:${e.target.value.trim()}` })}
                              />
                            )}
                          </div>

                          <div className={u.odjeljak}>
                            <span className={u.odjeljakNaslov}>Ikona</span>
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
                          </div>

                          <div className={u.odjeljak}>
                            <span className={u.odjeljakNaslov}>Boja ikone i strelice</span>
                            <div className={u.krugovi}>
                              <button
                                type="button"
                                title="Tamna (zadana)"
                                aria-label="Tamna (zadana)"
                                className={`${u.krug} ${r.boja === "" ? u.krugAktivan : ""}`}
                                style={{ background: "#1c1917" }}
                                onClick={() => promijeni(r.kljuc, { boja: "" })}
                              />
                              {BOJE.filter((b) => b.boja !== "#1c1917").map((b) => (
                                <button
                                  key={b.boja}
                                  type="button"
                                  title={b.naziv}
                                  aria-label={b.naziv}
                                  className={`${u.krug} ${r.boja === b.boja ? u.krugAktivan : ""}`}
                                  style={{ background: b.boja }}
                                  onClick={() => promijeni(r.kljuc, { boja: b.boja })}
                                />
                              ))}
                            </div>
                          </div>

                          <PoljeTekst
                            oznaka="Natpis na drugim jezicima"
                            vrijednost={r.naslovi}
                            naPromjenu={(t) => promijeni(r.kljuc, { naslovi: t })}
                            placeholder={r.naziv}
                            najvec={80}
                            pomoc="Ostavi prazno da vrijedi natpis odozgo."
                          />

                          {r.id !== undefined && (
                            <a href={`/statistika/${r.id}`} className={u.statLink}>
                              Statistika klikova ovog dugmeta <IkonaStrelica velicina={14} />
                            </a>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {/* ================= IZGLED ================= */}
        {zavihek === "izgled" && (
          <>
            <section className={s.kartica}>
              <h3 className={s.karticaNaslov}>Boja pozadine</h3>
              <div className={u.boje}>
                {BOJE.map((b) => {
                  const preliv = prelivStranice(b.boja);
                  const izabrana = (boja || ZADANA_BOJA) === b.boja;
                  return (
                    <button
                      key={b.boja}
                      type="button"
                      aria-pressed={izabrana}
                      className={`${u.boja} ${izabrana ? u.bojaAktivna : ""}`}
                      onClick={() => setBoja(b.boja === ZADANA_BOJA ? "" : b.boja)}
                    >
                      <span
                        className={u.bojaUzorak}
                        style={{ "--gore": preliv.gore, "--dolje": preliv.dolje } as React.CSSProperties}
                      />
                      {b.naziv}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className={s.kartica}>
              <h3 className={s.karticaNaslov}>Tekstovi</h3>
              <PoljeTekst
                oznaka="Podnaslov ispod logotipa"
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
                pomoc="Ispisuje se rukopisnim slovima na dnu ekrana."
              />
              <PoljeTekst
                oznaka="Naslov (neobavezno)"
                vrijednost={naslov}
                naPromjenu={setNaslov}
                placeholder="npr. TRUBARJEVA 31"
                najvec={60}
                pomoc="Ime je već u logotipu — ovdje samo ako treba dodatak, npr. koji lokal."
              />
            </section>

            <section className={s.kartica}>
              <h3 className={s.karticaNaslov}>Značka Otvoreno / Zatvoreno</h3>
              <select className={s.unos} value={lokacija} onChange={(e) => setLokacija(e.target.value)}>
                <option value="">Bez značke</option>
                {LOCATIONS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} — {l.fullAddress}
                  </option>
                ))}
              </select>
              <span className={s.pomoc}>
                Računa se u telefonu gosta prema radnom vremenu lokala, pa nikad ne kasni.
              </span>
            </section>
          </>
        )}

        {/* ================= POSTAVKE ================= */}
        {zavihek === "postavke" && (
          <>
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
                  autoFocus={!naziv}
                />
              </label>
              <label className={s.polje}>
                <span className={s.oznakaPolja}>Adresa stranice</span>
                <span className={s.slugUnos}>
                  <span className={s.slugPrefiks}>{domena}/links/</span>
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
            </section>

            <section className={s.kartica}>
              <div className={u.postavka}>
                <span className={u.postavkaTekst}>
                  <span className={u.postavkaNaslov}>Aktivna</span>
                  <span className={s.pomoc}>Ugašena stranica šalje gosta na naslovnicu umjesto na grešku.</span>
                </span>
                <Prekidac ukljuceno={aktivna} naPromjenu={setAktivna} oznaka="Aktivna" />
              </div>
              <div className={u.postavka}>
                <span className={u.postavkaTekst}>
                  <span className={u.postavkaNaslov}>Glavna</span>
                  <span className={s.pomoc}>
                    Ako neko upiše samo {domena}/links, bez ičega poslije, otvara mu se ova stranica. Glavna može
                    biti samo jedna.
                  </span>
                </span>
                <Prekidac ukljuceno={glavna} naPromjenu={setGlavna} oznaka="Glavna" />
              </div>
            </section>

            {stranica && (
              <section className={`${s.kartica} ${u.opasno}`}>
                <h3 className={s.karticaNaslov}>Brisanje</h3>
                <p className={s.pomoc}>
                  Briše stranicu, sva dugmad i njihovu statistiku. QR kodovi koji vode ovamo ostaju i vode na
                  naslovnicu.
                </p>
                <div>
                  <button type="button" className={s.dugmeOpasno} onClick={obrisi} disabled={brisem || cuvam}>
                    {brisem ? "Brišem…" : "Obriši stranicu"}
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* ---- Telefon ---- */}
      <aside className={u.pregled}>
        {/* caveat.variable samo tu: slogan v predogledu mora biti v isti pisavi
            kot pri gostu, ostala nadzorna plošča pa te pisave ne rabi. */}
        <div className={`${u.telefon} ${caveat.variable}`}>
          <span className={u.telefonIzrez} aria-hidden="true" />
          <div className={u.telefonEkran}>
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
        </div>
        <div className={u.pregledDno}>
          <span>Pregled uživo · klikni jezik gore</span>
          {stranica && (
            <a href={javniNaslov} target="_blank" rel="noreferrer">
              Otvori <IkonaVanjski velicina={14} />
            </a>
          )}
        </div>
      </aside>
    </div>
  );
}
