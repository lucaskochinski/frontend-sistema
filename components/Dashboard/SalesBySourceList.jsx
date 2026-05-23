"use client";

import { useState } from "react";
import DashboardCard from "./DashboardCard";
import { CHART_DATA_SOURCES, DATA_SOURCE } from "./metaDataSources";
import styles from "./dashboard.module.css";

export default function SalesBySourceList({ pagtrustItems = [], metaItems = [] }) {
  const [tab, setTab] = useState(metaItems.length && !pagtrustItems.length ? "meta" : "pagtrust");
  const items = tab === "meta" ? metaItems : pagtrustItems;
  const total = items.reduce((s, x) => s + Number(x.count || x.value || 0), 0) || 1;
  const source = tab === "meta" ? DATA_SOURCE.META : DATA_SOURCE.PAGTRUST;
  const note =
    tab === "meta"
      ? CHART_DATA_SOURCES.salesBySource.meta.note
      : CHART_DATA_SOURCES.salesBySource.pagtrust.note;

  return (
    <DashboardCard title="Vendas por Fonte" source={source} sourceNote={note}>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <button
          type="button"
          onClick={() => setTab("pagtrust")}
          style={{
            padding: "0.35rem 0.65rem",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: tab === "pagtrust" ? "rgba(212,175,55,0.15)" : "transparent",
            color: "var(--hooko-text-muted)",
            fontSize: "0.72rem",
            cursor: "pointer",
          }}
        >
          UTM (PagTrust)
        </button>
        <button
          type="button"
          onClick={() => setTab("meta")}
          style={{
            padding: "0.35rem 0.65rem",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: tab === "meta" ? "rgba(212,175,55,0.15)" : "transparent",
            color: "var(--hooko-text-muted)",
            fontSize: "0.72rem",
            cursor: "pointer",
          }}
        >
          Plataforma (Meta)
        </button>
      </div>
      {items.length ? (
        <table className={styles.listTable}>
          <thead>
            <tr>
              <th>Fonte</th>
              <th>{tab === "meta" ? "Cliques" : "Vendas"}</th>
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
          {tab === "meta"
            ? "Sem breakdown publisher_platform — sincronize ads com entrega."
            : "Sem utm_source nas vendas PagTrust."}
        </p>
      )}
    </DashboardCard>
  );
}
