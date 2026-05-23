"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { formatBRL } from "@/components/MetaMetrics/MetaMetricsPanel";
import DashboardCard from "./DashboardCard";
import { CHART_DATA_SOURCES, DATA_SOURCE } from "./metaDataSources";
import { CHART_GRID, CHART_TICK, chartTooltipStyle, DASHBOARD_COLORS } from "./dashboardTheme";
import styles from "./dashboard.module.css";

export default function MetaDailySpendChart({ data = [] }) {
  return (
    <DashboardCard
      title="Investimento Meta por dia"
      source={DATA_SOURCE.META}
      sourceNote={CHART_DATA_SOURCES.metaDailySpend.note}
      bodyClassName={styles.chartAreaTall}
    >
      {data.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: CHART_TICK, fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: CHART_TICK, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
            <Tooltip contentStyle={chartTooltipStyle()} formatter={(val) => formatBRL(val)} />
            <Bar dataKey="spend" name="Gasto" fill={DASHBOARD_COLORS.spend} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className={styles.emptyText}>Sem dados de gasto Meta no período.</p>
      )}
    </DashboardCard>
  );
}
