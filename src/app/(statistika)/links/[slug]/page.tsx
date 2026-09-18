import type { Metadata } from "next";
import { headers } from "next/headers";
import { cache } from "react";
import { LOCALES, SHARE_IMAGE, SITE_NAME, SITE_URL } from "@/data/site";
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

/**
 * Stran in njeni gumbi — enkrat na zahtevo. Berejo jih tako oznake za deljenje
 * (generateMetadata) kot sama stran; cache() poskrbi, da gre v bazo samo
 * prvi, drugi dobi isti rezultat.
 */
const naloziStranicu = cache(async (slug: string) => {
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
  return { stranica, dugmad };
});

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ jezik?: string }>;
};

/**
 * PREDOGLED OB DELJENJU (WhatsApp, Viber, Messenger, Facebook)
 *
 * Brez oznak og: je WhatsApp pokazal samo ikono spletišča. Zdaj dobi veliko
 * sliko znamke (ista kot pri naslovni strani), naslov z naslovom lokala in v
 * opisu napise gumbov — prejemnik takoj vidi, kaj ga čaka za povezavo.
 *
 * Robot za predogled jezika navadno ne pošlje, zato dobi privzeti jezik;
 * povezava s ?jezik=en da angleški predogled.
 */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, { jezik: trazeni }, zaglavlja] = await Promise.all([params, searchParams, headers()]);
  const jezik = jezikGosta(zaglavlja.get("accept-language"), trazeni);
  const { stranica, dugmad } = await naloziStranicu(slug);

  const lokacija = stranica ? LOCATIONS.find((l) => l.id === stranica.lokacija) : undefined;
  const naslov = lokacija
    ? `${lokacija.name} · ${lokacija.street}, ${lokacija.city}`
    : `${SITE_NAME} · ${(stranica && uzmi(stranica.podnaslov, jezik)) || "Fast Food & Grill"}`;

  const napisi = dugmad.map((d) => uzmi(d.naslovi, jezik) || d.naziv).filter(Boolean);
  const opis =
    napisi.join(" · ") ||
    (stranica && (uzmi(stranica.podnozje, jezik) || uzmi(stranica.podnaslov, jezik))) ||
    "seherezada.net";

  const slika = { url: SHARE_IMAGE.src, width: SHARE_IMAGE.width, height: SHARE_IMAGE.height, alt: SITE_NAME };
  const og = LOCALES.find((l) => l.code === jezik)?.og;

  return {
    title: naslov,
    description: opis,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: og,
      url: `/links/${stranica?.slug ?? slug}`,
      title: naslov,
      description: opis,
      images: [slika],
    },
    twitter: { card: "summary_large_image", title: naslov, description: opis, images: [slika] },
  };
}

export default async function StranicaSaLinkovima({ params, searchParams }: Props) {
  const [{ slug }, { jezik: trazeni }, zaglavlja] = await Promise.all([params, searchParams, headers()]);
  const jezik = jezikGosta(zaglavlja.get("accept-language"), trazeni);

  const { stranica, dugmad } = await naloziStranicu(slug);

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
