"use client";

import DashboardCard from "./DashboardCard";
import { CHART_DATA_SOURCES, DATA_SOURCE } from "./metaDataSources";
import styles from "./dashboard.module.css";

export default function SalesBySourceList({ metaItems = [] }) {
  const items = metaItems;
  const total = items.reduce((s, x) => s + Number(x.count || x.value || 0), 0) || 1;

  return (
    <DashboardCard
      title="Tráfego por fonte (Meta)"
      source={DATA_SOURCE.META}
      sourceNote={CHART_DATA_SOURCES.salesBySource.meta.note}
    >
      {items.length ? (
        <table className={styles.listTable}>
          <thead>
            <tr>
              <th>Fonte</th>
              <th>Volume</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const count = Number(row.count ?? row.value ?? 0);
              return (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{count.toLocaleString("pt-BR")}</td>
                  <td>{((count / total) * 100).toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className={styles.emptyText}>
          Sem tráfego agregado — importe anúncios com insights sincronizados.
        </p>
      )}
    </DashboardCard>
  );
}
