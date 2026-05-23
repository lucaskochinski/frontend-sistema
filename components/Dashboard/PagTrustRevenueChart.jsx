"use client";

import { ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart } from "recharts";
import { formatBRL } from "@/components/MetaMetrics/MetaMetricsPanel";
import { CHART_DATA_SOURCES, DATA_SOURCE } from "./metaDataSources";
import { chartTooltipStyle } from "./dashboardTheme";
import styles from "./dashboard.module.css";

function formatCompactBRL(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "R$0";
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `R$${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k`;
  return `R$${Math.round(n)}`;
}

function IconExpand() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const PURPLE_TICK = "rgba(255,255,255,0.85)";

/**
 * Receita PagTrust por dia — card roxo estilo UTMify.
 */
export default function PagTrustRevenueChart({ data = [], dateRange }) {
  const hasData = data.some((d) => Number(d.valor || 0) > 0);

  return (
    <article className={styles.pagtrustRevenueCard}>
      <header className={styles.pagtrustRevenueHead}>
        <div>
          <h3 className={styles.pagtrustRevenueTitle}>Receitas PagTrust</h3>
          {dateRange?.since && dateRange?.until ? (
            <p className={styles.pagtrustRevenueRange}>
              {dateRange.since} → {dateRange.until}
            </p>
          ) : null}
        </div>
        <div className={styles.pagtrustRevenueMeta}>
          <span className={styles.pagtrustTag}>PagTrust</span>
          <span className={styles.pagtrustExpandBtn} title="Receita diária aprovada">
            <IconExpand />
          </span>
        </div>
      </header>

      <div className={styles.pagtrustRevenueChart}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
              <defs>
                <linearGradient id="pagtrustRevenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fff" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#fff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fill: PURPLE_TICK, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={28}
              />
              <YAxis
                tick={{ fill: PURPLE_TICK, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={58}
                tickFormatter={formatCompactBRL}
              />
              <Tooltip
                contentStyle={{ ...chartTooltipStyle(), backgroundColor: "rgba(0,0,0,0.85)" }}
                formatter={(val) => [formatBRL(val), "Receita"]}
                labelFormatter={(label) => `Dia ${label}`}
              />
              <Area
                type="monotone"
                dataKey="valor"
                stroke="#fff"
                strokeWidth={3}
                fill="url(#pagtrustRevenueFill)"
                dot={false}
                activeDot={{ r: 5, fill: "#fff", stroke: "#6366f1", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className={styles.pagtrustEmpty}>
            Sem receitas PagTrust no período — conecte o webhook para ver o gráfico.
            <span className={styles.pagtrustEmptyNote}>{CHART_DATA_SOURCES.pagtrustRevenue.note}</span>
          </p>
        )}
      </div>
    </article>
  );
}

export { DATA_SOURCE };
