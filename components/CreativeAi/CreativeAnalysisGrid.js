"use client";

import Link from "next/link";
import ExternalImage from "@/components/ExternalMedia/ExternalImage";
import { scoreTone } from "@/lib/ai-creative-analysis";
import styles from "./creativeAi.module.css";
import { toneClass } from "./WinningCreativeCard";

/**
 * @param {{
 *   title?: string;
 *   subtitle?: string;
 *   items?: Array<{ adId?: string; adName?: string; thumbnailUrl?: string; score?: number | null; pending?: boolean; href?: string | null }>;
 *   limit?: number;
 * }} props
 */
export default function CreativeAnalysisGrid({
  title = "Análise de criativos",
  subtitle = "Scores preenchidos pela IA após importar vídeos da Meta.",
  items = [],
  limit = 6,
}) {
  const visible = items.slice(0, limit);

  return (
    <section className={styles.gridWrap} aria-labelledby="creative-ai-grid-title">
      <div className={styles.sectionHead}>
        <div>
          <h2 id="creative-ai-grid-title" className={styles.sectionTitle}>
            {title}
          </h2>
          <p className={styles.sectionHint}>{subtitle}</p>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className={styles.sectionHint}>Importe criativos na biblioteca — a IA preenche os scores aqui.</p>
      ) : (
        <div className={styles.grid}>
          {visible.map((item) => {
            const tone = scoreTone(item.score);
            const inner = (
              <>
                <div className={styles.gridThumb}>
                  <ExternalImage
                    src={item.thumbnailUrl || "/imagens/meta.png"}
                    alt=""
                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  />
                  <span className={styles.playOverlay} aria-hidden>
                    ▶
                  </span>
                </div>
                <p className={`${styles.gridScore} ${toneClass(tone)}`}>
                  {item.pending || item.score == null ? "…" : item.score}
                </p>
              </>
            );

            if (item.href) {
              return (
                <Link key={item.adId || item.adName} href={item.href} className={styles.gridItem} title={item.adName}>
                  {inner}
                </Link>
              );
            }

            return (
              <div key={item.adId || item.adName} className={styles.gridItem}>
                {inner}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
