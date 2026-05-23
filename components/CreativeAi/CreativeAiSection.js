"use client";

import {
  WinningCreativeCard,
  AiInsightsPanel,
  CreativeAnalysisGrid,
  HookoAiCoach,
} from "@/components/CreativeAi";
import { mapInsightToGridItem, normalizeAiCreativeAnalysis } from "@/lib/ai-creative-analysis";
import styles from "./creativeAi.module.css";

/**
 * Secção completa inspirada nos cards da referência visual — dados vindos da IA.
 * @param {{
 *   insights?: Array<Record<string, unknown>>;
 *   featured?: Record<string, unknown> | null;
 *   videoMetrics?: Record<string, unknown> | null;
 *   showCoach?: boolean;
 * }} props
 */
export default function CreativeAiSection({
  insights = [],
  featured = null,
  videoMetrics = null,
  showCoach = true,
}) {
  const gridItems = insights.map(mapInsightToGridItem);
  const top =
    featured ||
    [...insights].sort((a, b) => {
      const sa = normalizeAiCreativeAnalysis(a?.aiAnalysis, { aiUi: a?.aiUi }).performanceScore || 0;
      const sb = normalizeAiCreativeAnalysis(b?.aiAnalysis, { aiUi: b?.aiUi }).performanceScore || 0;
      return sb - sa;
    })[0] ||
    null;

  const featuredAnalysis = normalizeAiCreativeAnalysis(top?.aiAnalysis, {
    aiUi: top?.aiUi,
    rollup: top?.rollup,
  });

  return (
    <section className={styles.section} aria-label="Análise de criativos pela IA">
      <div className={styles.layout}>
        <WinningCreativeCard
          headline={top?.adName || top?.headline || ""}
          thumbnailUrl={top?.thumbnailUrl || top?.thumbnail_url || null}
          analysis={featuredAnalysis}
        />
        <AiInsightsPanel analysis={featuredAnalysis} />
      </div>

      <CreativeAnalysisGrid items={gridItems} />

      {showCoach ? <HookoAiCoach /> : null}
    </section>
  );
}
