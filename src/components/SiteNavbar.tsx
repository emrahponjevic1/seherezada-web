"use client";

import { useState, useEffect, useRef } from "react";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link, getPathname, usePathname } from "@/i18n/navigation";
import styles from "./SiteNavbar.module.css";
import StatusBadge from "./locations/StatusBadge";
import { LOCATIONS, LOCATION_SLUG } from "@/data/locations";
import { LOCALES, localeByCode } from "@/data/site";

// Clean Vector SVG Icons
const PinSvg = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

interface SiteNavbarProps {
  activeRoute?: "home" | "meni" | "galerija" | "o-nas" | "pogosta-vprasanja" | "zaposlitev" | "blog" | "kontakt" | "studentski-boni" | "halal";
  /**
   * Naslov te strani v vsakem jeziku, ko ga prekidalnik ne more izračunati
   * sam. Objava na blogu ima v vsakem jeziku svoj slug in je v nekaterih
   * jezikih sploh ni — brez tega bi klik na ENG vodil na /en/blog/<slovenski
   * slug>, torej na 404.
   */
  potiJezikov?: Partial<Record<(typeof LOCALES)[number]["code"], string>>;
}

export default function SiteNavbar({ activeRoute = "home", potiJezikov }: SiteNavbarProps) {
  // Besedila so v messages/<jezik>.json pod ključem "navigacija".
  const t = useTranslations("navigacija");

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  // ------------------------------------------------------------------
  // PREKIDALNIK JEZIKA
  //
  // Jezik ni stanje v brskalniku, ampak naslov strani. Prej je bil tu
  // useState s tremi izmišljenimi oznakami (SLO/ENG/BHS): klik je prebarval
  // gumb, strani pa ni zamenjal. Gost do svojega jezika ni mogel priti
  // drugače kot z ročnim vpisom naslova.
  //
  // Zdaj beremo pravi jezik iz next-intl, seznam pa iz src/data/site.ts,
  // da ostane en sam vir.
  //
  // usePathname() iz našega navigation.ts vrne NOTRANJO pot ("/lokacije/[slug]"),
  // ne prevedene ("/de/standorte/trubarjeva-31"). Skupaj z useParams() iz nje
  // sestavimo naslov iste strani v ciljnem jeziku — zato deluje tudi na
  // straneh s slugom.
  //
  // Namenoma prava povezava, ne gumb z router.push: da se odpreti v novem
  // zavihku, brskalnik jo predbere, in gost vidi, kam gre.
  //
  // Namenoma pa NE naš <Link locale={...}>. next-intl ob izrecno podanem
  // jeziku vedno doda predpono ("Always include a prefix when changing
  // locales"), zato bi za slovenščino sestavil /sl/meni — naslov, ki obstaja
  // samo kot preusmeritev na /meni. getPathname() te prisile nima in vrne
  // /meni. Preverjeno: /sl/meni res vrne 307.
  //
  // prefetch={false}: ob menjavi jezika se zamenja celotno drevo strani,
  // zato Next za predbiranje vrne 404 (isto stori next-intl v svojem Linku
  // in na prefetch celo opozori). Klik dela enako, le brez zavrnjene
  // zahteve v ozadju.
  // ------------------------------------------------------------------
  const trenutniJezik = useLocale();
  const notranjaPot = usePathname();
  const parametriPoti = useParams();

  /** Ista stran v drugem jeziku; slug ostane, pot se prevede. */
  const potZaJezik = (jezik: (typeof LOCALES)[number]["code"]) =>
    potiJezikov?.[jezik] ??
    getPathname({
      href: { pathname: notranjaPot, params: parametriPoti },
      locale: jezik,
    } as Parameters<typeof getPathname>[0]);

  const jeziki = LOCALES.map((l) => ({
    ...l,
    aktiven: l.code === trenutniJezik,
    pot: potZaJezik(l.code),
  }));
  const trenutniJezikPodatki = localeByCode(trenutniJezik);

  // Dropdown Open States (Desktop & Mobile Drawer)
  const [isDesktopLocOpen, setIsDesktopLocOpen] = useState(false);
  const [isDesktopLangOpen, setIsDesktopLangOpen] = useState(false);
  const [isDrawerLocOpen, setIsDrawerLocOpen] = useState(false);
  const [isDrawerLangOpen, setIsDrawerLangOpen] = useState(false);

  const desktopNavActionsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (desktopNavActionsRef.current && !desktopNavActionsRef.current.contains(event.target as Node)) {
        setIsDesktopLocOpen(false);
        setIsDesktopLangOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body & html scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.documentElement.classList.add("drawerActive");
      document.body.classList.add("drawerActive");

      const preventTouch = (e: TouchEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest(`.${styles.mobileDrawer}`)) {
          e.preventDefault();
        }
      };

      document.addEventListener("touchmove", preventTouch, { passive: false });

      return () => {
        document.documentElement.classList.remove("drawerActive");
        document.body.classList.remove("drawerActive");
        document.removeEventListener("touchmove", preventTouch);
      };
    } else {
      document.documentElement.classList.remove("drawerActive");
      document.body.classList.remove("drawerActive");
    }
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        typeof document !== "undefined" &&
        (document.documentElement.classList.contains("modalActive") ||
          document.body.classList.contains("modalActive"))
      ) {
        return;
      }

      const currentScrollY = window.scrollY;

      // Desktop full-width threshold
      setIsScrolled(currentScrollY > 20);

      // Mobile Smart Hide-on-Scroll Logic (<= 1220px)
      if (currentScrollY <= 60) {
        setIsMobileNavVisible(true);
      } else if (currentScrollY > lastScrollYRef.current + 8) {
        setIsMobileNavVisible(false);
      } else if (currentScrollY < lastScrollYRef.current - 8) {
        setIsMobileNavVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: t("domov"), href: "/", active: activeRoute === "home" },
    { label: t("meni"), href: "/meni", active: activeRoute === "meni" },
    { label: t("galerija"), href: "/galerija", active: activeRoute === "galerija" },
    { label: t("oNas"), href: "/o-nas", active: activeRoute === "o-nas" },
    // /studentski-boni in /halal sta bila narejena prav za "študentski boni"
    // in "halal restavracija Ljubljana", v navigaciji pa ju ni bilo — imela
    // sta po dve povezavi, politika piškotkov pa štirinajst. Zdaj sta tu,
    // /pogosta-vprasanja in /blog pa v nogi, kjer povezav ne izgubita.
    { label: t("studentskiBoni"), href: "/studentski-boni", active: activeRoute === "studentski-boni" },
    { label: t("halal"), href: "/halal", active: activeRoute === "halal" },
    { label: t("zaposlitev"), href: "/zaposlitev", active: activeRoute === "zaposlitev" },
    { label: t("kontakt"), href: "/kontakt", active: activeRoute === "kontakt" },
    // as const: brez tega bi bil href navaden string in prevajalnik ne bi
    // ujel poti, ki ne obstaja.
  ] as const;

  // Poslovalnice beremo iz src/data/locations.ts — prej je bil tu drug seznam,
  // ki se je lahko razhajal s tistim v nogi in na strani Kontakt.
  // Poslovalnici nista izbira, ampak dve strani. Spustni seznam zato vodi na
  // /lokacije/<slug> — gost, ki hoče podrobnosti, gre tja; ostali ga ne rabijo.
  const locationsList = LOCATIONS.map((l) => ({
    id: l.id,
    name: l.name,
    address: l.street,
    href: {
      pathname: "/lokacije/[slug]" as const,
      params: { slug: LOCATION_SLUG[l.id] },
    },
  }));

  return (
    <>
      {/* Floating Island at Top (Desktop) / Smart Sticky Hide-on-Scroll (Mobile <= 1220px) */}
      <div
        className={`${styles.navbarStickyWrapper} ${
          isScrolled ? styles.navbarStickyWrapperScrolled : ""
        } ${!isMobileNavVisible ? styles.mobileNavHidden : styles.mobileNavVisible}`}
      >
        <header className={`${styles.navbarIsland} ${isScrolled ? styles.navbarFullWidth : ""}`}>
          <div className={styles.navbarInnerContainer}>
            {/* Brand Logo */}
            <Link href="/" className={styles.logoArea}>
              <div className={styles.logoIcon}>Š</div>
              <span className={styles.logoText}>
                Šeherezada<span className={styles.logoAccent}>.</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav>
              <ul className={styles.navLinks}>
                {navItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={`${styles.navLink} ${item.active ? styles.navLinkActive : ""}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Desktop Action Utilities */}
            <div className={styles.navActions} ref={desktopNavActionsRef}>
              {/* 1. Location Button */}
              <button
                type="button"
                onClick={() => {
                  setIsDesktopLocOpen(!isDesktopLocOpen);
                  setIsDesktopLangOpen(false);
                }}
                className={`${styles.locationPillBtn} ${isDesktopLocOpen ? styles.locationPillBtnActive : ""}`}
                aria-expanded={isDesktopLocOpen}
              >
                <PinSvg size={15} />
                <span>{t("lokaciji")}</span>
                <span style={{ fontSize: "0.72rem", opacity: 0.6 }}>▾</span>
              </button>

              {/* 2. Language Button */}
              <button
                type="button"
                onClick={() => {
                  setIsDesktopLangOpen(!isDesktopLangOpen);
                  setIsDesktopLocOpen(false);
                }}
                className={`${styles.langPillBtn} ${isDesktopLangOpen ? styles.langPillBtnActive : ""}`}
                aria-label={t("izbiraJezika")}
                aria-expanded={isDesktopLangOpen}
              >
                <span style={{ fontWeight: 800 }}>{trenutniJezikPodatki.short}</span>
                <span style={{ fontSize: "0.72rem", opacity: 0.6 }}>▾</span>
              </button>

              {/* Location Dropdown */}
              {isDesktopLocOpen && (
                <div className={styles.desktopDropdownMenu}>
                  {locationsList.map((loc) => (
                    <Link
                      key={loc.id}
                      href={loc.href}
                      onClick={() => setIsDesktopLocOpen(false)}
                      className={styles.dropdownOptionItem}
                    >
                      <div className={styles.dropdownItemMeta}>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <PinSvg size={13} />
                          <span>{loc.name}</span>
                        </span>
                        <span className={styles.dropdownItemSub}>{loc.address}</span>
                      </div>
                      <span className={styles.dropdownItemCheck}>→</span>
                    </Link>
                  ))}

                  {/* Brez te vrstice stran /lokacije ne bi imela nobene
                      povezave — bila bi sirota, ki je Google ne obišče. */}
                  <Link
                    href="/lokacije"
                    onClick={() => setIsDesktopLocOpen(false)}
                    className={styles.dropdownOptionItem}
                  >
                    <div className={styles.dropdownItemMeta}>
                      <span style={{ fontWeight: 700 }}>{t("obeLokaciji")}</span>
                    </div>
                    <span className={styles.dropdownItemCheck}>→</span>
                  </Link>
                </div>
              )}

              {/* Language Dropdown */}
              {isDesktopLangOpen && (
                <div className={`${styles.desktopDropdownMenu} ${styles.langDesktopDropdown}`}>
                  {jeziki.map((lang) => (
                    <NextLink
                      key={lang.code}
                      href={lang.pot}
                      prefetch={false}
                      hrefLang={lang.hreflang}
                      lang={lang.code}
                      onClick={() => setIsDesktopLangOpen(false)}
                      className={`${styles.dropdownOptionItem} ${
                        lang.aktiven ? styles.dropdownOptionItemActive : ""
                      }`}
                      aria-current={lang.aktiven ? "true" : undefined}
                    >
                      <div className={styles.dropdownItemMeta}>
                        <span style={{ fontWeight: 800, color: "#1c1917" }}>{lang.short}</span>
                        <span className={styles.dropdownItemSub}>{lang.name}</span>
                      </div>
                      {lang.aktiven && <span className={styles.dropdownItemCheck}>✓</span>}
                    </NextLink>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={styles.hamburgerBtn}
              aria-label={t("odpriMeni")}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
          </div>
        </header>
      </div>

      {/* Mobile Drawer Navigation & Backdrop Overlay */}
      <div
        className={`${styles.mobileMenuOverlay} ${isMobileMenuOpen ? styles.mobileMenuOverlayOpen : ""}`}
        onClick={() => {
          setIsMobileMenuOpen(false);
          setIsDrawerLocOpen(false);
          setIsDrawerLangOpen(false);
        }}
      />

      {/* Mobile Side Drawer */}
      <aside className={`${styles.mobileDrawer} ${isMobileMenuOpen ? styles.mobileDrawerOpen : ""}`}>
        <div>
          {/* Header */}
          <div className={styles.editorialHeader}>
            <Link href="/" className={styles.logoArea} onClick={() => setIsMobileMenuOpen(false)}>
              <div className={styles.logoIcon}>Š</div>
              <span className={styles.logoText}>
                Šeherezada<span className={styles.logoAccent}>.</span>
              </span>
            </Link>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsDrawerLocOpen(false);
                setIsDrawerLangOpen(false);
              }}
              className={styles.closeDrawerBtn}
              aria-label={t("zapriMeni")}
            >
              ✕
            </button>
          </div>

          {/* Numbered Editorial Navigation List */}
          <ul className={styles.editorialNavList}>
            {navItems.map((item, idx) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`${styles.editorialNavItem} ${item.active ? styles.editorialNavItemActive : ""}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className={styles.editorialNavTitle}>{item.label}</span>
                  <span className={styles.editorialNavNum}>0{idx + 1} ➔</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom Drawer Section */}
        <div className={styles.drawerBottomSection}>
          {LOCATIONS.map((l) => (
            <div key={l.id} className={styles.drawerStatusFullCard}>
              <div className={styles.drawerStatusLeft}>
                <PinSvg size={14} />
                <span className={styles.drawerStatusTitle}>{l.name}</span>
              </div>
              <StatusBadge hours={l.hours} />
            </div>
          ))}

          {/* Drawer Footer Utilities */}
          <div className={styles.editorialFooter}>
            {isDrawerLocOpen && (
              <div className={styles.drawerDropdownMenu}>
                {locationsList.map((loc) => (
                  <Link
                    key={loc.id}
                    href={loc.href}
                    onClick={() => {
                      setIsDrawerLocOpen(false);
                      setIsMobileMenuOpen(false);
                    }}
                    className={styles.dropdownOptionItem}
                  >
                    <div className={styles.dropdownItemMeta}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <PinSvg size={13} />
                        <span>{loc.name}</span>
                      </span>
                      <span className={styles.dropdownItemSub}>{loc.address}</span>
                    </div>
                    <span className={styles.dropdownItemCheck}>→</span>
                  </Link>
                ))}

                <Link
                  href="/lokacije"
                  onClick={() => {
                    setIsDrawerLocOpen(false);
                    setIsMobileMenuOpen(false);
                  }}
                  className={styles.dropdownOptionItem}
                >
                  <div className={styles.dropdownItemMeta}>
                    <span style={{ fontWeight: 700 }}>{t("obeLokaciji")}</span>
                  </div>
                  <span className={styles.dropdownItemCheck}>→</span>
                </Link>
              </div>
            )}

            {isDrawerLangOpen && (
              <div className={styles.drawerDropdownMenu}>
                {jeziki.map((lang) => (
                  <NextLink
                    key={lang.code}
                    href={lang.pot}
                    prefetch={false}
                    hrefLang={lang.hreflang}
                    lang={lang.code}
                    onClick={() => {
                      setIsDrawerLangOpen(false);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`${styles.dropdownOptionItem} ${
                      lang.aktiven ? styles.dropdownOptionItemActive : ""
                    }`}
                    aria-current={lang.aktiven ? "true" : undefined}
                  >
                    <div className={styles.dropdownItemMeta}>
                      <span style={{ fontWeight: 800, color: "#1c1917" }}>{lang.short}</span>
                      <span className={styles.dropdownItemSub}>{lang.name}</span>
                    </div>
                    {lang.aktiven && <span className={styles.dropdownItemCheck}>✓</span>}
                  </NextLink>
                ))}
              </div>
            )}

            <div className={styles.drawerActionsGrid}>
              <button
                type="button"
                onClick={() => {
                  setIsDrawerLocOpen(!isDrawerLocOpen);
                  setIsDrawerLangOpen(false);
                }}
                className={`${styles.drawerLocationBtn} ${isDrawerLocOpen ? styles.drawerBtnActive : ""}`}
              >
                <PinSvg size={18} className={styles.drawerActionIcon} />
                <div className={styles.drawerActionTextCol}>
                  <span className={styles.drawerActionLabel}>{t("lokaciji")}</span>
                </div>
                <span className={styles.drawerActionArrow}>{isDrawerLocOpen ? "▴" : "▾"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDrawerLangOpen(!isDrawerLangOpen);
                  setIsDrawerLocOpen(false);
                }}
                className={`${styles.drawerLangBtn} ${isDrawerLangOpen ? styles.drawerBtnActive : ""}`}
                aria-label={t("izbiraJezika")}
              >
                <span className={styles.drawerActionIcon} style={{ fontSize: "0.92rem", fontWeight: 800 }}>文A</span>
                <div className={styles.drawerActionTextCol}>
                  <span className={styles.drawerActionLabel}>{t("jezik")}</span>
                  <span className={styles.drawerActionValue}>{trenutniJezikPodatki.short}</span>
                </div>
                <span className={styles.drawerActionArrow}>{isDrawerLangOpen ? "▴" : "▾"}</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
