"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { formatBRL } from "@/components/MetaMetrics/MetaMetricsPanel";
import DashboardCard from "./DashboardCard";
import { CHART_DATA_SOURCES, DATA_SOURCE } from "./metaDataSources";
import { CHART_GRID, CHART_TICK, chartTooltipStyle, DASHBOARD_COLORS } from "./dashboardTheme";
import styles from "./dashboard.module.css";

export default function SalesByHourChart({ data = [], variant = "pagtrust" }) {
  const isMeta = variant === "meta";
  const valueKey = isMeta ? "valor" : "valor";
  const hasData = data.some((d) => Number(d.valor || d.receita || d.spend || 0) > 0);

  return (
    <DashboardCard
      title={isMeta ? "Gasto Meta por horário" : "Vendas por Horário"}
      source={isMeta ? DATA_SOURCE.META : DATA_SOURCE.PAGTRUST}
      sourceNote={
        isMeta
          ? "hourly_stats_aggregated_by_advertiser_time_zone"
          : CHART_DATA_SOURCES.salesByHour.note
      }
      bodyClassName={styles.chartAreaMed}
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
            <XAxis dataKey="hora" tick={{ fill: CHART_TICK, fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={chartTooltipStyle()}
              formatter={(val) => [formatBRL(val), isMeta ? "Gasto" : "Receita"]}
            />
            <Bar
              dataKey={valueKey}
              fill={isMeta ? DASHBOARD_COLORS.spend : DASHBOARD_COLORS.meta}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className={styles.emptyText}>
          {isMeta ? "Sem gasto horário Meta no período." : "Sem vendas PagTrust no período."}
        </p>
      )}
    </DashboardCard>
  );
}
