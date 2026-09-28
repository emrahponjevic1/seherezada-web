"use client";

import { useEffect } from "react";
import {
  ANALYTICS_ENABLED,
  CONSENT_EVENT,
  GA_MEASUREMENT_ID,
  readConsent,
} from "@/lib/consent";

/**
 * GOOGLE ANALYTICS (GA4)
 *
 * Skripta se naloži ŠELE, ko gost v pasici izbere „Sprejmi vse“ — nikoli
 * prej. Kdor izbere „Samo nujni“, od Googla ne naloži ničesar in piškotkov
 * `_ga` ne dobi.
 *
 * Če gost privolitev pozneje prekliče (stran /piskotki), analitiko ustavimo
 * in njene piškotke pobrišemo. Skripta sama ostane v spominu do naslednjega
 * nalaganja strani, a brez privolitve ne zapiše ničesar.
 *
 * Oglaševanja ni: Googlovi signali in personalizacija oglasov so izklopljeni.
 *
 * Poleg ogledov strani (te šteje Google sam, tudi ob prehodu med podstranmi)
 * štejemo tri klike, ki za restavracijo štejejo največ:
 *   klik_telefon — klik na telefonsko številko
 *   klik_put     — klik na „pot do nas“ (Google Maps)
 *   klik_email   — klik na e-poštni naslov
 * V GA4 jih pod Admin → Events označiš kot „key event“.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function vklopi() {
  if (window.gtag) {
    // Skripta je že naložena (gost je privolil, preklical in spet privolil).
    window.gtag("consent", "update", { analytics_storage: "granted" });
    return;
  }

  window.dataLayer = window.dataLayer || [];
  // gtag.js zahteva prav objekt `arguments`, ne navadnega seznama.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };

  window.gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  const skripta = document.createElement("script");
  skripta.async = true;
  skripta.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(skripta);
}

function izklopi() {
  if (!window.gtag) return;
  window.gtag("consent", "update", { analytics_storage: "denied" });

  // Google piškotke postavi na najvišjo domeno (.seherezada.net), zato
  // brišemo na vseh ravneh naslova, ne samo na trenutni.
  const deli = location.hostname.split(".");
  const domene = [""];
  for (let i = 0; i < deli.length - 1; i++) {
    domene.push(`; domain=.${deli.slice(i).join(".")}`);
  }
  for (const piskotek of document.cookie.split("; ")) {
    const ime = piskotek.split("=")[0];
    if (ime !== "_ga" && !ime.startsWith("_ga_")) continue;
    for (const domena of domene) {
      document.cookie = `${ime}=; path=/; max-age=0${domena}`;
    }
  }
}

/** Kateri klik je vreden štetja. null = ni med tremi, ki jih spremljamo. */
function vrstaKlika(href: string): string | null {
  if (href.startsWith("tel:")) return "klik_telefon";
  if (href.startsWith("mailto:")) return "klik_email";
  if (/google\.[a-z.]+\/maps|maps\.google\.|maps\.app\.goo\.gl|goo\.gl\/maps/.test(href)) {
    return "klik_put";
  }
  return null;
}

export default function GoogleAnalytics() {
  useEffect(() => {
    if (!ANALYTICS_ENABLED) return;

    let dovoljeno = false;
    const posodobi = () => {
      dovoljeno = readConsent()?.analytics === true;
      if (dovoljeno) vklopi();
      else izklopi();
    };
    posodobi();
    window.addEventListener(CONSENT_EVENT, posodobi);

    const obKliku = (e: MouseEvent) => {
      if (!dovoljeno || !window.gtag) return;
      const povezava = (e.target as Element | null)?.closest?.("a[href]");
      if (!povezava) return;
      const href = povezava.getAttribute("href") ?? "";
      const vrsta = vrstaKlika(href);
      if (vrsta) window.gtag("event", vrsta, { link_url: href });
    };
    document.addEventListener("click", obKliku, true);

    return () => {
      window.removeEventListener(CONSENT_EVENT, posodobi);
      document.removeEventListener("click", obKliku, true);
    };
  }, []);

  return null;
}
