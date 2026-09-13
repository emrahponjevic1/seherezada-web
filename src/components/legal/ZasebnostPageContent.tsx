"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { COMPANY } from "@/data/company";
import { PHONE } from "@/data/locations";
import { Link } from "@/i18n/navigation";
import styles from "./LegalPage.module.css";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ShieldLockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <rect width="8" height="5" x="8" y="11" rx="1" />
    <path d="M10 11V9a2 2 0 0 1 4 0v2" />
  </svg>
);

const UserCheckIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <polyline points="16 11 18 13 22 9" />
  </svg>
);

const FileTextIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const TrashIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const QrIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}>
    <rect width="5" height="5" x="3" y="3" rx="1" />
    <rect width="5" height="5" x="16" y="3" rx="1" />
    <rect width="5" height="5" x="3" y="16" rx="1" />
    <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
    <path d="M21 21v.01" />
    <path d="M12 7v3a2 2 0 0 1-2 2H7" />
    <path d="M3 12h.01" />
    <path d="M12 3h.01" />
    <path d="M12 16v.01" />
    <path d="M16 12h1" />
    <path d="M21 12v.01" />
    <path d="M12 21v-1" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" {...stroke} strokeWidth={2.4}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export default function ZasebnostPageContent() {
  // Besedila so v messages/<jezik>.json pod ključem "zasebnost".
  const t = useTranslations("zasebnost");

  return (
    <div className={styles.page}>
      <div className={styles.bgWarmGlow} />

      <div className={styles.container}>
        {/* Editorial Chapter Watermark Header */}
        <header className={styles.heroHeader}>
          <div className={styles.chapterTagContainer}>
            <span className={styles.tagGhostWatermark}>{t("vodniZnak")}</span>
            <div className={styles.chapterIndexTag}>
              <span className={styles.chapterDash} />
              <span>{t("oznaka")}</span>
              <span className={styles.chapterDash} />
            </div>
          </div>

          <h1 className={styles.pageTitle}>{t("naslov")}</h1>

          <p className={styles.pageLead}>{t("uvod")}</p>

          <div className={styles.metaUpdatedBar}>
            <span>{t("posodobitev")}</span>
          </div>
        </header>

        {/* 1. Upravljavec osebnih podatkov */}
        <section className={styles.legalSection}>
          <h2 className={styles.sectionTitle}>{t("razdelek1")}</h2>
          <p className={styles.sectionText}>{t("razdelek1Uvod")}</p>

          <div className={styles.controllerCard}>
            <div>
              <h3 className={styles.controllerTitle}>{COMPANY.legalName}</h3>
              <ul className={styles.controllerMetaList}>
                <li className={styles.controllerMetaItem}>
                  <strong>{t("oznakaZnamka")}</strong>
                  <span>{COMPANY.brandName}</span>
                </li>
                <li className={styles.controllerMetaItem}>
                  <strong>{t("oznakaSedez")}</strong>
                  <span>{COMPANY.address}</span>
                </li>
                <li className={styles.controllerMetaItem}>
                  <strong>{t("oznakaMaticna")}</strong>
                  <span>{COMPANY.registrationNumber}</span>
                </li>
                <li className={styles.controllerMetaItem}>
                  <strong>{t("oznakaPoslovalnici")}</strong>
                  <span>{t("poslovalnici")}</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className={styles.controllerTitle}>{t("kontaktnaTocka")}</h3>
              <ul className={styles.controllerMetaList}>
                <li className={styles.controllerMetaItem}>
                  <strong>{t("oznakaEposta")}</strong>
                  <a
                    href={`mailto:${COMPANY.privacyEmail}`}
                    className={styles.controllerLink}
                  >
                    {COMPANY.privacyEmail}
                  </a>
                </li>
                <li className={styles.controllerMetaItem}>
                  <strong>{t("oznakaTelefon")}</strong>
                  <a href={`tel:${PHONE.restaurant.e164}`} className={styles.controllerLink}>
                    {PHONE.restaurant.display}
                  </a>
                </li>
                <li className={styles.controllerMetaItem}>
                  <strong>{t("oznakaVprasanja")}</strong>
                  <span>{t("vprasanjaOdgovor")}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2. Katere podatke zbiramo in zakaj */}
        <section className={styles.legalSection}>
          <h2 className={styles.sectionTitle}>{t("razdelek2")}</h2>
          <p className={styles.sectionText}>{t("razdelek2Uvod")}</p>

          <div className={styles.bentoGrid2}>
            {/* Box 1 */}
            <div className={styles.bentoCard}>
              <div className={styles.bentoIconWrapper}>
                <FileTextIcon />
              </div>
              <h3 className={styles.bentoCardTitle}>{t("obrazecNaslov")}</h3>
              <p className={styles.bentoCardText}>{t("obrazecOpis")}</p>
            </div>

            {/* Box 2 */}
            <div className={styles.bentoCard}>
              <div className={styles.bentoIconWrapper}>
                <UserCheckIcon />
              </div>
              <h3 className={styles.bentoCardTitle}>{t("prijaveNaslov")}</h3>
              <p className={styles.bentoCardText}>{t("prijaveOpis")}</p>
            </div>

            {/* Box 3 */}
            <div className={styles.bentoCard}>
              <div className={styles.bentoIconWrapper}>
                <ShieldLockIcon />
              </div>
              <h3 className={styles.bentoCardTitle}>{t("dnevnikiNaslov")}</h3>
              <p className={styles.bentoCardText}>{t("dnevnikiOpis")}</p>
            </div>

            {/* Box 4 */}
            <div className={styles.bentoCard}>
              <div className={styles.bentoIconWrapper}>
                <TrashIcon />
              </div>
              <h3 className={styles.bentoCardTitle}>{t("boniNaslov")}</h3>
              <p className={styles.bentoCardText}>{t("boniOpis")}</p>
            </div>

            {/* Box 5 — QR kode s štetjem skeniranj (/q/…, glej src/app/(statistika)).
                Čez obe koloni, ker je besedilo daljše. */}
            <div className={styles.bentoCard} style={{ gridColumn: "1 / -1" }}>
              <div className={styles.bentoIconWrapper}>
                <QrIcon />
              </div>
              <h3 className={styles.bentoCardTitle}>{t("qrNaslov")}</h3>
              <p className={styles.bentoCardText}>{t("qrOpis")}</p>
            </div>
          </div>
        </section>

        {/* 3. Pravne podlage za obdelavo */}
        <section className={styles.legalSection}>
          <h2 className={styles.sectionTitle}>{t("razdelek3")}</h2>
          <p className={styles.sectionText}>{t("razdelek3Uvod")}</p>
          <div className={styles.highlightBox}>
            <p className={styles.sectionText} style={{ marginBottom: "0.6rem" }}>
              {t.rich("podlaga1", { b: (chunks) => <strong>{chunks}</strong> })}
            </p>
            <p className={styles.sectionText} style={{ marginBottom: "0.6rem" }}>
              {t.rich("podlaga2", { b: (chunks) => <strong>{chunks}</strong> })}
            </p>
            <p className={styles.sectionText} style={{ marginBottom: 0 }}>
              {t.rich("podlaga3", { b: (chunks) => <strong>{chunks}</strong> })}
            </p>
          </div>
        </section>

        {/* 4. Vaše pravice po GDPR */}
        <section className={styles.legalSection}>
          <h2 className={styles.sectionTitle}>{t("razdelek4")}</h2>
          <p className={styles.sectionText}>{t("razdelek4Uvod")}</p>

          <div className={styles.bentoGrid3}>
            <div className={styles.bentoCard}>
              <h4 className={styles.bentoCardTitle}>{t("pravicaDostopNaslov")}</h4>
              <p className={styles.bentoCardText}>{t("pravicaDostopOpis")}</p>
            </div>

            <div className={styles.bentoCard}>
              <h4 className={styles.bentoCardTitle}>{t("pravicaPopravekNaslov")}</h4>
              <p className={styles.bentoCardText}>{t("pravicaPopravekOpis")}</p>
            </div>

            <div className={styles.bentoCard}>
              <h4 className={styles.bentoCardTitle}>{t("pravicaIzbrisNaslov")}</h4>
              <p className={styles.bentoCardText}>{t("pravicaIzbrisOpis")}</p>
            </div>

            <div className={styles.bentoCard}>
              <h4 className={styles.bentoCardTitle}>{t("pravicaOmejitevNaslov")}</h4>
              <p className={styles.bentoCardText}>{t("pravicaOmejitevOpis")}</p>
            </div>

            <div className={styles.bentoCard}>
              <h4 className={styles.bentoCardTitle}>{t("pravicaPrenosNaslov")}</h4>
              <p className={styles.bentoCardText}>{t("pravicaPrenosOpis")}</p>
            </div>

            <div className={styles.bentoCard}>
              <h4 className={styles.bentoCardTitle}>{t("pravicaUgovorNaslov")}</h4>
              <p className={styles.bentoCardText}>{t("pravicaUgovorOpis")}</p>
            </div>
          </div>

          <p className={styles.sectionText}>
            {t.rich("uveljavljanje", { eposta: COMPANY.privacyEmail, b: (chunks) => <strong>{chunks}</strong> })}
          </p>
        </section>

        {/* 5. Varnost podatkov in čas hrambe */}
        <section className={styles.legalSection}>
          <h2 className={styles.sectionTitle}>{t("razdelek5")}</h2>
          <p className={styles.sectionText}>{t("varnost1")}</p>
          <p className={styles.sectionText}>{t("varnost2")}</p>
          {/* Rok hrambe se izvaja v src/app/(statistika)/statistika/budilica/route.ts. */}
          <p className={styles.sectionText}>{t("varnost3")}</p>
        </section>

        {/* 5a. Komu podatki gredo — brez tega bi bilo besedilo nepopolno */}
        <section className={styles.legalSection}>
          <h2 className={styles.sectionTitle}>{t("razdelek6")}</h2>
          <p className={styles.sectionText}>{t("razdelek6Uvod")}</p>
          <div className={styles.highlightBox}>
            <p className={styles.sectionText}>
              {t.rich("gostovanje", { b: (chunks) => <strong>{chunks}</strong> })}
            </p>
            {/* Vgrajeni Googlov zemljevid na strani Kontakt je tretja oseba,
                ki ob prikazu prejme naslov IP obiskovalca. Prej ga besedilo
                ni omenjalo — odkrito v neodvisni reviziji (6A.3). */}
            <p className={styles.sectionText} style={{ marginBottom: 0 }}>
              {t.rich("zemljevid", { b: (chunks) => <strong>{chunks}</strong> })}
            </p>

            {/* Sporočila iz obrazca gredo skozi našega poštnega ponudnika,
                ki pri tem obdela ime, naslov in vsebino. Dokler je obrazec
                samo hlinil pošiljanje, tega ni bilo treba navesti; zdaj je. */}
            <p className={styles.bodyText}>
              {t.rich("posta", { b: (chunks) => <strong>{chunks}</strong> })}
            </p>

            {/* Baza za QR statistiko. */}
            <p className={styles.bodyText}>
              {t.rich("baza", { b: (chunks) => <strong>{chunks}</strong> })}
            </p>
          </div>
          <p className={styles.sectionText}>{t("razkritje")}</p>
        </section>

        {/* 6. Pritožba pri nadzornem organu */}
        <section className={styles.legalSection}>
          <h2 className={styles.sectionTitle}>{t("razdelek7")}</h2>
          <p className={styles.sectionText}>{t("razdelek7Uvod")}</p>

          <div className={styles.highlightBoxOrange}>
            <h3 className={styles.highlightTitle}>
              <span>{t("nadzorniOrgan")}</span>
            </h3>
            <p className={styles.sectionText} style={{ marginBottom: "0.4rem" }}>
              {t("nadzorniNaslov")}
            </p>
            <p className={styles.sectionText} style={{ marginBottom: "0.4rem" }}>
              {t("nadzorniKontakt")}
            </p>
            <p className={styles.sectionText} style={{ marginBottom: 0 }}>
              {t("nadzorniSpletna")}{" "}
              <a
                href="https://www.ip-rs.si"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.controllerLink}
              >
                www.ip-rs.si
              </a>
            </p>
          </div>
        </section>

        {/* Bottom Legal Navigation Bar */}
        <div className={styles.legalNavRow}>
          <Link href="/piskotki" className={styles.legalNavBtnPrimary}>
            <span>{t("gumbPiskotki")}</span>
            <ArrowRightIcon />
          </Link>
          <Link href="/meni" className={styles.legalNavBtn}>
            <span>{t("gumbMeni")}</span>
          </Link>
          <Link href="/kontakt" className={styles.legalNavBtn}>
            <span>{t("gumbKontakt")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
