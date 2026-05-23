"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import DashboardCard from "./DashboardCard";
import { CHART_DATA_SOURCES, DATA_SOURCE } from "./metaDataSources";
import { chartTooltipStyle, DASHBOARD_COLORS } from "./dashboardTheme";
import styles from "./dashboard.module.css";

const DEFAULT_PAYMENTS = [
  { name: "Pix", value: 0, color: DASHBOARD_COLORS.pix },
  { name: "Cartão", value: 0, color: DASHBOARD_COLORS.card },
  { name: "Boleto", value: 0, color: DASHBOARD_COLORS.billet },
  { name: "Outros", value: 0, color: DASHBOARD_COLORS.other },
];

export default function SalesByPaymentDonut({ data, totalSales = 0 }) {
  const chartData = data?.length ? data : DEFAULT_PAYMENTS;
  const total = totalSales || chartData.reduce((s, x) => s + Number(x.value || 0), 0);

  return (
    <DashboardCard
      title="Vendas por Pagamento"
      source={DATA_SOURCE.PAGTRUST}
      sourceNote={CHART_DATA_SOURCES.salesByPayment.note}
    >
      <div className={styles.chartAreaMed}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={78}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, i) => (
                <Cell key={entry.name || i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={chartTooltipStyle()} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className={styles.donutTotal}>Total: {total}</p>
      <div className={styles.legendRow}>
        {chartData.map((p) => (
          <div key={p.name} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: p.color }} />
            {p.name}
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
