"use client";

import { useId, useMemo } from "react";
import DashboardCard from "./DashboardCard";
import { CHART_DATA_SOURCES, DATA_SOURCE } from "./metaDataSources";
import { DASHBOARD_COLORS } from "./dashboardTheme";
import styles from "./dashboard.module.css";

function buildSmoothFunnelPath(values, width, height, padY = 12) {
  const n = values.length;
  if (n === 0) return "";

  const max = Math.max(1, values[0]);
  const cy = height / 2;
  const halfH = Math.max(8, (height - padY * 2) / 2);

  const scaleY = (v) => (Number(v) / max) * halfH;
  const xAt = (i) => (i / n) * width;

  const top = [];
  const bottom = [];
  for (let i = 0; i <= n; i += 1) {
    const v = i < n ? values[i] : values[n - 1];
    const x = xAt(i);
    top.push([x, cy - scaleY(v)]);
    bottom.push([x, cy + scaleY(v)]);
  }

  let d = `M ${top[0][0]} ${top[0][1]}`;
  for (let i = 1; i < top.length; i += 1) {
    const prev = top[i - 1];
    const curr = top[i];
    const cpx = (prev[0] + curr[0]) / 2;
    d += ` C ${cpx} ${prev[1]}, ${cpx} ${curr[1]}, ${curr[0]} ${curr[1]}`;
  }

  const lastB = bottom[bottom.length - 1];
  d += ` L ${lastB[0]} ${lastB[1]}`;

  for (let i = bottom.length - 2; i >= 0; i -= 1) {
    const next = bottom[i + 1];
    const curr = bottom[i];
    const cpx = (next[0] + curr[0]) / 2;
    d += ` C ${cpx} ${next[1]}, ${cpx} ${curr[1]}, ${curr[0]} ${curr[1]}`;
  }

  d += " Z";
  return d;
}

/**
 * Funil UTMify: Cliques → Vis. Página → ICs (Meta) → Vendas Inic. / Apr. (PagTrust ou Meta).
 */
export default function MetaConversionFunnel({ funnel, salesInitiated, salesApproved }) {
  const gradId = useId().replace(/:/g, "");

  const steps = useMemo(() => {
    const f = funnel || {};
    const clicks = Number(f.clicks ?? f.cliques ?? 0);
    const pageViews = Number(f.pageViews ?? 0);
    const ics = Number(f.initiateCheckouts ?? 0);

    const initiated =
      salesInitiated != null && salesInitiated !== undefined
        ? Number(salesInitiated)
        : Number(f.addToCart ?? 0);

    const approved =
      salesApproved != null && salesApproved !== undefined
        ? Number(salesApproved)
        : Number(f.purchasesMeta ?? f.purchases ?? 0);

    const base = Math.max(1, clicks);

    return [
      { label: "Cliques", value: clicks, pct: 100, source: "meta" },
      {
        label: "Vis. Página",
        value: pageViews,
        pct: (pageViews / base) * 100,
        source: "meta",
      },
      { label: "ICs", value: ics, pct: (ics / base) * 100, source: "meta" },
      {
        label: "Vendas Inic.",
        value: initiated,
        pct: (initiated / base) * 100,
        source: salesInitiated != null ? "pagtrust" : "meta",
      },
      {
        label: "Vendas Apr.",
        value: approved,
        pct: (approved / base) * 100,
        source: salesApproved != null ? "pagtrust" : "meta",
      },
    ];
  }, [funnel, salesInitiated, salesApproved]);

  const values = steps.map((s) => s.value);
  const hasData = values.some((v) => v > 0);
  const viewW = 900;
  const viewH = 200;
  const pathD = buildSmoothFunnelPath(values, viewW, viewH);

  return (
    <DashboardCard
      title="Funil de Conversão (Meta Ads)"
      source={DATA_SOURCE.META}
      sourceNote={CHART_DATA_SOURCES.metaFunnel.note}
      bodyClassName={styles.funnelFlowWrap}
    >
      {!hasData ? (
        <p className={styles.emptyText}>
          Sem dados de funil — importe anúncios com entrega Meta e conecte PagTrust para vendas aprovadas.
        </p>
      ) : (
        <>
          <div className={styles.funnelFlowHead}>
            <span className={styles.funnelFlowHint}>
              Base 100% = cliques Meta · Vendas = PagTrust (fallback: eventos Meta)
            </span>
            <span
              className={styles.funnelInfoIcon}
              title="Meta: clicks, landing_page_view, initiate_checkout. PagTrust: vendas totais e aprovadas."
              aria-label="Informação sobre o funil"
            >
              i
            </span>
          </div>

          <div className={styles.funnelFlowLabels}>
            {steps.map((step) => (
              <span key={step.label} className={styles.funnelFlowLabel}>
                {step.label}
              </span>
            ))}
          </div>

          <div className={styles.funnelFlowChart}>
            <svg
              viewBox={`0 0 ${viewW} ${viewH}`}
              className={styles.funnelFlowSvg}
              preserveAspectRatio="none"
              role="img"
              aria-label="Funil de conversão"
            >
              <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={DASHBOARD_COLORS.funnelStart} />
                  <stop offset="45%" stopColor={DASHBOARD_COLORS.funnelMid} />
                  <stop offset="100%" stopColor={DASHBOARD_COLORS.funnelEnd} />
                </linearGradient>
              </defs>
              <path d={pathD} fill={`url(#${gradId})`} opacity={0.95} />
              {steps.slice(1).map((_, i) => {
                const x = ((i + 1) / steps.length) * viewW;
                return (
                  <line
                    key={`div-${i}`}
                    x1={x}
                    y1={8}
                    x2={x}
                    y2={viewH - 8}
                    stroke="rgba(212, 175, 55, 0.35)"
                    strokeWidth={1.5}
                  />
                );
              })}
            </svg>

            <div className={styles.funnelFlowPctRow}>
              {steps.map((step) => (
                <span key={`pct-${step.label}`} className={styles.funnelFlowPct}>
                  {step.pct >= 10 ? step.pct.toFixed(1) : step.pct.toFixed(1)}%
                </span>
              ))}
            </div>
          </div>

          <div className={styles.funnelFlowValues}>
            {steps.map((step) => (
              <span key={`val-${step.label}`} className={styles.funnelFlowValue}>
                {step.value.toLocaleString("pt-BR")}
              </span>
            ))}
          </div>
        </>
      )}
    </DashboardCard>
  );
}
