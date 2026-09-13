import { UAParser } from "ua-parser-js";
import { odtisPosjetioca } from "@/app/(statistika)/_qr/sesija";

// ---------------------------------------------------------------------------
// KAJ SE ZAPIŠE OB SKENIRANJU
//
// Država, regija in mesto pridejo iz glav, ki jih Vercel doda sam (iz IP
// naslova, ki ga mi ne vidimo in ne shranimo). Lokalno teh glav ni, zato so
// polja prazna.
//
// Predogledi povezav (WhatsApp, Facebook, Telegram ...) in roboti tudi
// "odprejo" kratko povezavo, čeprav nihče ni skeniral. Zapišemo jih z
// oznako bot, v statistiki pa jih ne štejemo.
// ---------------------------------------------------------------------------

const BOT =
  /bot\b|bot\/|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|skype|slack|curl\/|wget|python|axios|node-fetch|go-http|java\/|okhttp|headless|lighthouse|pingdom|uptime|monitor/i;

const kratko = (v: string | null | undefined, n = 80) => (v ? v.slice(0, n) : null);

function dekodiraj(v: string | null) {
  if (!v) return null;
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export function podaciSkeniranja(glave: Headers) {
  const brskalnik = glave.get("user-agent") ?? "";
  const r = new UAParser(brskalnik).getResult();
  const ip =
    glave.get("x-forwarded-for")?.split(",")[0].trim() || glave.get("x-real-ip") || "";
  const dan = new Date().toISOString().slice(0, 10);

  // "sl-SI,sl;q=0.9,en;q=0.8" -> "sl-SI"
  const jezik = glave.get("accept-language")?.split(",")[0]?.split(";")[0]?.trim();

  return {
    posjetilac: odtisPosjetioca(ip, brskalnik, dan),
    bot: brskalnik === "" || BOT.test(brskalnik),
    drzava: kratko(glave.get("x-vercel-ip-country"), 2),
    regija: kratko(glave.get("x-vercel-ip-country-region"), 10),
    grad: kratko(dekodiraj(glave.get("x-vercel-ip-city"))),
    // UAParser ne vrne vrste za računalnike — prazno pomeni namizni.
    uredjaj: r.device.type ?? "desktop",
    proizvodjac: kratko(r.device.vendor),
    model: kratko(r.device.model),
    os: kratko(r.os.name),
    os_verzija: kratko(r.os.version, 20),
    preglednik: kratko(r.browser.name),
    jezik: kratko(jezik, 20),
  };
}
