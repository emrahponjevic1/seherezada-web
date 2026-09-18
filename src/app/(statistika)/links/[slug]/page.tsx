import { headers } from "next/headers";
import { LOCALES, SITE_URL } from "@/data/site";
import { LOCATIONS } from "@/data/locations";
import { imaBazu } from "@/app/(statistika)/_qr/baza";
import StranicaPrikaz, { type DugmePrikaz } from "@/app/(statistika)/_linkovi/StranicaPrikaz";
import { jezikGosta, uzmi } from "@/app/(statistika)/_linkovi/tekst";
import { pripraviQrTabele } from "@/app/(statistika)/_qr/shema";
import { stranicaPoSlugu, vidljivaDugmad } from "@/app/(statistika)/_linkovi/upiti";
import type { LinkDugme, LinkStranica } from "@/app/(statistika)/_linkovi/tipovi";

// ---------------------------------------------------------------------------
// STRAN S POVEZAVAMI — TO VIDI GOST
//
// Gost skenira eno kodo na mizi in pristane tu: meni, ocene, omrežja, vse na
// enem mestu. Vsebino ureja lastnik na /statistika, zato odtisnjene kode nikoli
// ni treba zamenjati.
//
// Vsak gumb vodi na /q/<slug>, ne naravnost na cilj — tako se klik prešteje in
// lastnik vidi, kaj goste res zanima.
//
// Stran se izriše ob vsaki zahtevi: jezik beremo iz glave telefona, zato je
// predpomnjena različica ne more biti pravilna za vse.
// ---------------------------------------------------------------------------

export const dynamic = "force-dynamic";

/**
 * Kadar strani ni ali baza ni dosegljiva, gost NE sme videti napake. Dobi
 * kartico z imenom in povezavo na spletišče — natisnjena nalepka mora vedno
 * pripeljati nekam koristnemu.
 */
function Rezerva({ jezik }: { jezik: ReturnType<typeof jezikGosta> }) {
  return (
    <StranicaPrikaz
      naslov="ŠEHEREZADA"
      podnaslov="Fast Food & Grill"
      pozdrav=""
      podnozje="Ljubljana"
      boja=""
      hours={null}
      jezik={jezik}
      dugmad={[
        {
          kljuc: "spletisce",
          ikona: "🌐",
          natpis: "seherezada.net",
          podnatpis: "",
          href: SITE_URL,
          boja: "",
        },
      ]}
    />
  );
}

export default async function StranicaSaLinkovima({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ jezik?: string }>;
}) {
  const [{ slug }, { jezik: trazeni }, zaglavlja] = await Promise.all([params, searchParams, headers()]);
  const jezik = jezikGosta(zaglavlja.get("accept-language"), trazeni);

  let stranica: LinkStranica | null = null;
  let dugmad: readonly LinkDugme[] = [];
  try {
    if (imaBazu()) {
      await pripraviQrTabele();
      stranica = await stranicaPoSlugu(slug);
      if (stranica) dugmad = await vidljivaDugmad(stranica.id);
    }
  } catch (e) {
    console.error("LINKTREE: strani ni bilo mogoče prebrati", e);
  }

  if (!stranica) return <Rezerva jezik={jezik} />;

  const lokacija = LOCATIONS.find((l) => l.id === stranica.lokacija);

  const zaPrikaz: DugmePrikaz[] = dugmad.map((d) => ({
    kljuc: String(d.id),
    ikona: d.ikona,
    svg: d.ikona_svg,
    // Napis v jeziku gosta; če prevoda ni, ostane osnovni napis.
    natpis: uzmi(d.naslovi, jezik) || d.naziv,
    podnatpis: uzmi(d.podnaslovi, jezik),
    // Klik gre skozi kratko povezavo, da se prešteje.
    href: `/q/${d.slug}`,
    boja: d.boja,
  }));

  const jezici = LOCALES.map((l) => ({
    kod: l.code,
    short: l.short,
    href: `/links/${stranica.slug}?jezik=${l.code}`,
    aktivan: l.code === jezik,
  }));

  return (
    <div lang={jezik}>
      <StranicaPrikaz
        naslov={uzmi(stranica.naslov, jezik)}
        podnaslov={uzmi(stranica.podnaslov, jezik)}
        pozdrav={uzmi(stranica.pozdrav, jezik)}
        podnozje={uzmi(stranica.podnozje, jezik)}
        boja={stranica.boja}
        hours={lokacija?.hours ?? null}
        jezik={jezik}
        dugmad={zaPrikaz}
        jezici={jezici}
      />
    </div>
  );
}
