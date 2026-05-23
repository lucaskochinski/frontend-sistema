"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { formatBRL } from "@/components/MetaMetrics/MetaMetricsPanel";
import DashboardCard from "./DashboardCard";
import { CHART_DATA_SOURCES, DATA_SOURCE } from "./metaDataSources";
import { CHART_GRID, CHART_TICK, chartTooltipStyle, DASHBOARD_COLORS } from "./dashboardTheme";
import styles from "./dashboard.module.css";

export default function ProfitByHourChart({ data = [], variant = "pagtrust" }) {
  const isMeta = variant === "meta";
  const hasData = data.some((d) => Number(d.lucro || 0) !== 0 || Number(d.receita || 0) > 0);

  return (
    <DashboardCard
      title={isMeta ? "Lucro atribuído Meta por horário" : "Lucro por Horário"}
      hint={
        isMeta
          ? "Receita atribuída rateada pelo gasto horário − spend Meta"
          : "Receita PagTrust − gasto Meta rateado por hora"
      }
      source={isMeta ? DATA_SOURCE.META : DATA_SOURCE.CALCULATED}
      sourceNote={
        isMeta
          ? "hourly_stats + purchaseRevenue do período"
          : CHART_DATA_SOURCES.profitByHour.note
      }
      bodyClassName={styles.chartArea}
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
            <XAxis dataKey="hora" tick={{ fill: CHART_TICK, fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: CHART_TICK, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
            <Tooltip contentStyle={chartTooltipStyle()} formatter={(val) => [formatBRL(val), "Lucro"]} />
            <Bar dataKey="lucro" radius={[4, 4, 0, 0]} maxBarSize={28}>
              {data.map((entry, i) => (
                <Cell key={i} fill={Number(entry.lucro) >= 0 ? DASHBOARD_COLORS.profit : DASHBOARD_COLORS.loss} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className={styles.emptyText}>
          {isMeta ? "Sem gasto horário Meta no período." : "Sem vendas no período para calcular lucro horário."}
        </p>
      )}
    </DashboardCard>
  );
}
