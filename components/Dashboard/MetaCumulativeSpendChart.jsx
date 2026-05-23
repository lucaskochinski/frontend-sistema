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

/** Gasto Meta acumulado dia a dia (série dailyMeta). */
export default function MetaCumulativeSpendChart({ data = [] }) {
  let acc = 0;
  const series = (data || []).map((row) => {
    acc += Number(row.spend || 0);
    return {
      label: row.label || row.date,
      investimentoAcum: Math.round(acc * 100) / 100,
    };
  });

  const hasData = series.some((d) => d.investimentoAcum > 0);

  return (
    <DashboardCard
      title="Investimento Meta acumulado (por dia)"
      source={DATA_SOURCE.META}
      sourceNote="Soma cumulativa de spend · time_increment=1"
      accent
      bodyClassName={styles.chartArea}
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradMetaInvestAcum" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={DASHBOARD_COLORS.spend} stopOpacity={0.5} />
                <stop offset="95%" stopColor={DASHBOARD_COLORS.spend} stopOpacity={0} />
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
              dataKey="investimentoAcum"
              name="Gasto acumulado"
              stroke={DASHBOARD_COLORS.spend}
              fill="url(#gradMetaInvestAcum)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className={styles.emptyText}>Sem gasto Meta no período.</p>
      )}
    </DashboardCard>
  );
}
