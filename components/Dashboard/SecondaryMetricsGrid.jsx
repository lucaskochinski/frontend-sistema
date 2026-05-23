"use client";

import { formatBRL } from "@/components/MetaMetrics/MetaMetricsPanel";
import DashboardCard from "./DashboardCard";
import { CHART_DATA_SOURCES, DATA_SOURCE } from "./metaDataSources";
import styles from "./dashboard.module.css";

export default function SecondaryMetricsGrid({ metrics = {} }) {
  const items = [
    { label: "Vendas pendentes", value: metrics.pendingSales ?? 0, format: "num" },
    { label: "ARPU", value: metrics.arpu ?? 0, format: "brl" },
    { label: "Vendas reembolsadas", value: metrics.refundedSales ?? 0, format: "num" },
    { label: "Margem", value: metrics.marginPct ?? 0, format: "pct" },
    { label: "Reembolso", value: metrics.refundRatePct ?? 0, format: "pct" },
    { label: "CPA (Meta)", value: metrics.cpa ?? 0, format: "brl" },
    { label: "Total vendas", value: metrics.totalSales ?? 0, format: "num" },
    { label: "Taxa aprovação geral", value: metrics.overallApprovalPct ?? 0, format: "pct" },
    { label: "Análises IA", value: metrics.creativeAnalyses ?? 0, format: "num" },
  ];

  const fmt = (item) => {
    if (item.format === "brl") return formatBRL(item.value);
    if (item.format === "pct") return `${Number(item.value).toFixed(1)}%`;
    return Number(item.value).toLocaleString("pt-BR");
  };

  return (
    <DashboardCard
      title="Métricas secundárias"
      hint="Combinam PagTrust + Meta importados"
      source={DATA_SOURCE.CALCULATED}
      sourceNote={CHART_DATA_SOURCES.secondaryMetrics.cpa.note}
    >
      <div className={styles.secondaryGrid}>
        {items.map((item) => (
          <div key={item.label} className={styles.miniMetric}>
            <p className={styles.miniLabel}>{item.label}</p>
            <p className={styles.miniValue}>{fmt(item)}</p>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
