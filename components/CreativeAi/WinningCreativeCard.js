"use client";

import ExternalImage from "@/components/ExternalMedia/ExternalImage";
import { scoreTone } from "@/lib/ai-creative-analysis";
import styles from "./creativeAi.module.css";

const METRICS = [
  { key: "gancho", label: "Gancho" },
  { key: "retencao", label: "Retenção" },
  { key: "oferta", label: "Oferta" },
  { key: "prova", label: "Prova" },
  { key: "cta", label: "CTA" },
  { key: "formato", label: "Formato" },
];

function toneClass(tone) {
  if (tone === "good") return styles.scoreGood;
  if (tone === "mid") return styles.scoreMid;
  if (tone === "low") return styles.scoreLow;
  return styles.scoreMuted;
}

/**
 * @param {{
 *   title?: string;
 *   headline?: string;
 *   thumbnailUrl?: string | null;
 *   analysis: ReturnType<import("@/lib/ai-creative-analysis").normalizeAiCreativeAnalysis>;
 * }} props
 */
export default function WinningCreativeCard({
  title = "Criativo vencedor",
  headline = "",
  thumbnailUrl = null,
  analysis,
}) {
  const score = analysis?.performanceScore;

  return (
    <article className={styles.card} aria-label={title}>
      <h3 className={styles.cardTitle}>{title}</h3>

      {analysis?.pending ? (
        <p className={styles.pendingBadge}>A IA preenche após analisar o vídeo importado</p>
      ) : null}

      <div className={styles.winningTop}>
        <div className={styles.thumb}>
          <ExternalImage
            src={thumbnailUrl || "/imagens/meta.png"}
            alt=""
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
        </div>
        <div className={styles.scoreBlock}>
          <strong>{score != null ? score : "—"}</strong>
          <span>Score de performance</span>
          {score != null ? (
            <span className={styles.scoreTrend} aria-hidden>
              ↑ IA
            </span>
          ) : null}
          {headline ? (
            <span className={styles.headlineHint}>{headline}</span>
          ) : null}
        </div>
      </div>

      <div className={styles.metricList}>
        {METRICS.map((metric) => {
          const value = analysis?.scores?.[metric.key];
          const width = value != null ? `${value}%` : "8%";
          return (
            <div key={metric.key} className={styles.metricRow}>
              <span className={styles.metricLabel}>{metric.label}</span>
              <div className={styles.metricTrack}>
                <div
                  className={`${styles.metricFill} ${value == null ? styles.metricFillMuted : ""}`}
                  style={{ width }}
                />
              </div>
              <span className={styles.metricValue}>{value != null ? value : "—"}</span>
            </div>
          );
        })}
      </div>

      {analysis?.scalePotential ? (
        <p className={styles.scaleBadge}>
          <span aria-hidden>↑</span> {analysis.scalePotential}
        </p>
      ) : null}
    </article>
  );
}

export { toneClass, METRICS };
