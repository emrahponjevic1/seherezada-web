import type { QrStil } from "./stil";

// ---------------------------------------------------------------------------
// ZAOBLJENI VOGALI LOGOTIPA
//
// Knjižnica qr-code-styling logotip samo nariše, oblike mu ne more dati. Zato
// ga tu prerišemo na platno z zaobljenim robom in dobimo novo sliko (PNG, ker
// mora biti okoli vogalov prosojno).
//
// V bazo gre vedno IZVIRNA slika in številka zaobljenosti posebej, zato se da
// polmer kadarkoli spremeniti — tudi nazaj na oster vogal.
//
// Teče samo v brskalniku: platno (canvas) na strežniku ne obstaja. Vsi trije
// izrisi (predogled, sličice v seznamu, prenos datoteke) gredo skozi tukajšnjo
// pripravo, da je prenesena slika enaka predogledu.
// ---------------------------------------------------------------------------

/** Isti logotip z istim polmerom se prerisuje enkrat, ne ob vsakem izrisu. */
const spomin = new Map<string, Promise<string>>();

function zaobliPot(risalnik: CanvasRenderingContext2D, w: number, h: number, r: number) {
  // roundRect ima Chrome 99+ in Safari 16+; starejši telefoni dobijo isto pot
  // ročno, da logotip nikjer ne ostane oster, kadar je izbrana zaobljenost.
  if (typeof risalnik.roundRect === "function") {
    risalnik.roundRect(0, 0, w, h, r);
    return;
  }
  risalnik.moveTo(r, 0);
  risalnik.arcTo(w, 0, w, h, r);
  risalnik.arcTo(w, h, 0, h, r);
  risalnik.arcTo(0, h, 0, 0, r);
  risalnik.arcTo(0, 0, w, 0, r);
}

async function prerisi(logo: string, radijus: number): Promise<string> {
  const slika = new Image();
  slika.decoding = "async";
  await new Promise<void>((uspelo, padlo) => {
    slika.onload = () => uspelo();
    slika.onerror = () => padlo(new Error("logotipa ni bilo mogoče prebrati"));
    slika.src = logo;
  });

  const w = slika.naturalWidth;
  const h = slika.naturalHeight;
  const platno = document.createElement("canvas");
  platno.width = w;
  platno.height = h;
  const risalnik = platno.getContext("2d");
  if (!risalnik) return logo;

  // Odstotek krajše stranice: 50 % je krog (oziroma elipsa pri podolgovati sliki).
  const r = (Math.min(w, h) * radijus) / 100;
  risalnik.beginPath();
  zaobliPot(risalnik, w, h, r);
  risalnik.closePath();
  risalnik.clip();
  risalnik.drawImage(slika, 0, 0);
  return platno.toDataURL("image/png");
}

/**
 * Stil, pripravljen za izris: enak kot shranjeni, le logotip ima zaobljene
 * vogale. Če kaj ne uspe, ostane izvirna slika — kod se mora izrisati vedno.
 */
export async function stilZaCrtanje(stil: QrStil): Promise<QrStil> {
  if (!stil.logo || stil.radijusLoga <= 0) return stil;

  const kljuc = `${stil.radijusLoga}|${stil.logo.length}|${stil.logo.slice(-64)}`;
  let delo = spomin.get(kljuc);
  if (!delo) {
    delo = prerisi(stil.logo, stil.radijusLoga);
    spomin.set(kljuc, delo);
  }

  try {
    return { ...stil, logo: await delo };
  } catch {
    spomin.delete(kljuc);
    return stil;
  }
}
