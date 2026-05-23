"use client";

import { formatBRL } from "@/components/MetaMetrics/MetaMetricsPanel";
import DashboardCard from "./DashboardCard";
import { CHART_DATA_SOURCES, DATA_SOURCE } from "./metaDataSources";
import styles from "./dashboard.module.css";

/** Métricas secundárias só com dados Meta (overview). */
export default function MetaSecondaryMetrics({ overview }) {
  const funnel = overview?.funnel || overview?.conversionFunnel || {};
  const delivery = overview?.delivery || {};
  const spend = Number(overview?.totalSpend || 0);
  const purchases = Number(funnel.purchases ?? funnel.purchasesMeta ?? 0);
  const cpa = purchases > 0 ? spend / purchases : 0;

  const items = [
    { label: "CPA (Meta)", value: cpa, format: "brl" },
    { label: "Compras atrib.", value: purchases, format: "num" },
    { label: "Initiate checkout", value: funnel.initiateCheckouts ?? 0, format: "num" },
    { label: "Page views", value: funnel.pageViews ?? 0, format: "num" },
    { label: "Cliques", value: delivery.clicks ?? funnel.cliques ?? 0, format: "num" },
    { label: "Impressões", value: delivery.impressions ?? 0, format: "num" },
    { label: "Alcance", value: delivery.reach ?? 0, format: "num" },
    { label: "CTR médio", value: delivery.ctr ?? 0, format: "pct" },
    { label: "Análises IA", value: overview?.creativeAnalysesCount ?? 0, format: "num" },
  ];

  const fmt = (item) => {
    if (item.format === "brl") return formatBRL(item.value);
    if (item.format === "pct") return `${Number(item.value).toFixed(2)}%`;
    return Number(item.value).toLocaleString("pt-BR");
  };

  return (
    <DashboardCard
      title="Métricas secundárias Meta"
      hint="Ads importados + insights sincronizados no período"
      source={DATA_SOURCE.META}
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
