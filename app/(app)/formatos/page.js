"use client";

import { useState } from "react";
import styles from "./page.module.css";

const INITIAL_FORMATS = [
  {
    id: "f1",
    name: "Stories & Reels (Vertical)",
    ratio: "9:16",
    widthPct: 40,
    heightPct: 80,
    dimensions: "1080 x 1920 px",
    description: "Formato padrão para Stories do Instagram, Facebook e Reels. Essencial para criativos UGC e vídeos de conversão direta.",
    syncedCount: 18,
    category: "Recomendado",
    tagType: "gold"
  },
  {
    id: "f2",
    name: "Feed Quadrado",
    ratio: "1:1",
    widthPct: 70,
    heightPct: 70,
    dimensions: "1080 x 1080 px",
    description: "O formato mais versátil. Excelente ocupação de tela nos feeds do Instagram e Facebook. Suporta imagens e vídeos.",
    syncedCount: 14,
    category: "Estático/Vídeo",
    tagType: "blue"
  },
  {
    id: "f3",
    name: "Feed Retrato (Vertical)",
    ratio: "4:5",
    widthPct: 65,
    heightPct: 80,
    dimensions: "1080 x 1350 px",
    description: "Maximiza a área vertical visível no feed do Instagram, superando o modelo quadrado e garantindo maior retenção visual.",
    syncedCount: 9,
    category: "Engajamento",
    tagType: "gold"
  },
  {
    id: "f4",
    name: "Landscape (Horizontal)",
    ratio: "16:9",
    widthPct: 80,
    heightPct: 45,
    dimensions: "1920 x 1080 px",
    description: "Ideal para canais de vídeo tradicionais como YouTube Ads e posicionamentos in-stream ou de rede de audiência.",
    syncedCount: 3,
    category: "Tradicional",
    tagType: "blue"
  },
  {
    id: "f5",
    name: "Carrossel Dinâmico",
    ratio: "1:1 (Multi)",
    widthPct: 70,
    heightPct: 70,
    dimensions: "1080 x 1080 px (x10)",
    description: "Permite listar múltiplos ângulos de produto ou contar uma narrativa visual interativa usando múltiplos cards.",
    syncedCount: 7,
    category: "Multi-Card",
    tagType: "blue"
  }
];

export default function FormatosPage() {
  const [formats, setFormats] = useState(INITIAL_FORMATS);
  const [filter, setFilter] = useState("all");

  const filteredFormats = formats.filter(f => {
    if (filter === "all") return true;
    if (filter === "vertical") return f.ratio === "9:16" || f.ratio === "4:5";
    if (filter === "square") return f.ratio.startsWith("1:1");
    return true;
  });

  return (
    <div className={styles.page}>
      {/* Top Header */}
      <div className={styles.topHeader}>
        <div className={styles.topHeaderGlow} />
        <div className={styles.topHeaderInner}>
          <div className={styles.topHeaderMain}>
            <div className={styles.topIconWrap}>
              <svg
                className={styles.topIconSvg}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinejoin="round" />
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" strokeLinejoin="round" opacity="0.85" />
              </svg>
            </div>
            <div className={styles.topTitleBlock}>
              <h1 className={styles.topPageTitle}>Formatos de Criativos</h1>
              <p className={styles.topHint}>
                Gerencie, categorize e inspecione a distribuição de formatos dos seus anúncios importados da Meta Ads.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button
          className={`${styles.btn} ${filter === "all" ? styles.btnPrimary : ""}`}
          onClick={() => setFilter("all")}
        >
          Todos os Formatos ({formats.length})
        </button>
        <button
          className={`${styles.btn} ${filter === "vertical" ? styles.btnPrimary : ""}`}
          onClick={() => setFilter("vertical")}
        >
          Verticais (9:16 / 4:5)
        </button>
        <button
          className={`${styles.btn} ${filter === "square" ? styles.btnPrimary : ""}`}
          onClick={() => setFilter("square")}
        >
          Quadrados (1:1)
        </button>
      </div>

      {/* Formats Grid */}
      <div className={styles.grid}>
        {filteredFormats.map((item) => (
          <div key={item.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.formatTitle}>{item.name}</h2>
              <span
                className={`${styles.badge} ${
                  item.tagType === "gold" ? styles.badgeGold : styles.badgeBlue
                }`}
              >
                {item.category}
              </span>
            </div>

            <div className={styles.cardBody}>
              {/* Aspect Ratio Box Visualizer */}
              <div className={styles.aspectPreviewBox}>
                <div
                  className={styles.ratioRepresentation}
                  style={{
                    width: `${item.widthPct}%`,
                    height: `${item.heightPct}%`,
                  }}
                >
                  {item.ratio}
                </div>
              </div>

              <div className={styles.metaInfo}>
                <h3 className={styles.dimensionText}>{item.dimensions}</h3>
                <p className={styles.descriptionText}>{item.description}</p>
              </div>
            </div>

            <div className={styles.statRow}>
              <span className={styles.statLabel}>Criativos Vinculados</span>
              <span className={styles.statValue}>{item.syncedCount} ativos</span>
            </div>

            <div className={styles.cardFooter}>
              <button className={`${styles.btn} ${styles.btnPrimary}`}>
                Filtrar Anúncios
              </button>
              <button className={styles.btn}>
                Diretrizes de Design
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
