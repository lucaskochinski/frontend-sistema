"use client";

import { formatBRL } from "@/components/MetaMetrics/MetaMetricsPanel";
import styles from "./dashboard.module.css";

export default function SummaryKpiCards({
  spend = 0,
  metaPurchaseRevenue = 0,
  metaRoas = null,
}) {
  const roasNum = Number(metaRoas);
  const roasDisplay = Number.isFinite(roasNum) && roasNum > 0 ? roasNum.toFixed(2) : "—";
  const profit = metaPurchaseRevenue - spend;
  const roi = spend > 0 ? metaPurchaseRevenue / spend : 0;

  return (
    <div className={styles.kpiGrid}>
      <div className={styles.kpiCard}>
        <p className={styles.kpiLabel}>Receita atribuída (Meta)</p>
        <p className={styles.kpiValue}>{formatBRL(metaPurchaseRevenue)}</p>
        <p className={styles.kpiSub}>Insights · action_values purchase / omni_purchase</p>
      </div>
      <div className={styles.kpiCard}>
        <p className={styles.kpiLabel}>Gastos com anúncios</p>
        <p className={styles.kpiValue}>{formatBRL(spend)}</p>
        <p className={styles.kpiSub}>Meta · spend (período seleccionado)</p>
      </div>
      <div className={styles.kpiCard}>
        <p className={styles.kpiLabel}>ROAS / ROI (Meta)</p>
        <p className={`${styles.kpiValue} ${roi >= 1 ? styles.positive : roi > 0 ? styles.negative : ""}`}>
          {spend > 0 ? `${roi.toFixed(2)}x` : "—"}
        </p>
        {roasDisplay !== "—" ? <p className={styles.kpiSub}>ROAS reportado: {roasDisplay}x</p> : null}
      </div>
      <div className={styles.kpiCard}>
        <p className={styles.kpiLabel}>Lucro atribuído (Meta)</p>
        <p className={`${styles.kpiValue} ${profit >= 0 ? styles.positive : styles.negative}`}>
          {formatBRL(profit)}
        </p>
        <p className={styles.kpiSub}>Receita atribuída − gasto Meta</p>
      </div>
    </div>
  );
}
