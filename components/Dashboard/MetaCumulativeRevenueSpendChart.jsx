"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatBRL } from "@/components/MetaMetrics/MetaMetricsPanel";
import DashboardCard from "./DashboardCard";
import { DATA_SOURCE } from "./metaDataSources";
import { CHART_GRID, CHART_TICK, chartTooltipStyle, DASHBOARD_COLORS } from "./dashboardTheme";
import styles from "./dashboard.module.css";

/** Receita atribuída × gasto × lucro Meta acumulados por dia (dailyMeta). */
export default function MetaCumulativeRevenueSpendChart({ data = [] }) {
  let accRevenue = 0;
  let accSpend = 0;
  const series = (data || []).map((row) => {
    accRevenue += Number(row.purchaseRevenue || 0);
    accSpend += Number(row.spend || 0);
    return {
      label: row.label || row.date,
      receitaAcum: Math.round(accRevenue * 100) / 100,
      investimentoAcum: Math.round(accSpend * 100) / 100,
      lucroAcum: Math.round((accRevenue - accSpend) * 100) / 100,
    };
  });

  const hasData = series.some((d) => d.receitaAcum > 0 || d.investimentoAcum > 0);

  return (
    <DashboardCard
      title="Receita × Investimento × Lucro Meta (acumulado por dia)"
      source={DATA_SOURCE.META}
      sourceNote="action_values:purchase + spend · ads importados no período"
      accent
      bodyClassName={styles.chartArea}
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradMetaReceitaAcum" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={DASHBOARD_COLORS.revenue} stopOpacity={0.5} />
                <stop offset="95%" stopColor={DASHBOARD_COLORS.revenue} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradMetaInvestAcumFull" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={DASHBOARD_COLORS.spend} stopOpacity={0.45} />
                <stop offset="95%" stopColor={DASHBOARD_COLORS.spend} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradMetaLucroAcum" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={DASHBOARD_COLORS.profit} stopOpacity={0.45} />
                <stop offset="95%" stopColor={DASHBOARD_COLORS.profit} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: CHART_TICK, fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fill: CHART_TICK, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `R$${v}`}
            />
            <Tooltip contentStyle={chartTooltipStyle()} formatter={(val) => formatBRL(val)} />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Area
              type="monotone"
              dataKey="receitaAcum"
              name="Receita atrib."
              stroke={DASHBOARD_COLORS.revenue}
              fill="url(#gradMetaReceitaAcum)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="investimentoAcum"
              name="Gasto"
              stroke={DASHBOARD_COLORS.spend}
              fill="url(#gradMetaInvestAcumFull)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="lucroAcum"
              name="Lucro atrib."
              stroke={DASHBOARD_COLORS.profit}
              fill="url(#gradMetaLucroAcum)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className={styles.emptyText}>Sem dados Meta acumulados no período.</p>
      )}
    </DashboardCard>
  );
}
