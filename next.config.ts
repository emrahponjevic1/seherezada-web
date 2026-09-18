import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // GitHub Pages je opuščen: ni več workflowa, basePath in statičnega izvoza.
  //
  // output: "export" je odstranjen.
  //
  // Statični izvoz zahteva, da ima vsaka dinamična pot vsaj eno stran.
  // Ker trenutno ni nobene objave, /blog/[slug] ne more obstajati.
  // Prav tako izvoz ne podpira middleware, preusmeritev in optimizacije slik —
  // torej natanko tega, kar potrebujemo za večjezičnost in hitrost.
  //
  // Naslednji korak: gostovanje na Vercelu (glej Fazo 3 v načrtu).
  allowedDevOrigins: ["192.168.1.88", "localhost:3001", "192.168.1.88:3001"],
  images: {
    // unoptimized je bil potreben samo zaradi statičnega izvoza.
    // Zdaj Next slike sam pretvori v AVIF/WebP in jih postreže v pravi velikosti.
    formats: ["image/avif", "image/webp"],
    // remotePatterns je prazen namenoma: dokler je med njimi stal
    // images.unsplash.com, je lahko /_next/image prek naše domene stregel
    // katerokoli sliko s tistega naslova. Ostanek iz časa, ko so bile na
    // strani tuje fotografije; nobena se ne uporablja več. Odkrito v
    // neodvisni reviziji (6E.3).
    remotePatterns: [],
  },

  /**
   * VARNOSTNE GLAVE
   *
   * Ni SEO, je pa red za stran s kontaktnim obrazcem. Vercel sam doda HSTS,
   * ostalega ne. Prej ni bilo nobene (6E.4).
   *
   *   X-Content-Type-Options  brskalnik ne sme ugibati vrste datoteke
   *   Referrer-Policy         tuja stran ne izve, s katere poti je gost prišel
   *   X-Frame-Options         strani ne more nihče vgraditi v svoj okvir
   *   Permissions-Policy      izklopi naprave, ki jih ne uporabljamo
   *
   * Content-Security-Policy namenoma NI: vgrajeni Googlov zemljevid in
   * next/font zahtevata natančno napisano pravilo, ki ga je treba preizkusiti
   * na živi domeni. Napačno napisan CSP tiho polomi stran.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },

      /**
       * STATISTIKA IN KRATKE POVEZAVE QR KOD — NIKOLI V ISKALNIK
       *
       * X-Robots-Tag velja za Google, Bing in AI pajke, tudi za odgovore, ki
       * niso HTML (preusmeritve, CSV). V robots.txt teh poti namenoma NI:
       * Disallow bi pajku prepovedal prebrati to glavo.
       *
       * no-referrer: tuja stran ob kliku iz statistike ne izve njenega naslova.
       * Vse o tem: src/app/(statistika)/README.md
       */
      {
        source: "/statistika/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
      {
        source: "/q/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },

      /**
       * STRANI S POVEZAVAMI — NE V ISKALNIK, A POVEZAVAM SLEDI
       *
       * Vsebina podvaja prave strani spletišča (meni, lokacije, ocene). Če bi
       * jo Google indeksiral, bi si stran s povezavami in prave strani med
       * seboj jemale mesto v zadetkih.
       *
       * "follow" je namerno: pajek naj povezave vseeno prehodi. Referrer tu
       * tudi ne skrivamo — Instagramu in TripAdvisorju je prav, da vidita, da
       * je gost prišel z naše strani.
       */
      {
        source: "/links",
        headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
      },
      {
        source: "/links/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
      },
    ];
  },
};

// Vklopi next-intl. Brez tega ovoja Next ne najde src/i18n/request.ts
// in besedila se ne naložijo.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
