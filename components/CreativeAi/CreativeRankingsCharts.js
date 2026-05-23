"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { chartTooltipStyle } from "@/components/Dashboard/dashboardTheme";
import styles from "./CreativeRankingsCharts.module.css";

const FALLBACK_CHARTS = [
  {
    id: "bestHook",
    emoji: "🎣",
    title: "Melhores Hooks",
    subtitle: "views 3s / impressões",
    unit: "percent",
    color: "#d4af37",
    data: [],
  },
  {
    id: "bestRetention",
    emoji: "🎬",
    title: "Melhor Body Retention",
    subtitle: "75% assistidos / iniciados",
    unit: "percent",
    color: "#b8941f",
    data: [],
  },
  {
    id: "bestRoi",
    emoji: "📈",
    title: "Maior ROI %",
    subtitle: "retorno sobre investimento",
    unit: "percent",
    color: "#eab308",
    data: [],
  },
  {
    id: "bestRoas",
    emoji: "💰",
    title: "Maior ROAS",
    subtitle: "receita / investimento",
    unit: "multiplier",
    color: "#c9a227",
    data: [],
  },
];

function formatValue(value, unit) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  if (unit === "multiplier") return `${n.toFixed(2)}x`;
  return `${n.toFixed(1)}%`;
}

function RankingBarChart({ chart }) {
  const data = Array.isArray(chart.data) ? chart.data : [];
  const maxVal = data.reduce((m, row) => Math.max(m, Number(row.value) || 0), 0);
  const domainMax = maxVal > 0 ? Math.ceil(maxVal * 1.12 * 10) / 10 : 1;

  if (!data.length) {
    return <p className={styles.empty}>Sem dados no período — importe criativos com entrega Meta.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
        barCategoryGap="18%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--hooko-divider)" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, domainMax]}
          tick={{ fill: "var(--hooko-text-muted)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="shortName"
          width={88}
          tick={{ fill: "var(--hooko-text)", fontSize: 11, fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={chartTooltipStyle()}
          formatter={(val) => [formatValue(val, chart.unit), chart.title]}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ""}
        />
        <Bar dataKey="value" radius={[0, 10, 10, 0]} maxBarSize={22}>
          {data.map((entry) => (
            <Cell key={entry.adId || entry.shortName} fill={chart.color || "#d4af37"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function CreativeRankingsCharts({ charts }) {
  const list = charts?.length ? charts : FALLBACK_CHARTS;

  return (
    <section className={styles.section} aria-labelledby="creative-rankings-h">
      <div className={styles.sectionHead}>
        <div>
          <h2 id="creative-rankings-h" className={styles.sectionTitle}>
            Rankings por criativo
          </h2>
          <p className={styles.sectionHint}>
            Top anúncios importados em cada métrica — calculado sobre ads sincronizados no período
          </p>
        </div>
        <span className={styles.metaBadge}>Meta Ads</span>
      </div>

      <div className={styles.grid}>
        {list.map((chart) => (
          <article key={chart.id} className={styles.chartCard}>
            <header className={styles.chartHead}>
              <h3 className={styles.chartTitle}>
                <span className={styles.emoji} aria-hidden>
                  {chart.emoji}
                </span>
                {chart.title}
              </h3>
              <p className={styles.chartSubtitle}>{chart.subtitle}</p>
            </header>
            <div className={styles.chartBody}>
              <RankingBarChart chart={chart} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
