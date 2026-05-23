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
import { CHART_DATA_SOURCES, DATA_SOURCE } from "./metaDataSources";
import { CHART_GRID, CHART_TICK, chartTooltipStyle, DASHBOARD_COLORS } from "./dashboardTheme";
import styles from "./dashboard.module.css";

export default function CumulativeRevenueSpendChart({ data = [] }) {
  const hasData = data.some((d) => d.receita > 0 || d.investimento > 0);

  return (
    <DashboardCard
      title="Faturamento × Investimento × Lucro (acumulado por hora)"
      source={DATA_SOURCE.CALCULATED}
      sourceNote={CHART_DATA_SOURCES.cumulativeHourly.note}
      accent
      bodyClassName={styles.chartArea}
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={DASHBOARD_COLORS.revenue} stopOpacity={0.5} />
                <stop offset="95%" stopColor={DASHBOARD_COLORS.revenue} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradInvest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={DASHBOARD_COLORS.spend} stopOpacity={0.45} />
                <stop offset="95%" stopColor={DASHBOARD_COLORS.spend} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradLucro" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={DASHBOARD_COLORS.profit} stopOpacity={0.45} />
                <stop offset="95%" stopColor={DASHBOARD_COLORS.profit} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
            <XAxis dataKey="hora" tick={{ fill: CHART_TICK, fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: CHART_TICK, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
            <Tooltip contentStyle={chartTooltipStyle()} formatter={(val) => formatBRL(val)} />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Area type="monotone" dataKey="receitaAcum" name="Faturamento" stroke={DASHBOARD_COLORS.revenue} fill="url(#gradReceita)" strokeWidth={2} />
            <Area type="monotone" dataKey="investimentoAcum" name="Investimento" stroke={DASHBOARD_COLORS.spend} fill="url(#gradInvest)" strokeWidth={2} />
            <Area type="monotone" dataKey="lucroAcum" name="Lucro" stroke={DASHBOARD_COLORS.profit} fill="url(#gradLucro)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className={styles.emptyText}>Sem dados acumulados no período.</p>
      )}
    </DashboardCard>
  );
}
