"use client";

import DashboardCard from "./DashboardCard";
import { CHART_DATA_SOURCES, DATA_SOURCE } from "./metaDataSources";
import { RANKING_ACCENTS } from "./dashboardTheme";
import styles from "./dashboard.module.css";

export default function MetaRankingsTable({ rankings = {} }) {
  const rows = [
    { label: "Melhor Gancho (3s / Impr.)", value: rankings.bestHook },
    { label: "Maior Retenção (75% / Plays)", value: rankings.bestRetention },
    { label: "Maior CTR", value: rankings.bestCtr },
    { label: "Menor Custo IC", value: rankings.bestCostIc },
    { label: "Maior ROAS", value: rankings.bestRoas },
    { label: "Maior Volume de Compras", value: rankings.bestSalesVolume },
    { label: "Maior Conversão (Compras / Views)", value: rankings.bestConversionRate },
  ].map((row, i) => ({
    ...row,
    tone: RANKING_ACCENTS[i % RANKING_ACCENTS.length],
  }));

  return (
    <DashboardCard
      title="Destaques — Rankings Meta"
      source={DATA_SOURCE.META}
      sourceNote={CHART_DATA_SOURCES.metaRankings.note}
    >
      <table className={styles.listTable}>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td className={styles.listTableMuted}>{row.label}</td>
              <td style={{ fontWeight: 700, color: row.tone }}>{row.value || "Sem dados"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardCard>
  );
}
