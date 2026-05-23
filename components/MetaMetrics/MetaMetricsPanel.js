"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { chartTooltipStyle } from "@/components/Dashboard/dashboardTheme";
import styles from "./MetaMetricsPanel.module.css";

function MetricCard({ label, value, sub }) {
  return (
    <div className={styles.metricCard}>
      <p className={styles.metricLabel}>{label}</p>
      <p className={styles.metricValue}>{value}</p>
      {sub ? <p className={styles.metricSub}>{sub}</p> : null}
    </div>
  );
}

function formatNum(n) {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  return new Intl.NumberFormat("pt-BR").format(Number(n));
}

function formatBRL(val) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);
}

const META_RANKING_LABELS = {
  ABOVE_AVERAGE: "Acima da média",
  AVERAGE: "Na média",
  BELOW_AVERAGE: "Abaixo da média",
};

function formatMetaRanking(value) {
  if (!value) return null;
  const raw = String(value).trim();
  const upper = raw.toUpperCase();
  if (upper === "UNKNOWN" || upper === "N/A" || upper === "NONE") return null;
  if (META_RANKING_LABELS[upper]) return META_RANKING_LABELS[upper];
  const belowMatch = upper.match(/^BELOW_AVERAGE_(\d+)$/);
  if (belowMatch) return `Abaixo da média (${belowMatch[1]}%)`;
  const aboveMatch = upper.match(/^ABOVE_AVERAGE_(\d+)$/);
  if (aboveMatch) return `Acima da média (${aboveMatch[1]}%)`;
  return raw.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export default function MetaMetricsPanel({
  delivery,
  videoMetrics,
  videoRetention,
  videoPlayCurve,
  creativeHealth,
  breakdownItems,
  breakdownLabel,
  compact = false,
}) {
  const d = delivery || {};
  const v = videoMetrics || {};
  const h = creativeHealth || {};
  const qualityRanking = formatMetaRanking(h.qualityRanking);
  const engagementRanking = formatMetaRanking(h.engagementRateRanking);
  const conversionRanking = formatMetaRanking(h.conversionRateRanking);
  const showCreativeHealth =
    qualityRanking ||
    engagementRanking ||
    conversionRanking ||
    h.creativeDiversityScore ||
    h.creativeFatigueSummary;

  const hasPlayCurve = Array.isArray(videoPlayCurve) && videoPlayCurve.length > 0;
  const showRetentionBars =
    !hasPlayCurve &&
    Array.isArray(videoRetention) &&
    videoRetention.some((s) => s.value > 0);

  return (
    <div className={`${styles.root} ${compact ? styles.rootCompact : ""}`}>
      <section>
        <h3 className={styles.sectionTitle}>Entrega (Meta Ads)</h3>
        <div className={styles.metricGrid}>
          <MetricCard label="Impressões" value={formatNum(d.impressions)} />
          <MetricCard label="Alcance" value={formatNum(d.reach)} />
          <MetricCard label="Frequência" value={d.frequency != null ? Number(d.frequency).toFixed(2) : "—"} />
          <MetricCard label="Cliques" value={formatNum(d.clicks)} />
          <MetricCard label="Cliques no link" value={formatNum(d.inlineLinkClicks)} />
          <MetricCard label="CTR" value={d.ctr != null ? `${Number(d.ctr).toFixed(2)}%` : "—"} />
          <MetricCard label="CPC" value={d.cpc != null ? formatBRL(d.cpc) : "—"} />
          <MetricCard label="CPM" value={d.cpm != null ? formatBRL(d.cpm) : "—"} />
          <MetricCard label="Gasto" value={formatBRL(d.spend)} />
          <MetricCard label="ROAS Meta" value={d.roas != null ? `${Number(d.roas).toFixed(2)}x` : "—"} />
          <MetricCard label="Receita atrib." value={formatBRL(d.purchaseRevenue)} />
          <MetricCard label="Cliques CTA" value={formatNum(d.callToActionClicks)} />
        </div>
      </section>

      {v.plays > 0 || v.watched3s > 0 ? (
        <section>
          <h3 className={styles.sectionTitle}>Vídeo (Meta)</h3>
          <div className={`${styles.metricGrid} ${styles.metricGridVideo}`}>
            <MetricCard label="Plays" value={formatNum(v.plays)} />
            <MetricCard label="Hook 3s" value={formatNum(v.watched3s)} sub={v.hookRatePct != null ? `${v.hookRatePct}% / impr.` : null} />
            <MetricCard label="2s contínuos" value={formatNum(v.watched2s)} />
            <MetricCard label="6 seg" value={formatNum(v.watched6s)} />
            <MetricCard label="15 seg" value={formatNum(v.watched15s)} />
            <MetricCard label="30 seg" value={formatNum(v.watched30s)} />
            <MetricCard label="75% vídeo" value={formatNum(v.watched75pct)} sub={v.retention75Pct != null ? `${v.retention75Pct}% retenção` : null} />
            <MetricCard label="100% vídeo" value={formatNum(v.watched100pct)} />
            <MetricCard label="ThruPlay" value={formatNum(v.thruplay)} />
            <MetricCard label="Tempo médio" value={v.avgWatchTimeSec != null ? `${v.avgWatchTimeSec}s` : "—"} />
          </div>
        </section>
      ) : null}

      {showCreativeHealth ? (
        <section>
          <h3 className={styles.sectionTitle}>Saúde do criativo (Meta)</h3>
          <div className={styles.metricGrid}>
            {qualityRanking ? <MetricCard label="Quality ranking" value={qualityRanking} /> : null}
            {engagementRanking ? <MetricCard label="Engagement ranking" value={engagementRanking} /> : null}
            {conversionRanking ? <MetricCard label="Conversion ranking" value={conversionRanking} /> : null}
            {h.creativeDiversityScore ? <MetricCard label="Diversidade criativa" value={h.creativeDiversityScore} sub={h.creativeDiversityLabel || null} /> : null}
            {h.canvasAvgViewPercent != null ? <MetricCard label="Canvas view %" value={`${h.canvasAvgViewPercent}%`} /> : null}
          </div>
        </section>
      ) : null}

      {showRetentionBars || hasPlayCurve ? (
        <div className={`${styles.chartsGrid} ${!showRetentionBars || !hasPlayCurve ? styles.chartsGridSingle : ""}`}>
          {hasPlayCurve ? (
            <div className={styles.chartBox}>
              <h4 className={styles.chartTitle}>Curva de retenção (Meta)</h4>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={videoPlayCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--hooko-divider)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "var(--hooko-text-muted)", fontSize: 9 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: "var(--hooko-text-muted)", fontSize: 10 }} tickFormatter={(x) => `${x}%`} domain={[0, 100]} width={42} />
                  <Tooltip contentStyle={chartTooltipStyle()} formatter={(val) => [`${Number(val).toFixed(1)}%`, "Audiência"]} />
                  <Line type="monotone" dataKey="pct" stroke="#60a5fa" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </div>
      ) : null}

      {Array.isArray(breakdownItems) && breakdownItems.length > 0 ? (
        <section>
          <h3 className={styles.sectionTitle}>
            Breakdown Meta {breakdownLabel ? `· ${breakdownLabel}` : ""}
          </h3>
          <div className={styles.breakdownTable}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th>Segmento</th>
                  <th>Gasto</th>
                  <th>Impr.</th>
                  <th>CTR</th>
                  <th>Hook 3s</th>
                  <th>Ret. 75%</th>
                  <th>Compras</th>
                </tr>
              </thead>
              <tbody>
                {breakdownItems.map((row) => (
                  <tr key={row.dimension} className={styles.tableRow}>
                    <td>{row.dimension}</td>
                    <td>{formatBRL(row.spend)}</td>
                    <td>{formatNum(row.impressions)}</td>
                    <td>{row.ctr != null ? `${Number(row.ctr).toFixed(2)}%` : "—"}</td>
                    <td>{row.hookRatePct != null ? `${row.hookRatePct}%` : "—"}</td>
                    <td>{row.retention75Pct != null ? `${row.retention75Pct}%` : "—"}</td>
                    <td>{formatNum(row.purchases)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export { formatBRL, formatNum };
