"use client";

import DashboardCard from "./DashboardCard";
import MetaRankingCard from "./MetaRankingCard";
import { CHART_DATA_SOURCES, DATA_SOURCE } from "./metaDataSources";
import { RANKING_ACCENTS } from "./dashboardTheme";
import styles from "./dashboard.module.css";

const FALLBACK_LABELS = [
  { id: "bestHook", title: "Melhores ganchos", subtitle: "Views 3s ÷ impressões" },
  { id: "bestRetention", title: "Melhor retenção no corpo", subtitle: "75% assistido ÷ plays iniciados" },
  { id: "bestCtr", title: "Maior CTR", subtitle: "Cliques ÷ impressões" },
  { id: "bestCostIc", title: "Menor custo de Initiate Checkout", subtitle: "Gasto ÷ ICs" },
  { id: "bestRoi", title: "Maior ROI", subtitle: "(Receita compra Meta − gasto) ÷ gasto" },
  { id: "bestSalesVolume", title: "Maior volume de vendas", subtitle: "Compras atribuídas (pixel Meta)" },
  { id: "bestConversionRate", title: "Maior conversão", subtitle: "Vendas ÷ page views" },
];

const FALLBACK_ITEMS = FALLBACK_LABELS.map((item, i) => ({
  ...item,
  display: "Sem dados",
  hasData: false,
  accent: RANKING_ACCENTS[i % RANKING_ACCENTS.length],
}));

export default function MetaRankingsGrid({ items }) {
  const list = items?.length
    ? items.map((item, i) => ({
        ...item,
        accent: RANKING_ACCENTS[i % RANKING_ACCENTS.length],
      }))
    : FALLBACK_ITEMS;

  return (
    <DashboardCard
      title="Destaques por criativo"
      hint="Melhor anúncio importado em cada métrica — calculado sobre ads sincronizados"
      source={DATA_SOURCE.META}
      sourceNote={CHART_DATA_SOURCES.metaRankings.note}
    >
      <div className={styles.rankingsGrid}>
        {list.map((item) => (
          <MetaRankingCard key={item.id} item={item} />
        ))}
      </div>
    </DashboardCard>
  );
}
