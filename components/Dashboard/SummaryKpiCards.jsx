"use client";

import { formatBRL } from "@/components/MetaMetrics/MetaMetricsPanel";
import FutureFeatureLock from "./FutureFeatureLock";
import styles from "./dashboard.module.css";

export default function SummaryKpiCards({
  spend = 0,
  metaPurchaseRevenue = 0,
  metaRoas = null,
  gatewayRevenue = 0,
}) {
  const roasNum = Number(metaRoas);
  const roasDisplay = Number.isFinite(roasNum) && roasNum > 0 ? roasNum.toFixed(2) : "—";

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
        <p className={styles.kpiLabel}>ROAS (Meta)</p>
        <p className={`${styles.kpiValue} ${roasNum >= 1 ? styles.positive : roasNum > 0 ? styles.negative : ""}`}>
          {roasDisplay}
          {roasDisplay !== "—" ? "x" : ""}
        </p>
        <p className={styles.kpiSub}>Receita atribuída ÷ gasto Meta</p>
      </div>
      <div className={styles.kpiCard}>
        <FutureFeatureLock compact label="PagTrust / Vturb / Utmify">
          <>
            <p className={styles.kpiLabel}>Faturamento líquido (gateway)</p>
            <p className={styles.kpiValue}>{formatBRL(gatewayRevenue)}</p>
            <p className={styles.kpiSub}>Vendas aprovadas via webhook</p>
          </>
        </FutureFeatureLock>
      </div>
    </div>
  );
}
