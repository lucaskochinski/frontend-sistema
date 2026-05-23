"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import DashboardCard from "./DashboardCard";
import { CHART_DATA_SOURCES, DATA_SOURCE } from "./metaDataSources";
import { CHART_GRID, CHART_TICK, chartTooltipStyle, DASHBOARD_COLORS } from "./dashboardTheme";
import styles from "./dashboard.module.css";

export default function SalesByDayOfWeekChart({ data = [] }) {
  const hasData = data.some((d) => Number(d.count || 0) > 0);

  return (
    <DashboardCard
      title="Vendas por Dia da Semana"
      source={DATA_SOURCE.PAGTRUST}
      sourceNote={CHART_DATA_SOURCES.salesByDayOfWeek.note}
      bodyClassName={styles.chartAreaMed}
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: CHART_TICK, fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={chartTooltipStyle()} />
            <Bar dataKey="count" name="Vendas" fill={DASHBOARD_COLORS.accent} radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className={styles.emptyText}>Sem vendas PagTrust no período.</p>
      )}
    </DashboardCard>
  );
}
