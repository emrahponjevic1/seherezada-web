// ---------------------------------------------------------------------------
// BLOG OBJAVE — EDINI VIR
//
// ===========================================================================
//  KAKO DODAM OBJAVO?
//
//  1. Kopiraj blok med /* ZAČETEK PREDLOGE */ in /* KONEC PREDLOGE */
//  2. Prilepi ga med oglate oklepaje BLOG_POSTS spodaj
//  3. Zamenjaj besedilo
//  4. Shrani. Objava dobi svojo stran na /blog/<slug>
//
//  SLUG = naslov v naslovu strani
//  slug: "kje-jesti-na-studentske-bone"  ->  seherezada.net/blog/kje-jesti-na-studentske-bone
//
//  Pravila za slug:
//    • samo male črke, številke in vezaji
//    • brez šumnikov: "č" -> "c", "š" -> "s", "ž" -> "z"
//    • kratko in razumljivo, 3–6 besed
//    • ko je objava enkrat javna, sluga NE spreminjaj — povezave se pokvarijo
//
//  PREVOD
//  Objava obstaja samo v jezikih, ki jih ima. Slovenščina je obvezna,
//  druge jezike dodaš pod `prevodi` (glej objavo spodaj). Jezika brez
//  prevoda ni v sitemapu in njegova stran vrne 404.
//
//  KAKO ODSTRANIM OBJAVO?
//  Izbriši njen blok. Če ne ostane nobena, stran /blog sama pokaže,
//  da objav še ni.
// ===========================================================================
//
// Prejšnja različica je vsebovala šest izmišljenih objav — z izmišljenimi
// avtorji, fotografijami s spleta in trditvami o opremi, ki je nimamo.
// Odstranjene so.
// ---------------------------------------------------------------------------

import type { LocaleCode } from "./site";

export type BlogCategorySlug =
  | "kulinarka"
  | "pekarna"
  | "vegi"
  | "boni"
  | "tradicija"
  | "kakovost";

/** Vse, kar se v objavi prevaja. */
export interface BlogText {
  /**
   * Slug v tem jeziku: /en/blog/cheap-eats-ljubljana. Brez njega prevod
   * prevzame slovenskega. Pravila so ista kot za slovenski slug.
   */
  slug?: string;
  title: string;
  /**
   * Naslov za zavihek in Google, če je `title` predolg. Google reže pri
   * ~60 znakih, predloga "{naslov} | Šeherezada Ljubljana" pa jih doda 23.
   * Zapiši ga celega, s "| Šeherezada" na koncu.
   */
  metaTitle?: string;
  /** Dva stavka. Uporabi se kot opis v Googlu — naj bo do ~150 znakov. */
  excerpt: string;
  category: string;
  /** Datum za bralca, npr. "14. avgust 2026" */
  date: string;
  /** npr. "4 min branja" */
  readTime: string;
  author: {
    name: string;
    role: string;
  };
  imageCaption: string;
  /**
   * Besedilo objave. Uporabljaj <p>, <h2>, <ul><li>, <strong>, <a>.
   * Povezave na naše strani piši v jeziku besedila: /meni v slovenskem,
   * /en/menu v angleškem.
   */
  contentHtml: string;
}

export interface BlogPost extends BlogText {
  /** Del naslova strani: /blog/<slug>. Male črke in vezaji, brez šumnikov. */
  slug: string;
  categorySlug: BlogCategorySlug;
  /** Isti datum v obliki YYYY-MM-DD — za Google. */
  isoDate: string;
  /**
   * Pot do slike v mapi /public, npr. "/images/doner-kebab.jpg".
   * JPEG 1200 × 630: ista slika gre tudi v predogled povezave na Facebooku
   * in WhatsAppu, ki AVIF ne znata prebrati.
   */
  coverImage: string;
  /**
   * Avtor slike, ki ni naša. Licence Creative Commons dovolijo uporabo samo,
   * če ob sliki piše avtor, vir in licenca — in da smo sliko spremenili.
   */
  coverCredit?: {
    author: string;
    /** Stran slike, npr. na Wikimedia Commons. */
    source: string;
    license: string;
    licenseUrl: string;
    /** Ali smo sliko obrezali ali spremenili. */
    modified?: boolean;
  };
  /** Prikaži veliko na vrhu arhiva. Samo ena objava naj ima true. */
  isFeatured?: boolean;
  /**
   * Prevodi. Slovenščina je zgoraj; tu so samo drugi jeziki.
   *
   * Jezika, ki ga tu ni, objava NIMA: stran /de/blog/<slug> vrne 404, v
   * sitemapu in hreflangu je ni. Prej je vsaka objava obstajala v vseh šestih
   * jezikih s slovenskim besedilom — Google bi na angleški strani dobil
   * slovenski članek in hreflang, ki trdi, da je angleški.
   */
  prevodi?: Partial<Record<Exclude<LocaleCode, "sl">, BlogText>>;
}

export interface BlogCategoryFilter {
  id: "vse" | BlogCategorySlug;
  label: string;
}

export const BLOG_CATEGORIES: BlogCategoryFilter[] = [
  { id: "vse", label: "Vse objave" },
  { id: "kulinarka", label: "Kulinarične zgodbe" },
  { id: "pekarna", label: "Pekarna & testo" },
  { id: "vegi", label: "Vegi & vegan" },
  { id: "boni", label: "Študentska prehrana" },
  { id: "tradicija", label: "Tradicija & sladice" },
  { id: "kakovost", label: "Kakovost & halal" },
];

/*  ZAČETEK PREDLOGE — kopiraj od tu

  {
    slug: "kje-jesti-na-studentske-bone",
    title: "Kje jesti na študentske bone v Ljubljani",
    excerpt:
      "Kako deluje študentski bon, koliko je doplačilo in kaj vse dobiš za 2,55 € pri nas.",
    category: "Študentska prehrana",
    categorySlug: "boni",
    date: "1. september 2026",
    isoDate: "2026-09-01",
    readTime: "4 min branja",
    author: { name: "Ekipa Šeherezada", role: "Šeherezada Ljubljana" },
    coverImage: "/images/seherezada-student-meal.avif",
    imageCaption: "Študentski meni z doplačilom 2,55 €.",
    contentHtml: `
      <p>Prvi odstavek objave.</p>

      <h2>Vmesni naslov</h2>
      <p>Naslednji odstavek.</p>

      <ul>
        <li>Prva točka</li>
        <li>Druga točka</li>
      </ul>
    `,
    isFeatured: true,
  },

    KONEC PREDLOGE — kopiraj do tu  */

export const BLOG_POSTS: BlogPost[] = [
  // Podatki o drugih lokalih: Visit Ljubljana in uradne strani lokalov,
  // preverjeno 21. 9. 2026. Cen drugih lokalov namenoma ne navajamo — ne
  // moremo jih sproti preverjati, napačna cena tujega lokala pa bi bila
  // naša napaka.
  {
    slug: "poceni-hrana-ljubljana",
    title: "Poceni hrana v Ljubljani: kje v centru dobro ješ za malo denarja",
    metaTitle: "Poceni hrana v Ljubljani: kje dobro ješ | Šeherezada",
    excerpt:
      "Burek, kranjska klobasa, kebab in tržnica: kje v centru Ljubljane dobro ješ za nekaj evrov, tudi po polnoči. Preverjeno septembra 2026.",
    category: "Vodnik po Ljubljani",
    categorySlug: "kulinarka",
    date: "21. september 2026",
    isoDate: "2026-09-21",
    readTime: "4 min branja",
    author: { name: "Ekipa Šeherezada", role: "Šeherezada Ljubljana" },
    // Slika po izbiri lastnika (21. 9. 2026).
    coverImage: "/images/seherezada-blog-tromostovje.jpg",
    imageCaption:
      "Ljubljanica s Tromostovjem in Frančiškansko cerkvijo, tri minute od Šeherezade na Trubarjevi.",
    isFeatured: true,
    contentHtml: `
      <p>V središču Ljubljane lahko še vedno dobro ješ za nekaj evrov, če veš, kam iti. Zbrali smo mesta od bureka ob treh zjutraj do kranjske klobase in tržnice.</p>
      <p>Da ne bo pomote: Šeherezada je naš lokal, zato je na seznamu prva. Drugi lokali z nami niso povezani. Delovne čase smo preverili septembra 2026, pred obiskom pa jih vseeno preverite na Googlu.</p>

      <h2>Na hitro</h2>
      <ul>
        <li><strong>Kebab, falafel, halal:</strong> Šeherezada, Trubarjeva 31 in Slovenska 55</li>
        <li><strong>Burek ob katerikoli uri:</strong> Burek Olimpija in Nobel burek, oba odprta 24 ur</li>
        <li><strong>Slovenski okusi:</strong> Klobasarna in Druga violina</li>
        <li><strong>Kruh, sadje in zelenjava:</strong> pekarna Hleb'c in Osrednja ljubljanska tržnica</li>
      </ul>

      <h2>Šeherezada: halal kebab in falafel pozno v noč</h2>
      <p>Na Trubarjevi cesti smo od leta 1998. Döner kebab stane 6,00 €, zelenjavni kebab 4,00 €, falafel v lepinji 7,00 €, en sam falafel pa 1,00 €. Lepinjo spečemo sproti, vse meso je halal, na meniju pa je tudi 7 veganskih jedi.</p>
      <ul>
        <li><a href="/lokacije/trubarjeva-31">Trubarjeva 31</a>, 3 minute od Prešernovega trga: vsak dan 09:00–02:00, v petek in soboto do 03:00</li>
        <li><a href="/lokacije/slovenska-55">Slovenska 55</a>, pri Bavarskem dvoru: vsak dan 08:00–01:00</li>
        <li>Za študente: 19 jedi na bon, doplačilo 2,55 €</li>
      </ul>
      <p><a href="/meni">Celoten meni s cenami</a></p>

      <h2>Burek Olimpija: burek 24 ur na dan</h2>
      <p>Ena najbolj znanih prodajaln bureka v Ljubljani. Burek z mesom, sirom ali jabolki, posebej znani pa so po pizza bureku. Za nekaj evrov se najeste do sitega.</p>
      <p><strong>Slovenska cesta 58</strong> · odprto 24 ur</p>

      <h2>Nobel burek: klasika na Miklošičevi</h2>
      <p>Burek z mesom ali sirom in kos pice, ob vsaki uri dneva in noči.</p>
      <p><strong>Miklošičeva cesta 30</strong> · odprto 24 ur</p>

      <h2>Klobasarna: kranjska klobasa za s seboj</h2>
      <p>Kranjska klobasa s svežo kajzerico, gorčico in hrenom, v nekdanji urarski delavnici. Poleg klobase imajo tudi štruklje in ričet.</p>
      <p><strong>Ciril-Metodov trg 15</strong> · pon–sob 10:00–23:00, ned 10:00–15:00</p>

      <h2>Druga violina: slovenske jedi na Starem trgu</h2>
      <p>Goveja juha, kranjska klobasa, telečji ragu in sezonske jedi. Druga violina je socialno podjetje, v katerem strežejo tudi osebe s posebnimi potrebami.</p>
      <p><strong>Stari trg 21</strong> · tor–ned 08:00–24:00</p>

      <h2>Pekarna Hleb'c: kruh na Trubarjevi</h2>
      <p>Majhna pekarna na naši ulici, kjer kruh hitro poide. Delovni čas pred obiskom preverite na njihovem Instagramu @hlebcljubljana.</p>
      <p><strong>Trubarjeva cesta 13</strong></p>

      <h2>Osrednja ljubljanska tržnica: sadje in zelenjava od kmetov</h2>
      <p>Na tržnici na Vodnikovem in Pogačarjevem trgu kupite sezonsko sadje in zelenjavo neposredno od pridelovalcev. Odprta je od ponedeljka do sobote, najbolj živahna pa je dopoldne.</p>

      <h2>Kako v Ljubljani prihraniš</h2>
      <ul>
        <li><strong>Voda iz pipe je pitna.</strong> Po mestu so tudi javni pitniki, zato plastenke ne potrebujete.</li>
        <li><strong>Dnevna kosila.</strong> Veliko restavracij med tednom ponuja dnevno kosilo ali malico po nižji ceni.</li>
        <li><strong>Študentski boni.</strong> Če študirate v Sloveniji, z bonom plačate le doplačilo. Pri nas je to 2,55 € za glavno jed, solato, jabolko in pijačo. <a href="/studentski-boni">Kako deluje bon</a></li>
        <li><strong>Ponoči.</strong> Po polnoči so v centru odprti predvsem lokali s hitro hrano. Burek Olimpija in Nobel burek delata 24 ur, Šeherezada na Trubarjevi pa do 02:00, ob petkih in sobotah do 03:00.</li>
      </ul>
    `,
    prevodi: {
      en: {
        slug: "cheap-eats-ljubljana",
        title: "Cheap eats in Ljubljana: where to eat well on a budget",
        metaTitle: "Cheap Eats in Ljubljana: Where to Eat | Šeherezada",
        excerpt:
          "Burek, Carniolan sausage, kebab and the market: where to eat well for a few euros in central Ljubljana, even after midnight.",
        category: "Ljubljana guide",
        date: "21 September 2026",
        readTime: "4 min read",
        author: { name: "The Šeherezada team", role: "Šeherezada Ljubljana" },
        imageCaption:
          "The Ljubljanica with the Triple Bridge and the Franciscan Church, three minutes from Šeherezada on Trubarjeva.",
        contentHtml: `
          <p>You can still eat well in central Ljubljana for a few euros, if you know where to go. Here are our picks, from burek at 3 am to Carniolan sausage and the central market.</p>
          <p>To be clear: Šeherezada is our own place, which is why it comes first. The other places on this list have nothing to do with us. We checked opening hours in September 2026, but please double-check on Google before you go.</p>

          <h2>Quick picks</h2>
          <ul>
            <li><strong>Kebab, falafel, halal:</strong> Šeherezada, Trubarjeva 31 and Slovenska 55</li>
            <li><strong>Burek at any hour:</strong> Burek Olimpija and Nobel Burek, both open 24 hours</li>
            <li><strong>Slovenian flavours:</strong> Klobasarna and Druga violina</li>
            <li><strong>Bread, fruit and veg:</strong> Hleb'c bakery and the Ljubljana Central Market</li>
          </ul>

          <h2>Šeherezada: halal kebab and falafel, open late</h2>
          <p>We've been on Trubarjeva Street since 1998. A döner kebab costs €6.00, a veggie kebab €4.00, falafel in flatbread €7.00 and a single falafel €1.00. Our flatbread is baked to order, all our meat is halal, and there are 7 vegan dishes on the menu.</p>
          <ul>
            <li><a href="/en/locations/trubarjeva-31">Trubarjeva 31</a>, 3 minutes from Prešeren Square: daily 9 am – 2 am, Fridays and Saturdays until 3 am</li>
            <li><a href="/en/locations/slovenska-55">Slovenska 55</a>, next to Bavarski dvor: daily 8 am – 1 am</li>
            <li>Students in Slovenia: 19 dishes on student meal vouchers, €2.55 top-up</li>
          </ul>
          <p><a href="/en/menu">Full menu with prices</a></p>

          <h2>Burek Olimpija: burek around the clock</h2>
          <p>One of the best-known burek shops in Ljubljana. Burek with meat, cheese or apple, and they're especially known for their pizza burek. A few euros gets you a filling meal.</p>
          <p><strong>Slovenska cesta 58</strong> · open 24 hours</p>

          <h2>Nobel Burek: a classic on Miklošičeva</h2>
          <p>Burek with meat or cheese and pizza by the slice, at any hour of the day or night.</p>
          <p><strong>Miklošičeva cesta 30</strong> · open 24 hours</p>

          <h2>Klobasarna: Carniolan sausage to go</h2>
          <p>Kranjska klobasa (Carniolan sausage) with a fresh Kaiser roll, mustard and horseradish, served in a former watchmaker's workshop. They also do štruklji (rolled dumplings) and ričet (barley stew).</p>
          <p><strong>Ciril-Metodov trg 15</strong> · Mon–Sat 10 am – 11 pm, Sun 10 am – 3 pm</p>

          <h2>Druga violina: Slovenian dishes on Stari trg</h2>
          <p>Beef soup, Carniolan sausage, veal ragout and seasonal dishes. Druga violina is a social enterprise, and people with special needs are among the serving staff.</p>
          <p><strong>Stari trg 21</strong> · Tue–Sun 8 am – midnight</p>

          <h2>Hleb'c bakery: fresh bread on Trubarjeva</h2>
          <p>A small bakery on our street, where the bread sells out fast. Check their opening hours on Instagram (@hlebcljubljana) before you go.</p>
          <p><strong>Trubarjeva cesta 13</strong></p>

          <h2>Ljubljana Central Market: fruit and veg from local growers</h2>
          <p>At the market on Vodnikov trg and Pogačarjev trg you can buy seasonal fruit and vegetables straight from the growers. It's open Monday to Saturday and is liveliest in the morning.</p>

          <h2>How to save money in Ljubljana</h2>
          <ul>
            <li><strong>Tap water is safe to drink.</strong> There are also public drinking fountains around the city, so you don't need to buy bottled water.</li>
            <li><strong>Weekday lunch menus.</strong> Many restaurants offer a cheaper daily lunch (dnevno kosilo or malica) on weekdays.</li>
            <li><strong>Student meal vouchers.</strong> If you study in Slovenia, you only pay the top-up with a student voucher (študentski bon). With us that's €2.55 for a main dish, salad, apple and drink. <a href="/en/student-vouchers">How the vouchers work</a></li>
            <li><strong>Late at night.</strong> After midnight, it's mostly fast-food places that stay open in the centre. Burek Olimpija and Nobel Burek are open 24 hours; Šeherezada on Trubarjeva is open until 2 am, and until 3 am on Fridays and Saturdays.</li>
          </ul>
        `,
      },
    },
  },
];

export const HAS_POSTS = BLOG_POSTS.length > 0;

export function postBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

/** Jeziki, v katerih objava obstaja. Slovenščina vedno, ostali iz `prevodi`. */
export function jezikiObjave(post: BlogPost): LocaleCode[] {
  const prevedeni = Object.entries(post.prevodi ?? {})
    .filter(([, besedilo]) => besedilo)
    .map(([jezik]) => jezik as LocaleCode);
  return ["sl", ...prevedeni];
}

/**
 * Objava v izbranem jeziku, s prevedenim besedilom. Če v tem jeziku ne
 * obstaja, vrne undefined — stran takrat pokaže 404, ne slovenskega besedila.
 */
export function objavaVJeziku(post: BlogPost, locale: string): BlogPost | undefined {
  if (locale === "sl") return post;
  const prevod = post.prevodi?.[locale as Exclude<LocaleCode, "sl">];
  return prevod ? { ...post, ...prevod, slug: prevod.slug ?? post.slug } : undefined;
}

/** Vse objave, ki obstajajo v tem jeziku, že prevedene. */
export function objaveVJeziku(locale: string): BlogPost[] {
  return BLOG_POSTS.flatMap((p) => objavaVJeziku(p, locale) ?? []);
}

/**
 * Objava po slugu, ki ga ima V TEM JEZIKU. /en/blog/cheap-eats-ljubljana
 * najde angleško objavo; /en/blog/poceni-hrana-ljubljana ne najde ničesar.
 * `osnova` je slovenski zapis, iz katerega izhajajo vsi jeziki.
 */
export function objavaPoSlugu(
  slug: string,
  locale: string
): { osnova: BlogPost; post: BlogPost } | undefined {
  for (const osnova of BLOG_POSTS) {
    const post = objavaVJeziku(osnova, locale);
    if (post?.slug === slug) return { osnova, post };
  }
  return undefined;
}

/** Slug objave v vsakem jeziku, v katerem obstaja: { sl: "...", en: "..." }. */
export function slugiObjave(osnova: BlogPost): Partial<Record<LocaleCode, string>> {
  const out: Partial<Record<LocaleCode, string>> = {};
  for (const jezik of jezikiObjave(osnova)) {
    const post = objavaVJeziku(osnova, jezik);
    if (post) out[jezik] = post.slug;
  }
  return out;
}
