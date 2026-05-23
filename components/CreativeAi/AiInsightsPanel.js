"use client";

import { scoreTone } from "@/lib/ai-creative-analysis";
import styles from "./creativeAi.module.css";
import { toneClass } from "./WinningCreativeCard";

const ICONS = {
  gancho: "◎",
  prova: "✓",
  oferta: "◆",
  cta: "→",
};

/**
 * @param {{
 *   analysis: ReturnType<import("@/lib/ai-creative-analysis").normalizeAiCreativeAnalysis>;
 * }} props
 */
export default function AiInsightsPanel({ analysis }) {
  return (
    <article className={styles.card} aria-label="Insights da IA">
      <h3 className={styles.cardTitle}>Insights da IA</h3>

      {analysis?.pending ? (
        <p className={styles.pendingBadge}>Scores e textos gerados automaticamente pelo Gemini</p>
      ) : null}

      <div className={styles.insightList}>
        {(analysis?.insights || []).map((item) => {
          const tone = scoreTone(item.score);
          return (
            <div key={item.key} className={styles.insightRow}>
              <span className={styles.insightIcon} aria-hidden>
                {ICONS[item.key] || "•"}
              </span>
              <div>
                <p className={styles.insightTitle}>
                  {item.title}
                  {item.score != null ? ` (${item.score}%)` : ""}
                </p>
                <p className={styles.insightDesc}>{item.description}</p>
              </div>
              <span className={`${styles.insightScore} ${toneClass(tone)}`}>
                {item.score != null ? `${item.score}%↑` : "—"}
              </span>
            </div>
          );
        })}
      </div>

      <div className={styles.probabilityBox}>
        <p className={styles.probabilityLabel}>Probabilidade de sucesso</p>
        <p className={styles.probabilityValue}>
          {analysis?.successProbability != null ? `${analysis.successProbability}%` : "—"}
        </p>
      </div>
    </article>
  );
}
