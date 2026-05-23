"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { formatBRL } from "@/components/MetaMetrics/MetaMetricsPanel";
import { DATA_SOURCE } from "./metaDataSources";
import { CHART_TICK, DASHBOARD_COLORS, HOOKO_GOLD, chartTooltipStyle } from "./dashboardTheme";
import styles from "./dashboard.module.css";

function formatCompactBRL(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "R$0";
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `R$${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k`;
  return `R$${Math.round(n)}`;
}

/** Receita atribuída Meta por dia (action_values purchase). */
export default function MetaRevenueChart({ data = [], dateRange }) {
  const series = (data || []).map((row) => ({
    label: row.label || row.date,
    valor: Number(row.purchaseRevenue || 0),
  }));
  const hasData = series.some((d) => d.valor > 0);

  return (
    <article className={styles.pagtrustRevenueCard}>
      <header className={styles.pagtrustRevenueHead}>
        <div>
          <h3 className={styles.pagtrustRevenueTitle}>Receita atribuída Meta</h3>
          {dateRange?.since && dateRange?.until ? (
            <p className={styles.pagtrustRevenueRange}>
              {dateRange.since} → {dateRange.until}
            </p>
          ) : null}
        </div>
        <div className={styles.pagtrustRevenueMeta}>
          <span className={styles.pagtrustTag}>Meta</span>
        </div>
      </header>

      <div className={styles.pagtrustRevenueChart}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: CHART_TICK, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={28}
              />
              <YAxis
                tick={{ fill: CHART_TICK, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={58}
                tickFormatter={formatCompactBRL}
              />
              <Tooltip
                contentStyle={chartTooltipStyle()}
                formatter={(val) => [formatBRL(val), "Receita atrib."]}
                labelFormatter={(label) => `Dia ${label}`}
              />
              <Line
                type="monotone"
                dataKey="valor"
                stroke={DASHBOARD_COLORS.revenue}
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: HOOKO_GOLD.bright,
                  stroke: DASHBOARD_COLORS.lineActive,
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className={styles.pagtrustEmpty}>
            Sem receita atribuída Meta no período — sincronize insights dos anúncios importados.
          </p>
        )}
      </div>
    </article>
  );
}

export { DATA_SOURCE };
