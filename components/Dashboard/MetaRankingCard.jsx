"use client";

import Link from "next/link";
import styles from "./dashboard.module.css";

export default function MetaRankingCard({ item }) {
  const {
    title,
    subtitle,
    display,
    adName,
    adId,
    hasData,
    accent = "#d4af37",
    metaFields = [],
  } = item || {};

  return (
    <article className={styles.rankingCard} style={{ "--rank-accent": accent }}>
      <header className={styles.rankingCardHead}>
        <h4 className={styles.rankingCardTitle}>{title}</h4>
        <span className={styles.rankingMetaTag}>Meta</span>
      </header>
      <p className={styles.rankingCardFormula}>{subtitle}</p>
      <p className={styles.rankingCardScore}>{display || "Sem dados"}</p>
      {hasData && adName ? (
        adId ? (
          <Link href={`/criativo/${adId}`} className={styles.rankingCardAd}>
            {adName}
          </Link>
        ) : (
          <p className={styles.rankingCardAd}>{adName}</p>
        )
      ) : (
        <p className={styles.rankingCardEmpty}>Importe anúncios com entrega no período</p>
      )}
      {metaFields?.length ? (
        <p className={styles.rankingCardFields} title={metaFields.join(", ")}>
          API: {metaFields.slice(0, 2).join(" · ")}
          {metaFields.length > 2 ? "…" : ""}
        </p>
      ) : null}
    </article>
  );
}
