"use client";

import DashboardCard from "./DashboardCard";
import { CHART_DATA_SOURCES, DATA_SOURCE } from "./metaDataSources";
import styles from "./dashboard.module.css";

export default function SalesByProductList({ items = [] }) {
  const total = items.reduce((s, x) => s + Number(x.count || 0), 0) || 1;

  return (
    <DashboardCard
      title="Vendas por Produto"
      hint="Proxy via utm_campaign do webhook"
      source={DATA_SOURCE.PAGTRUST}
      sourceNote={CHART_DATA_SOURCES.salesByProduct.note}
    >
      {items.length ? (
        <table className={styles.listTable}>
          <thead>
            <tr>
              <th>Produto / Campanha</th>
              <th>Vendas</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td>{row.count}</td>
                <td>{((row.count / total) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className={styles.emptyText}>Sem utm_campaign nas vendas PagTrust.</p>
      )}
    </DashboardCard>
  );
}
