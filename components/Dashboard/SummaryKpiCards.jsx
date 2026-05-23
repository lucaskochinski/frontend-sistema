"use client";

import { formatBRL } from "@/components/MetaMetrics/MetaMetricsPanel";
import { CHART_DATA_SOURCES, DATA_SOURCE } from "./metaDataSources";
import styles from "./dashboard.module.css";

export default function SummaryKpiCards({ revenue, spend, roi, profit, metaRoas }) {
  const roiNum = Number(roi);
  const profitNum = Number(profit);
  const roiDisplay = Number.isFinite(roiNum) && roiNum > 0 ? `${roiNum.toFixed(2)}x` : "—";

  return (
    <div className={styles.kpiGrid}>
      <div className={styles.kpiCard}>
        <p className={styles.kpiLabel}>Faturamento Líquido</p>
        <p className={styles.kpiValue}>{formatBRL(revenue)}</p>
        <p className={styles.kpiSub}>{CHART_DATA_SOURCES.summaryKpi.revenue.note}</p>
      </div>
      <div className={styles.kpiCard}>
        <p className={styles.kpiLabel}>Gastos com anúncios</p>
        <p className={styles.kpiValue}>{formatBRL(spend)}</p>
        <p className={styles.kpiSub}>Meta · {CHART_DATA_SOURCES.summaryKpi.spend.metaField}</p>
      </div>
      <div className={styles.kpiCard}>
        <p className={styles.kpiLabel}>ROI</p>
        <p className={`${styles.kpiValue} ${roiNum >= 1 ? styles.positive : styles.negative}`}>{roiDisplay}</p>
        {metaRoas ? <p className={styles.kpiSub}>ROAS Meta: {Number(metaRoas).toFixed(2)}</p> : null}
      </div>
      <div className={styles.kpiCard}>
        <p className={styles.kpiLabel}>Lucro</p>
        <p className={`${styles.kpiValue} ${profitNum >= 0 ? styles.positive : styles.negative}`}>
          {formatBRL(profit)}
        </p>
        <p className={styles.kpiSub}>Receita PagTrust − gasto Meta</p>
      </div>
    </div>
  );
}

export { DATA_SOURCE };
