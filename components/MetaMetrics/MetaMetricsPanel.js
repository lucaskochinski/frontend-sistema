"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const chartTooltip = {
  backgroundColor: "#1f2937",
  border: "none",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#fff",
};

function MetricCard({ label, value, sub }) {
  return (
    <div style={{ background: "#161822", border: "1px solid #2d3042", borderRadius: "10px", padding: "0.85rem 1rem" }}>
      <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>{label}</p>
      <p style={{ margin: "0.25rem 0 0", fontSize: "1.15rem", fontWeight: 700, color: "#f3f4f6" }}>{value}</p>
      {sub ? <p style={{ margin: "0.2rem 0 0", fontSize: "0.68rem", color: "#6b7280" }}>{sub}</p> : null}
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? "1rem" : "1.25rem" }}>
      <section>
        <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", color: "#e5e7eb" }}>Entrega (Meta Ads)</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.65rem" }}>
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
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", color: "#e5e7eb" }}>Vídeo (Meta)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.65rem" }}>
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
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", color: "#e5e7eb" }}>Saúde do criativo (Meta)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.65rem" }}>
            {qualityRanking ? <MetricCard label="Quality ranking" value={qualityRanking} /> : null}
            {engagementRanking ? <MetricCard label="Engagement ranking" value={engagementRanking} /> : null}
            {conversionRanking ? <MetricCard label="Conversion ranking" value={conversionRanking} /> : null}
            {h.creativeDiversityScore ? <MetricCard label="Diversidade criativa" value={h.creativeDiversityScore} sub={h.creativeDiversityLabel || null} /> : null}
            {h.canvasAvgViewPercent != null ? <MetricCard label="Canvas view %" value={`${h.canvasAvgViewPercent}%`} /> : null}
          </div>
        </section>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "1fr 1fr", gap: "1rem" }}>
        {Array.isArray(videoRetention) && videoRetention.some((s) => s.value > 0) ? (
          <div style={{ background: "#1e202e", border: "1px solid #2d3042", borderRadius: "12px", padding: "1rem", minHeight: 260 }}>
            <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "#d1d5db" }}>Retenção por quartis</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={videoRetention}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={(x) => `${x}%`} domain={[0, 100]} />
                <Tooltip contentStyle={chartTooltip} formatter={(val, _n, p) => [`${Number(val).toFixed(1)}% (${formatNum(p.payload.value)} views)`, "Retenção"]} />
                <Bar dataKey="pct" fill="#d4af37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null}

        {Array.isArray(videoPlayCurve) && videoPlayCurve.length > 0 ? (
          <div style={{ background: "#1e202e", border: "1px solid #2d3042", borderRadius: "12px", padding: "1rem", minHeight: 260 }}>
            <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "#d1d5db" }}>Curva de retenção (Meta)</h4>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={videoPlayCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={(x) => `${x}%`} domain={[0, 100]} />
                <Tooltip contentStyle={chartTooltip} formatter={(val) => [`${Number(val).toFixed(1)}%`, "Audiência"]} />
                <Line type="monotone" dataKey="pct" stroke="#60a5fa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>

      {Array.isArray(breakdownItems) && breakdownItems.length > 0 ? (
        <section>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", color: "#e5e7eb" }}>
            Breakdown Meta {breakdownLabel ? `· ${breakdownLabel}` : ""}
          </h3>
          <div style={{ overflowX: "auto", border: "1px solid #2d3042", borderRadius: "10px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
              <thead>
                <tr style={{ background: "#161822", color: "#9ca3af", textAlign: "left" }}>
                  <th style={{ padding: "0.6rem" }}>Segmento</th>
                  <th style={{ padding: "0.6rem" }}>Gasto</th>
                  <th style={{ padding: "0.6rem" }}>Impr.</th>
                  <th style={{ padding: "0.6rem" }}>CTR</th>
                  <th style={{ padding: "0.6rem" }}>Hook 3s</th>
                  <th style={{ padding: "0.6rem" }}>Ret. 75%</th>
                  <th style={{ padding: "0.6rem" }}>Compras</th>
                </tr>
              </thead>
              <tbody>
                {breakdownItems.map((row) => (
                  <tr key={row.dimension} style={{ borderTop: "1px solid #2d3042", color: "#e5e7eb" }}>
                    <td style={{ padding: "0.6rem" }}>{row.dimension}</td>
                    <td style={{ padding: "0.6rem" }}>{formatBRL(row.spend)}</td>
                    <td style={{ padding: "0.6rem" }}>{formatNum(row.impressions)}</td>
                    <td style={{ padding: "0.6rem" }}>{row.ctr != null ? `${Number(row.ctr).toFixed(2)}%` : "—"}</td>
                    <td style={{ padding: "0.6rem" }}>{row.hookRatePct != null ? `${row.hookRatePct}%` : "—"}</td>
                    <td style={{ padding: "0.6rem" }}>{row.retention75Pct != null ? `${row.retention75Pct}%` : "—"}</td>
                    <td style={{ padding: "0.6rem" }}>{formatNum(row.purchases)}</td>
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
