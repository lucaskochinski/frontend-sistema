"use client";

import DashboardCard from "./DashboardCard";
import { CHART_DATA_SOURCES, DATA_SOURCE } from "./metaDataSources";
import { HOOKO_GOLD } from "./dashboardTheme";
import styles from "./dashboard.module.css";

function approvalTone(pct) {
  if (pct >= 70) return HOOKO_GOLD.bright;
  if (pct >= 40) return HOOKO_GOLD.primary;
  return HOOKO_GOLD.darker;
}

export default function ApprovalRateChart({ rates = [] }) {
  return (
    <DashboardCard
      title="Taxa de Aprovação"
      source={DATA_SOURCE.PAGTRUST}
      sourceNote={CHART_DATA_SOURCES.approvalRate.note}
    >
      <div className={styles.approvalGrid}>
        {rates.map((r) => (
          <div key={r.label} className={styles.approvalRing}>
            <div
              className={styles.approvalPct}
              style={{ color: approvalTone(Number(r.pct)) }}
            >
              {Number(r.pct).toFixed(0)}%
            </div>
            <p className={styles.approvalLabel}>{r.label}</p>
            <p className={styles.approvalLabel}>
              {r.approved}/{r.total}
            </p>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
