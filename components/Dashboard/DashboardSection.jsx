"use client";

import styles from "./dashboard.module.css";

export default function DashboardSection({ title, children, className = "" }) {
  return (
    <section className={`${styles.section} ${className}`}>
      {title ? <h2 className={styles.sectionTitle}>{title}</h2> : null}
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}
