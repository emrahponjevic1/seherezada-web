"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type QRCodeStyling from "qr-code-styling";
import { sacuvajKod } from "@/app/(statistika)/_qr/akcije";
import type { Nacin } from "./shema";
import {
  KOREKCIJE,
  NAJVEC_LOGO,
  OBLIKE_OKVIRA,
  OBLIKE_SREDINE,
  OBLIKE_TACAKA,
  PREDLOSCI,
  ZADANI_STIL,
  upozorenjaStila,
  type QrStil,
} from "@/app/(statistika)/_qr/stil";
import { stilZaCrtanje } from "./logo";
import { opcijeQr } from "./opcije";
import s from "@/app/(statistika)/_qr/Statistika.module.css";

// ---------------------------------------------------------------------------
// OBLIKOVALNIK QR KODA
//
// Levo nastavitve, desno živ predogled, ki se osveži ob vsaki spremembi.
// Kod se riše v brskalniku (qr-code-styling), zato ga je mogoče prenesti v
// poljubni velikosti brez strežnika. V bazo gre samo opis izgleda.
// ---------------------------------------------------------------------------

export interface KodZaUredjivanje {
  id: number;
  slug: string;
  naziv: string;
  cilj: string;
  nacin: Nacin;
  aktivan: boolean;
  biljeska: string;
  stil: QrStil;
  /** Id strani s povezavami, na katero koda vodi. null = navaden naslov. */
  vodiNa: number | null;
}

/** Strani s povezavami, med katerimi lahko lastnik izbira odredište. */
export interface StranicaZaIzbor {
  id: number;
  slug: string;
  naziv: string;
  aktivna: boolean;
}

const VELICINE = [512, 1024, 2048, 4096];

function citajKaoDataUrl(blob: Blob) {
  return new Promise<string>((ok, ne) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => ne(r.error);
    r.readAsDataURL(blob);
  });
}

export default function QrDizajner({
  bazniUrl,
  kod,
  predlozeniSlug = "",
  stranice = [],
}: {
  bazniUrl: string;
  kod?: KodZaUredjivanje;
  predlozeniSlug?: string;
  stranice?: StranicaZaIzbor[];
}) {
  const router = useRouter();
  const [naziv, setNaziv] = useState(kod?.naziv ?? "");
  const [cilj, setCilj] = useState(kod?.vodiNa ? "" : kod?.cilj ?? "");
  const [vodiNa, setVodiNa] = useState<number | null>(kod?.vodiNa ?? null);
  const [nacin, setNacin] = useState<Nacin>(kod?.nacin ?? "mjeren");
  const [slug, setSlug] = useState(kod?.slug ?? predlozeniSlug);
  const [aktivan, setAktivan] = useState(kod?.aktivan ?? true);
  const [biljeska, setBiljeska] = useState(kod?.biljeska ?? "");
  const [stil, setStil] = useState<QrStil>({ ...ZADANI_STIL, ...kod?.stil });
  const [velicina, setVelicina] = useState(2048);
  const [greska, setGreska] = useState<string | null>(null);
  const [poruka, setPoruka] = useState<string | null>(null);
  const [cuvam, start] = useTransition();

  const pregled = useRef<HTMLDivElement>(null);
  const instanca = useRef<QRCodeStyling | null>(null);

  // Kadar koda vodi na stran s povezavami, naslova ne tipka lastnik: sestavi
  // se iz naslova te strani, da se ne moreta razíti.
  const izabranaStranica = stranice.find((x) => x.id === vodiNa) ?? null;
  const odrediste = izabranaStranica ? `${bazniUrl}/links/${izabranaStranica.slug}` : cilj.trim();

  const kratkiLink = `${bazniUrl}/q/${slug}`;
  const sadrzaj = nacin === "mjeren" ? kratkiLink : odrediste || bazniUrl;
  // Stil v nizu, da se predogled osveži ob vsaki spremembi, ne pa ob vsakem
  // izrisu komponente.
  const kljucStila = useMemo(() => JSON.stringify(stil), [stil]);

  useEffect(() => {
    let ziv = true;
    (async () => {
      // Zaobljeni logotip nastane na platnu, zato je priprava asinhrona.
      const [{ default: QR }, zaCrtanje] = await Promise.all([
        import("qr-code-styling"),
        stilZaCrtanje(JSON.parse(kljucStila) as QrStil),
      ]);
      if (!ziv || !pregled.current) return;
      // Vsakič nova slika, ne update(): knjižnica nove nastavitve ZDRUŽI s
      // starimi, zato izklopljen prelaz barv (gradient) ostane in povozi
      // izbrano barvo — pike so ostale oranžne, čeprav je bila izbrana črna.
      instanca.current = new QR(opcijeQr(zaCrtanje, sadrzaj, 240, "svg"));
      pregled.current.replaceChildren();
      instanca.current.append(pregled.current);
    })();
    return () => {
      ziv = false;
    };
  }, [kljucStila, sadrzaj]);

  const promijeni = <K extends keyof QrStil>(k: K, v: QrStil[K]) => setStil((p) => ({ ...p, [k]: v }));

  async function postaviLogo(blob: Blob) {
    setGreska(null);
    if (!/^image\/(png|jpeg|webp)$/.test(blob.type)) {
      setGreska("Logo mora biti PNG, JPG ili WebP slika.");
      return;
    }
    const url = await citajKaoDataUrl(blob);
    if (url.length > NAJVEC_LOGO) {
      setGreska("Logo je prevelik — najviše oko 300 KB. Smanji sliku pa probaj ponovo.");
      return;
    }
    // Logo prekrije del koda, zato mora biti korekcija napak visoka.
    setStil((p) => ({
      ...p,
      logo: url,
      korekcija: p.korekcija === "L" || p.korekcija === "M" ? "H" : p.korekcija,
    }));
  }

  async function logoSeherezade() {
    const odgovor = await fetch("/android-chrome-512x512.png");
    await postaviLogo(await odgovor.blob());
  }

  async function preuzmi(ekstenzija: "png" | "svg" | "jpeg" | "webp") {
    const { default: QR } = await import("qr-code-styling");
    const zaCrtanje = await stilZaCrtanje(stil);
    const qr = new QR(opcijeQr(zaCrtanje, sadrzaj, velicina, ekstenzija === "svg" ? "svg" : "canvas", ekstenzija === "jpeg"));
    await qr.download({ name: `qr-${slug || "kod"}`, extension: ekstenzija });
  }

  function sacuvaj() {
    setGreska(null);
    setPoruka(null);
    start(async () => {
      const r = await sacuvajKod({ id: kod?.id, naziv, cilj: odrediste, vodiNa, nacin, slug, aktivan, biljeska, stil });
      if ("greska" in r) {
        setGreska(r.greska);
        return;
      }
      if (kod) {
        setPoruka("Sačuvano.");
        router.refresh();
      } else {
        router.push(`/statistika/${r.id}`);
      }
    });
  }

  const upozorenja = upozorenjaStila(stil);
  const napomene: string[] = [];
  if (kod && nacin !== kod.nacin) {
    napomene.push(
      nacin === "direktan"
        ? "Mijenjaš način u „Direktno“: nova slika koda vodi pravo na odredište i skeniranja se više neće brojati. Već odštampani kodovi i dalje rade preko kratkog linka."
        : "Mijenjaš način u „S brojanjem“: brojat će se samo novi otisci. Već odštampani direktni kodovi i dalje vode pravo na odredište i ne broje se."
    );
  }
  if (kod && odrediste !== kod.cilj) {
    napomene.push(
      nacin === "mjeren"
        ? "Već odštampani kodovi će odmah nakon čuvanja voditi na novi link."
        : "Kod direktnog načina link je upisan u samu sliku — odštampani kodovi i dalje vode na stari link."
    );
  }

  return (
    <div className={s.dizajner}>
      <div className={s.dizajnerForma}>
        {/* ---- Osnovno ---- */}
        <section className={s.kartica}>
          <h3 className={s.karticaNaslov}>Osnovno</h3>

          <label className={s.polje}>
            <span className={s.oznakaPolja}>Naziv (vidiš ga samo ti)</span>
            <input
              className={s.unos}
              value={naziv}
              maxLength={80}
              onChange={(e) => setNaziv(e.target.value)}
              placeholder="npr. Google recenzija — letak na stolu"
            />
          </label>

          <fieldset className={s.nacini}>
            <legend className={s.oznakaPolja}>Odredište</legend>
            <label className={`${s.nacin} ${vodiNa === null ? s.nacinAktivan : ""}`}>
              <input
                type="radio"
                name="vrstaCilja"
                checked={vodiNa === null}
                onChange={() => setVodiNa(null)}
              />
              <span>
                <span className={s.nacinNaslov}>Vanjski link</span>
                <span className={s.nacinOpis}>Google recenzija, TripAdvisor, Instagram, meni…</span>
              </span>
            </label>
            <label
              className={`${s.nacin} ${vodiNa !== null ? s.nacinAktivan : ""}`}
              aria-disabled={stranice.length === 0}
            >
              <input
                type="radio"
                name="vrstaCilja"
                checked={vodiNa !== null}
                disabled={stranice.length === 0}
                onChange={() => setVodiNa(stranice[0]?.id ?? null)}
              />
              <span>
                <span className={s.nacinNaslov}>Moja stranica s linkovima</span>
                <span className={s.nacinOpis}>
                  {stranice.length === 0
                    ? "Još nemaš nijednu. Napravi je dugmetom „Kreiraj Linktree“ na /statistika."
                    : "Jedan kod za meni, ocjene i mreže. Sadržaj mijenjaš kad hoćeš, bez nove štampe."}
                </span>
              </span>
            </label>
          </fieldset>

          {vodiNa === null ? (
            <label className={s.polje}>
              <span className={s.oznakaPolja}>Link</span>
              <input
                className={s.unos}
                value={cilj}
                type="url"
                inputMode="url"
                onChange={(e) => setCilj(e.target.value)}
                placeholder="https://g.page/r/…/review"
              />
            </label>
          ) : (
            <label className={s.polje}>
              <span className={s.oznakaPolja}>Koja stranica</span>
              <select
                className={s.unos}
                value={String(vodiNa)}
                onChange={(e) => setVodiNa(Number(e.target.value))}
              >
                {stranice.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.naziv}
                    {st.aktivna ? "" : " — ugašena"}
                  </option>
                ))}
              </select>
              <span className={s.pomoc}>
                Vodi na {odrediste.replace(/^https?:\/\//, "")} · sadržaj uređuješ na stranici linktreeja
              </span>
            </label>
          )}

          <fieldset className={s.nacini}>
            <legend className={s.oznakaPolja}>Način</legend>
            {(
              [
                ["mjeren", "S brojanjem (preporučeno)", "QR vodi na kratki link, zabilježi skeniranje i odmah prebaci gosta na odredište. Odredište možeš kasnije promijeniti bez nove štampe."],
                ["direktan", "Direktno", "QR vodi pravo na odredište. Skeniranja se ne mogu brojati, a promjena linka traži novu štampu."],
              ] as const
            ).map(([v, naslov, opis]) => (
              <label key={v} className={`${s.nacin} ${nacin === v ? s.nacinAktivan : ""}`}>
                <input type="radio" name="nacin" value={v} checked={nacin === v} onChange={() => setNacin(v)} />
                <span>
                  <span className={s.nacinNaslov}>{naslov}</span>
                  <span className={s.nacinOpis}>{opis}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {nacin === "mjeren" && (
            <label className={s.polje}>
              <span className={s.oznakaPolja}>Kratki link</span>
              <span className={s.slugUnos}>
                <span className={s.slugPrefiks}>{bazniUrl.replace(/^https?:\/\//, "")}/q/</span>
                <input
                  className={s.unos}
                  value={slug}
                  disabled={Boolean(kod)}
                  maxLength={40}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                />
              </span>
              {kod && <span className={s.pomoc}>Kratki link se ne mijenja nakon kreiranja, da odštampani kodovi uvijek rade.</span>}
            </label>
          )}

          <label className={s.kvacica}>
            <input type="checkbox" checked={aktivan} onChange={(e) => setAktivan(e.target.checked)} />
            <span>
              Aktivan
              <span className={s.pomoc}>Pauziran kod s brojanjem vodi na naslovnicu umjesto na odredište.</span>
            </span>
          </label>

          <label className={s.polje}>
            <span className={s.oznakaPolja}>Bilješka (neobavezno)</span>
            <textarea
              className={s.unos}
              rows={2}
              maxLength={500}
              value={biljeska}
              onChange={(e) => setBiljeska(e.target.value)}
              placeholder="npr. Letak A5, 200 komada, štampano 15. 9."
            />
          </label>
        </section>

        {/* ---- Izgled ---- */}
        <section className={s.kartica}>
          <h3 className={s.karticaNaslov}>Izgled</h3>

          <div className={s.polje}>
            <span className={s.oznakaPolja}>Brzi predlošci</span>
            <div className={s.predlosci}>
              {PREDLOSCI.map((p) => (
                <button
                  key={p.naziv}
                  type="button"
                  className={s.dugmeSporedno}
                  onClick={() => setStil((st) => ({ ...st, ...p.stil, logo: st.logo }))}
                >
                  {p.naziv}
                </button>
              ))}
            </div>
          </div>

          <div className={s.red2}>
            <label className={s.polje}>
              <span className={s.oznakaPolja}>Oblik tačaka</span>
              <select className={s.unos} value={stil.oblikTacaka} onChange={(e) => promijeni("oblikTacaka", e.target.value as QrStil["oblikTacaka"])}>
                {OBLIKE_TACAKA.map(([v, t]) => (
                  <option key={v} value={v}>{t}</option>
                ))}
              </select>
            </label>
            <label className={s.polje}>
              <span className={s.oznakaPolja}>Boja tačaka</span>
              <input className={s.bojaPolje} type="color" value={stil.bojaTacaka} onChange={(e) => promijeni("bojaTacaka", e.target.value)} />
            </label>
          </div>

          <label className={s.kvacica}>
            <input type="checkbox" checked={stil.gradijent} onChange={(e) => promijeni("gradijent", e.target.checked)} />
            <span>Prelaz boja (gradijent)</span>
          </label>

          {stil.gradijent && (
            <div className={s.red3}>
              <label className={s.polje}>
                <span className={s.oznakaPolja}>Druga boja</span>
                <input className={s.bojaPolje} type="color" value={stil.bojaTacaka2} onChange={(e) => promijeni("bojaTacaka2", e.target.value)} />
              </label>
              <label className={s.polje}>
                <span className={s.oznakaPolja}>Vrsta</span>
                <select className={s.unos} value={stil.tipGradijenta} onChange={(e) => promijeni("tipGradijenta", e.target.value as QrStil["tipGradijenta"])}>
                  <option value="linear">Linearni</option>
                  <option value="radial">Kružni</option>
                </select>
              </label>
              {stil.tipGradijenta === "linear" && (
                <label className={s.polje}>
                  <span className={s.oznakaPolja}>Ugao: {stil.rotacija}°</span>
                  <input className={s.klizac} type="range" min={0} max={360} step={15} value={stil.rotacija} onChange={(e) => promijeni("rotacija", Number(e.target.value))} />
                </label>
              )}
            </div>
          )}

          <div className={s.red2}>
            <label className={s.polje}>
              <span className={s.oznakaPolja}>Oblik uglova (okvir)</span>
              <select className={s.unos} value={stil.oblikOkvira} onChange={(e) => promijeni("oblikOkvira", e.target.value as QrStil["oblikOkvira"])}>
                {OBLIKE_OKVIRA.map(([v, t]) => (
                  <option key={v} value={v}>{t}</option>
                ))}
              </select>
            </label>
            <label className={s.polje}>
              <span className={s.oznakaPolja}>Boja okvira</span>
              <input className={s.bojaPolje} type="color" value={stil.bojaOkvira} onChange={(e) => promijeni("bojaOkvira", e.target.value)} />
            </label>
          </div>

          <div className={s.red2}>
            <label className={s.polje}>
              <span className={s.oznakaPolja}>Oblik uglova (sredina)</span>
              <select className={s.unos} value={stil.oblikSredine} onChange={(e) => promijeni("oblikSredine", e.target.value as QrStil["oblikSredine"])}>
                {OBLIKE_SREDINE.map(([v, t]) => (
                  <option key={v} value={v}>{t}</option>
                ))}
              </select>
            </label>
            <label className={s.polje}>
              <span className={s.oznakaPolja}>Boja sredine</span>
              <input className={s.bojaPolje} type="color" value={stil.bojaSredine} onChange={(e) => promijeni("bojaSredine", e.target.value)} />
            </label>
          </div>

          <div className={s.red2}>
            <label className={s.polje}>
              <span className={s.oznakaPolja}>Pozadina</span>
              <input className={s.bojaPolje} type="color" value={stil.bojaPozadine} disabled={stil.providnaPozadina} onChange={(e) => promijeni("bojaPozadine", e.target.value)} />
            </label>
            <label className={s.polje}>
              <span className={s.oznakaPolja}>Rub oko koda: {stil.margina}%</span>
              <input className={s.klizac} type="range" min={0} max={20} value={stil.margina} onChange={(e) => promijeni("margina", Number(e.target.value))} />
            </label>
          </div>

          <label className={s.kvacica}>
            <input type="checkbox" checked={stil.providnaPozadina} onChange={(e) => promijeni("providnaPozadina", e.target.checked)} />
            <span>Providna pozadina (PNG, SVG, WebP)</span>
          </label>
        </section>

        {/* ---- Logo ---- */}
        <section className={s.kartica}>
          <h3 className={s.karticaNaslov}>Logo u sredini</h3>
          <div className={s.logoRed}>
            {stil.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={stil.logo} alt="" className={s.logoSlicica} style={{ borderRadius: `${stil.radijusLoga}%` }} />
            ) : (
              <span className={s.logoPrazno}>Bez loga</span>
            )}
            <div className={s.predlosci}>
              <label className={s.dugmeSporedno}>
                Učitaj sliku
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) postaviLogo(f);
                    e.target.value = "";
                  }}
                />
              </label>
              <button type="button" className={s.dugmeSporedno} onClick={logoSeherezade}>
                Logo Šeherezade
              </button>
              {stil.logo && (
                <button type="button" className={s.dugmeSporedno} onClick={() => promijeni("logo", null)}>
                  Ukloni
                </button>
              )}
            </div>
          </div>

          {stil.logo && (
            <>
              <div className={s.red2}>
                <label className={s.polje}>
                  <span className={s.oznakaPolja}>Veličina loga: {Math.round(stil.velicinaLoga * 100)}%</span>
                  <input className={s.klizac} type="range" min={10} max={50} value={Math.round(stil.velicinaLoga * 100)} onChange={(e) => promijeni("velicinaLoga", Number(e.target.value) / 100)} />
                </label>
                <label className={s.polje}>
                  <span className={s.oznakaPolja}>Razmak oko loga: {stil.marginaLoga}</span>
                  <input className={s.klizac} type="range" min={0} max={20} value={stil.marginaLoga} onChange={(e) => promijeni("marginaLoga", Number(e.target.value))} />
                </label>
              </div>
              <label className={s.polje}>
                <span className={s.oznakaPolja}>
                  Zaobljenost loga: {stil.radijusLoga === 0 ? "oštri uglovi" : stil.radijusLoga >= 50 ? "krug" : `${stil.radijusLoga}%`}
                </span>
                <input className={s.klizac} type="range" min={0} max={50} value={stil.radijusLoga} onChange={(e) => promijeni("radijusLoga", Number(e.target.value))} />
              </label>
              <label className={s.kvacica}>
                <input type="checkbox" checked={stil.sakrijTackeIzaLoga} onChange={(e) => promijeni("sakrijTackeIzaLoga", e.target.checked)} />
                <span>Ukloni tačke iza loga</span>
              </label>
            </>
          )}

          <label className={s.polje}>
            <span className={s.oznakaPolja}>Korekcija grešaka</span>
            <select className={s.unos} value={stil.korekcija} onChange={(e) => promijeni("korekcija", e.target.value as QrStil["korekcija"])}>
              {KOREKCIJE.map(([v, t]) => (
                <option key={v} value={v}>{t}</option>
              ))}
            </select>
            <span className={s.pomoc}>Veća korekcija = kod se čita i kad je dio prekriven ili oštećen, ali ima gušće tačke.</span>
          </label>
        </section>
      </div>

      {/* ---- Predogled ---- */}
      <aside className={s.dizajnerPregled}>
        <div className={s.kartica}>
          <div className={s.pregledKvadrat} style={stil.providnaPozadina ? undefined : { background: stil.bojaPozadine }}>
            <div ref={pregled} />
          </div>
          <p className={s.pregledSadrzaj} title={sadrzaj}>
            {sadrzaj}
          </p>

          {/* Na predogledu in lokalno kaže kod na začasni naslov — tak kod ne sme v tisk. */}
          {nacin === "mjeren" && !bazniUrl.startsWith("https://seherezada.net") && (
            <p className={s.info}>
              <b>Probna verzija — ne štampaj ovaj kod.</b> Vodi na privremeni link ({bazniUrl.replace(/^https?:\/\//, "")}),
              koji prestaje raditi kad se proba završi. Kodove za štampu preuzmi s prave stranice.
            </p>
          )}

          {[...upozorenja, ...napomene].map((u) => (
            <p key={u} className={s.upozorenje}>
              {u}
            </p>
          ))}

          <div className={s.preuzimanje}>
            <label className={s.polje}>
              <span className={s.oznakaPolja}>Veličina za preuzimanje</span>
              <select className={s.unos} value={velicina} onChange={(e) => setVelicina(Number(e.target.value))}>
                {VELICINE.map((v) => (
                  <option key={v} value={v}>
                    {v} × {v} px{v === 2048 ? " (štampa)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <div className={s.predlosci}>
              <button type="button" className={s.dugmeSporedno} onClick={() => preuzmi("png")}>PNG</button>
              <button type="button" className={s.dugmeSporedno} onClick={() => preuzmi("svg")}>SVG</button>
              <button type="button" className={s.dugmeSporedno} onClick={() => preuzmi("jpeg")}>JPG</button>
              <button type="button" className={s.dugmeSporedno} onClick={() => preuzmi("webp")}>WebP</button>
            </div>
            {!kod && nacin === "mjeren" && (
              <p className={s.pomoc}>Sačuvaj kod prije štampe — kratki link radi tek kad je sačuvan.</p>
            )}
          </div>

          {greska && (
            <p className={s.greska} role="alert">
              {greska}
            </p>
          )}
          {poruka && <p className={s.uspjeh}>{poruka}</p>}

          <button type="button" className={s.dugme} onClick={sacuvaj} disabled={cuvam}>
            {cuvam ? "Čuvam…" : kod ? "Sačuvaj izmjene" : "Kreiraj QR kod"}
          </button>
        </div>
      </aside>
    </div>
  );
}
