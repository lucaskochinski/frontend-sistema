"use client";

import { SOURCE_LABELS } from "./metaDataSources";
import styles from "./dashboard.module.css";

export default function DataSourceTag({ source, note }) {
  const label = SOURCE_LABELS[source] || source;
  const tone =
    source === "meta" ? styles.tagMeta : source === "pagtrust" ? styles.tagPagtrust : styles.tagCalc;

  return (
    <span className={`${styles.tag} ${tone}`} title={note || undefined}>
      {label}
    </span>
  );
}
