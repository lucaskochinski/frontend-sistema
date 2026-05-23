"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import DashboardCard from "./DashboardCard";
import { CHART_DATA_SOURCES, DATA_SOURCE } from "./metaDataSources";
import { formatBRL } from "@/components/MetaMetrics/MetaMetricsPanel";
import { CHART_GRID, CHART_TICK, chartTooltipStyle, DASHBOARD_COLORS } from "./dashboardTheme";
import styles from "./dashboard.module.css";

export default function SalesByDayOfWeekChart({ data = [], variant = "pagtrust" }) {
  const isMeta = variant === "meta";
  const hasData = data.some((d) => Number(d.count || 0) > 0);

  return (
    <DashboardCard
      title={isMeta ? "Gasto Meta por dia da semana" : "Vendas por Dia da Semana"}
      source={isMeta ? DATA_SOURCE.META : DATA_SOURCE.PAGTRUST}
      sourceNote={
        isMeta ? "Agregado a partir de spend diário (dailyMeta)" : CHART_DATA_SOURCES.salesByDayOfWeek.note
      }
      bodyClassName={styles.chartAreaMed}
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: CHART_TICK, fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={chartTooltipStyle()}
              formatter={(val) => [isMeta ? formatBRL(val) : val, isMeta ? "Gasto" : "Vendas"]}
            />
            <Bar
              dataKey="count"
              name={isMeta ? "Gasto" : "Vendas"}
              fill={isMeta ? DASHBOARD_COLORS.spend : DASHBOARD_COLORS.accent}
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className={styles.emptyText}>
          {isMeta ? "Sem gasto Meta no período." : "Sem vendas PagTrust no período."}
        </p>
      )}
    </DashboardCard>
  );
}
