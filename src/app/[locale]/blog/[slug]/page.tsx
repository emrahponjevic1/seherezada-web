import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hreflangZaSluge, localizedSlugUrl } from "@/i18n/urls";
import type { AppLocale } from "@/i18n/urls";
import { LOCALES, SHARE_IMAGE, SITE_NAME, localeByCode } from "@/data/site";
import type { LocaleCode } from "@/data/site";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Link, getPathname } from "@/i18n/navigation";
import SiteNavbar from "@/components/SiteNavbar";
import SiteFooter from "@/components/SiteFooter";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import {
  BLOG_POSTS,
  objavaPoSlugu,
  objaveVJeziku,
  slugiObjave,
} from "@/data/blog";
import styles from "@/components/blog/BlogPageContent.module.css";

const BASE = "https://seherezada.net";

/**
 * Vsak slug vsake objave dobi statično stran v vseh šestih jezikih. Stran,
 * kjer slug ne pripada temu jeziku (/en/blog/poceni-hrana-ljubljana ali
 * /de/blog/...), pokliče notFound() in vrne 404.
 *
 * Preizkušeno 21. 9. 2026: različica, ki bere jezik iz nadrejenega [locale]
 * in vrne samo prevedene jezike, je vrnila pravi seznam, a Next ni zgradil
 * nobene strani objave. Zato ta preprostejša pot.
 */
export function generateStaticParams() {
  const vsiSlugi = new Set(BLOG_POSTS.flatMap((post) => Object.values(slugiObjave(post))));
  return [...vsiSlugi].map((slug) => ({ slug }));
}

/**
 * Pot iste objave v vsakem jeziku, ki ga ima; jezik brez prevoda dobi arhiv
 * bloga v svojem jeziku. Gre v prekidalnik jezikov, ki sam slugov ne pozna.
 */
function potiJezikov(slugi: Partial<Record<LocaleCode, string>>) {
  const out = {} as Record<LocaleCode, string>;
  for (const l of LOCALES) {
    const slug = slugi[l.code];
    out[l.code] = slug
      ? getPathname({ href: { pathname: "/blog/[slug]", params: { slug } }, locale: l.code })
      : getPathname({ href: "/blog", locale: l.code });
  }
  return out;
}

/**
 * Facebook, WhatsApp in Viber slike AVIF ne preberejo — predogled povezave
 * bi ostal prazen. Takrat pokažemo splošno sliko za deljenje (JPEG).
 */
function slikaZaDeljenje(coverImage: string) {
  return coverImage.endsWith(".avif")
    ? SHARE_IMAGE
    : { src: coverImage, width: 1200, height: 630 };
}

/** Slug, ki ga ni med objavami, vrne 404 namesto prazne strani. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const tm = await getTranslations({ locale, namespace: "meta" });
  const najdena = objavaPoSlugu(slug, locale);

  if (!najdena) {
    return { title: tm("objavaNiNajdena") };
  }
  const { osnova, post } = najdena;

  // Kanonični naslov kaže na to stran v tem jeziku, ne na slovensko.
  const url = localizedSlugUrl("/blog/[slug]", post.slug, locale as AppLocale);
  const slika = slikaZaDeljenje(post.coverImage);

  return {
    title: post.metaTitle ?? tm("objavaNaslov", { naslov: post.title }),
    description: post.excerpt,
    alternates: {
      canonical: url,
      // Samo jeziki, v katere je objava prevedena, vsak s svojim slugom,
      // + x-default. Tako Google ve, da sta /blog/poceni-hrana-ljubljana in
      // /en/blog/cheap-eats-ljubljana ista objava.
      languages: hreflangZaSluge("/blog/[slug]", slugiObjave(osnova)),
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: "article",
      publishedTime: post.isoDate,
      authors: [post.author.name],
      siteName: SITE_NAME,
      locale: localeByCode(locale).og,
      images: [{ url: `${BASE}${slika.src}`, width: slika.width, height: slika.height, alt: post.title }],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // Drobtine bere Google in jih pokaže pod naslovom v zadetkih.
  const tn = await getTranslations({ locale, namespace: "navigacija" });
  const tb = await getTranslations({ locale, namespace: "blogStran" });
  const najdena = objavaPoSlugu(slug, locale);

  if (!najdena) notFound();
  const { osnova, post } = najdena;

  const related = objaveVJeziku(locale).filter((p) => p.slug !== post.slug).slice(0, 3);

  // Ista objava v drugih jezikih — vidna povezava pod naslovom. Hreflang v
  // glavi strani Googlu pove isto, ta povezava pa jo pokaže tudi bralcu in
  // Googlu da navadno povezavo, po kateri pride do druge različice.
  const slugi = slugiObjave(osnova);
  const poti = potiJezikov(slugi);
  const drugiJeziki = LOCALES.filter((l) => l.code !== locale && slugi[l.code]);

  return (
    <main>
      {/* Isti členi, kot jih gost vidi v drobtinah nad naslovom. */}
      <BreadcrumbJsonLd
        items={[
          { name: tn("domov"), path: "/" },
          { name: tn("blog"), path: "/blog" },
          { name: post.title },
        ]}
      />
      <SiteNavbar activeRoute="blog" potiJezikov={poti} />

      <article className={styles.blogSection}>
        <div className={styles.container}>
          <div className={styles.singleArticleWrapper}>
            <nav aria-label="Drobtice" className={styles.breadcrumbNav}>
              <Link href="/" className={styles.breadcrumbLink}>
                {tn("domov")}
              </Link>
              <span className={styles.breadcrumbSeparator}>/</span>
              <Link href="/blog" className={styles.breadcrumbLink}>
                {tn("blog")}
              </Link>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbCurrent}>{post.title}</span>
            </nav>

            <span className={styles.singleCategoryPill}>{post.category}</span>

            <h1 className={styles.singleTitle}>{post.title}</h1>
            <p className={styles.singleExcerpt}>{post.excerpt}</p>

            {drugiJeziki.length > 0 && (
              <p className={styles.singleLangNote}>
                {tb("tudiVJeziku")}{" "}
                {drugiJeziki.map((l, i) => (
                  <span key={l.code}>
                    {i > 0 && ", "}
                    {/* Navadna povezava, ne naš Link: ta bi za slovenščino
                        dodal /sl/ — naslov, ki obstaja samo kot preusmeritev. */}
                    <a href={poti[l.code]} hrefLang={l.hreflang} lang={l.code}>
                      {l.name}
                    </a>
                  </span>
                ))}
              </p>
            )}

            <div className={styles.singleAuthorBar}>
              <div className={styles.singleAuthorLeft}>
                <div>
                  <span className={styles.singleAuthorName}>{post.author.name}</span>
                  <span className={styles.singleAuthorRole}>{post.author.role}</span>
                </div>
              </div>

              <div className={styles.singleMetaRight}>
                <span className={styles.singleMetaItem}>
                  <time dateTime={post.isoDate}>{post.date}</time>
                </span>
                <span className={styles.metaDot} />
                <span className={styles.singleMetaItem}>{post.readTime}</span>
              </div>
            </div>

            <figure className={styles.singleCoverContainer}>
              <Image
                src={post.coverImage}
                alt={post.imageCaption || post.title}
                width={1200}
                height={630}
                priority
                className={styles.singleCoverImg}
              />
              {(post.imageCaption || post.coverCredit) && (
                <figcaption className={styles.singleCaption}>
                  {post.imageCaption}
                  {/* Pogoj licence: avtor, vir, licenca in ali je slika spremenjena. */}
                  {post.coverCredit && (
                    <>
                      {post.imageCaption && " · "}
                      {tb("foto")}:{" "}
                      <a href={post.coverCredit.source} rel="noopener">
                        {post.coverCredit.author}
                      </a>
                      {post.coverCredit.modified && ` (${tb("izrez")})`},{" "}
                      <a href={post.coverCredit.licenseUrl} rel="license noopener">
                        {post.coverCredit.license}
                      </a>
                    </>
                  )}
                </figcaption>
              )}
            </figure>

            <div
              className={styles.singleBodyHtml}
              dangerouslySetInnerHTML={{ __html: post.contentHtml }}
            />

            {related.length > 0 && (
              <div className={styles.singleActionFooter}>
                <Link href="/blog" className={styles.breadcrumbLink}>
                  &larr; {tb("vseObjave")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
