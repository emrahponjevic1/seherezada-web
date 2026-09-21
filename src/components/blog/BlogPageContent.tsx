"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import styles from "./BlogPageContent.module.css";
import { objaveVJeziku } from "./BlogData";

// Clean Vector SVG Icons (No external library dependencies)
const BookIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <path d="M6 6h10" />
    <path d="M6 10h10" />
  </svg>
);

const CalendarIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

const ClockIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const ShareIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SparklesIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

export default function BlogPageContent() {
  // Besedila so v messages/<jezik>.json pod ključem "blogStran".
  const t = useTranslations("blogStran");

  // Vsaka objava ima svojo stran na /blog/<slug>, zato tukaj ni več
  // stanja za odpiranje objave v oknu — kartice so navadne povezave.

  // Samo objave, ki obstajajo v jeziku strani, z besedilom v tem jeziku.
  // Na nemškem arhivu tako ni slovenskih člankov.
  const locale = useLocale();
  const objave = useMemo(() => objaveVJeziku(locale), [locale]);

  /** Objava, prikazana veliko na vrhu arhiva. */
  const featuredPost = useMemo(
    () => objave.find((p) => p.isFeatured) ?? objave[0],
    [objave]
  );

  /** Vse ostale objave. */
  const gridPosts = useMemo(
    () => objave.filter((p) => p.slug !== featuredPost?.slug),
    [objave, featuredPost]
  );


  return (
    <div className={styles.blogPageRoot}>
      <div className={styles.ambientGlowTop} />

      {/* Arhiv objav. Posamezna objava ima svojo stran: /blog/<slug> */}
      <section className={styles.blogSection}>
          <div className={styles.container}>
            {/* Header / Intro */}
            <div className={styles.blogHeader}>
              <div className={styles.chapterTagContainer}>
                <span className={styles.tagGhostWatermark}>{t("vodniZnak")}</span>
                <div className={styles.chapterIndexTag}>
                  <span className={styles.chapterDash} />
                  <span>{t("oznaka")}</span>
                  <span className={styles.chapterDash} />
                </div>
              </div>

              <h1 className={styles.pageTitle}>{t("naslov")}</h1>

              <p className={styles.pageSubtitle}>{t("podnaslov")}</p>
            </div>

            {/* Ko ni objav, prazen arhiv izgleda pokvarjeno. Povemo, kako je. */}
            {!featuredPost && (
              <div className={styles.noPostsBox}>
                <h2 className={styles.noPostsTitle}>{t("niObjavNaslov")}</h2>
                <p className={styles.noPostsText}>{t("niObjavOpis")}</p>
                <div className={styles.noPostsActions}>
                  <Link href="/meni" className={styles.noPostsBtn}>
                    {t("poglejMeni")}
                  </Link>
                  <Link href="/kontakt" className={styles.noPostsBtnGhost}>
                    {t("kjeSmo")}
                  </Link>
                </div>
              </div>
            )}

            {/* Featured Hero Story */}
            {featuredPost && (
              <Link
                className={styles.featuredCard}
                href={{ pathname: "/blog/[slug]", params: { slug: featuredPost.slug } }}
              >
                <div className={styles.featuredImageContainer}>
                  <img
                    src={featuredPost.coverImage}
                    alt={featuredPost.title}
                    className={styles.featuredImg}
                  />
                  <div className={styles.featuredBadgeFloating}>
                    <SparklesIcon />
                    <span>{t("izpostavljena")}</span>
                  </div>
                </div>

                <div className={styles.featuredContent}>
                  <div className={styles.metaRow}>
                    <span>{featuredPost.category}</span>
                    <span className={styles.metaDot}>•</span>
                    <span className={styles.metaMuted}>{featuredPost.readTime}</span>
                  </div>

                  <h2 className={styles.featuredTitle}>{featuredPost.title}</h2>
                  <p className={styles.featuredExcerpt}>{featuredPost.excerpt}</p>

                  <div className={styles.featuredFooter}>
                    <div className={styles.authorSnippet}>
                      <img
                        src={featuredPost.coverImage}
                        alt={featuredPost.author.name}
                        className={styles.authorImgMini}
                      />
                      <div>
                        <div className={styles.authorNameSnippet}>
                          {featuredPost.author.name}
                        </div>
                        <div className={styles.authorRoleSnippet}>
                          {featuredPost.author.role}
                        </div>
                      </div>
                    </div>

                    <span className={styles.readMoreBtn}>
                      <span>{t("preberiZgodbo")}</span>
                      <ArrowRightIcon />
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid Header & Articles Grid */}
            <div className={styles.gridHeadingRow}>
              <div>
                <span className={styles.gridSectionKicker}>{t("najnovejse")}</span>
                <h3 className={styles.gridSectionTitle}>{t("raziscite")}</h3>
              </div>
            </div>

            <div className={styles.postsGrid}>
              {gridPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={{ pathname: "/blog/[slug]", params: { slug: post.slug } }}
                  className={styles.postCard}
                >
                  <div>
                    <div className={styles.cardImageWrapper}>
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className={styles.cardImg}
                      />
                      <span className={styles.categoryTagFloating}>
                        {post.category}
                      </span>
                    </div>

                    <div className={styles.cardContent}>
                      <div className={styles.cardMetaRow}>
                        <span>{post.date}</span>
                        <span>•</span>
                        <span>{post.readTime}</span>
                      </div>
                      <h4 className={styles.cardTitle}>{post.title}</h4>
                      <p className={styles.cardExcerpt}>{post.excerpt}</p>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.cardAuthorMini}>
                      <img
                        src={post.coverImage}
                        alt={post.author.name}
                        className={styles.cardAuthorAvatar}
                      />
                      <span className={styles.cardAuthorName}>
                        {post.author.name}
                      </span>
                    </div>
                    <span className={styles.cardActionLink}>
                      <span>{t("preberi")}</span>
                      <ArrowRightIcon />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

    </div>
  );
}
