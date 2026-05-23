"use client";

import DataSourceTag from "./DataSourceTag";
import styles from "./dashboard.module.css";

export default function DashboardCard({
  title,
  hint,
  source,
  sourceNote,
  children,
  className = "",
  bodyClassName = "",
  accent = false,
}) {
  return (
    <section className={`${styles.card} ${accent ? styles.cardAccent : ""} ${className}`}>
      <header className={styles.cardHead}>
        <div className={styles.cardHeadText}>
          <h3 className={styles.cardTitle}>{title}</h3>
          {hint ? <p className={styles.cardHint}>{hint}</p> : null}
        </div>
        {source ? <DataSourceTag source={source} note={sourceNote} /> : null}
      </header>
      <div className={`${styles.cardBody} ${bodyClassName}`}>{children}</div>
    </section>
  );
}
