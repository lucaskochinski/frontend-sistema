"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { apiFetch, getStoredOrganizationId } from "@/lib/hooko-session";

const CATEGORY_LABELS = {
  ugc: "UGC",
  hook: "Gancho",
  demo: "Demonstração",
  offer: "Oferta",
  story: "Storytelling",
  carousel: "Carrossel",
  static: "Estático",
  motion: "Motion",
  retarget: "Retargeting",
  tofu: "Topo de funil",
  mofu: "Meio de funil",
  bofu: "Fundo de funil",
  vsl: "VSL",
};

export default function FormatosPage() {
  const [formats, setFormats] = useState([]);
  const [templateLibrary, setTemplateLibrary] = useState([]);
  const [driveFolderUrl, setDriveFolderUrl] = useState("");
  const [totalImported, setTotalImported] = useState(0);
  const [unclassifiedCount, setUnclassifiedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("library");
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const loadFormats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const orgId = getStoredOrganizationId();
      if (!orgId) {
        setFormats([]);
        setTemplateLibrary([]);
        return;
      }

      const res = await apiFetch(`/api/dashboard/creative-formats?organizationId=${orgId}`);

      setFormats(Array.isArray(res?.items) ? res.items : []);
      setTemplateLibrary(Array.isArray(res?.templateLibrary) ? res.templateLibrary : []);
      setDriveFolderUrl(res?.driveFolderUrl || "");
      setTotalImported(Number(res?.totalImported) || 0);
      setUnclassifiedCount(Number(res?.unclassifiedCount) || 0);
    } catch (err) {
      console.error("Erro ao carregar formatos:", err);
      setError(err.message || "Não foi possível carregar os formatos.");
      setFormats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFormats();
  }, [loadFormats]);

  const filteredFormats = useMemo(() => {
    return formats.filter((f) => {
      if (filter === "all") return true;
      return f.filterGroup === filter;
    });
  }, [formats, filter]);

  const filteredTemplates = useMemo(() => {
    return templateLibrary.filter((t) => {
      if (categoryFilter === "all") return true;
      return t.category === categoryFilter;
    });
  }, [templateLibrary, categoryFilter]);

  const categories = useMemo(() => {
    const set = new Set(templateLibrary.map((t) => t.category));
    return Array.from(set).sort();
  }, [templateLibrary]);

  return (
    <div className={styles.page}>
      <div className={styles.topHeader}>
        <div className={styles.topHeaderGlow} aria-hidden />
        <div className={styles.topHeaderInner}>
          <div className={styles.topHeaderMain}>
            <div className={styles.topIconWrap}>
              <svg className={styles.topIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinejoin="round" />
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" strokeLinejoin="round" opacity="0.85" />
              </svg>
            </div>
            <div className={styles.topTitleBlock}>
              <h1 className={styles.topPageTitle}>Formatos de Criativos</h1>
              <p className={styles.topHint}>
                Biblioteca fixa de 50 formatos HOOKO + agrupamento real dos criativos importados da Meta.
              </p>
            </div>
          </div>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={loadFormats} disabled={loading}>
            {loading ? "A carregar…" : "Atualizar"}
          </button>
        </div>
      </div>

      <div className={styles.viewToggle}>
        <button
          type="button"
          className={`${styles.btn} ${view === "library" ? styles.btnPrimary : ""}`}
          onClick={() => setView("library")}
        >
          Biblioteca ({templateLibrary.length || 50})
        </button>
        <button
          type="button"
          className={`${styles.btn} ${view === "meta" ? styles.btnPrimary : ""}`}
          onClick={() => setView("meta")}
        >
          Meta importados ({formats.length})
        </button>
      </div>

      {error ? (
        <div className={styles.errorBox} role="alert">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className={styles.statusText}>A carregar formatos…</p>
      ) : view === "library" ? (
        <>
          {driveFolderUrl ? (
            <p className={styles.summaryText}>
              Assets no{" "}
              <a href={driveFolderUrl} target="_blank" rel="noopener noreferrer" className={styles.driveLink}>
                Google Drive HOOKO
              </a>
            </p>
          ) : null}

          <div className={styles.filterRow}>
            <button
              type="button"
              className={`${styles.btn} ${categoryFilter === "all" ? styles.btnPrimary : ""}`}
              onClick={() => setCategoryFilter("all")}
            >
              Todas categorias
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`${styles.btn} ${categoryFilter === cat ? styles.btnPrimary : ""}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>

          <div className={styles.templateGrid}>
            {filteredTemplates.map((item) => (
              <article key={item.id} className={styles.templateCard}>
                <div className={styles.templateHead}>
                  <span className={styles.templateNum}>#{item.sortOrder}</span>
                  <span className={styles.badge}>{CATEGORY_LABELS[item.category] || item.category}</span>
                </div>
                <h2 className={styles.formatTitle}>{item.name}</h2>
                <p className={styles.descriptionText}>{item.description}</p>
                <div className={styles.templateMeta}>
                  <span>{item.aspectRatio}</span>
                  {item.durationSec ? <span>{item.durationSec}s</span> : <span>Estático</span>}
                </div>
                <Link href="/criador-de-anuncio" className={`${styles.btn} ${styles.btnPrimary}`}>
                  Usar no criador
                </Link>
              </article>
            ))}
          </div>
        </>
      ) : totalImported === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>Nenhum criativo importado</h2>
          <p className={styles.emptyCopy}>
            Importe anúncios em <Link href="/criativo/biblioteca">Criativos → Biblioteca</Link>.
          </p>
        </div>
      ) : (
        <>
          <div className={styles.filterRow}>
            <button type="button" className={`${styles.btn} ${filter === "all" ? styles.btnPrimary : ""}`} onClick={() => setFilter("all")}>
              Todos ({formats.length})
            </button>
            <button type="button" className={`${styles.btn} ${filter === "vertical" ? styles.btnPrimary : ""}`} onClick={() => setFilter("vertical")}>
              Verticais
            </button>
            <button type="button" className={`${styles.btn} ${filter === "square" ? styles.btnPrimary : ""}`} onClick={() => setFilter("square")}>
              Quadrados
            </button>
            <button type="button" className={`${styles.btn} ${filter === "landscape" ? styles.btnPrimary : ""}`} onClick={() => setFilter("landscape")}>
              Horizontais
            </button>
            <button type="button" className={`${styles.btn} ${filter === "carousel" ? styles.btnPrimary : ""}`} onClick={() => setFilter("carousel")}>
              Carrossel
            </button>
          </div>

          <p className={styles.summaryText}>
            {totalImported} criativo(s) importado(s) · {formats.length} grupo(s) Meta · {unclassifiedCount} sem dimensões
          </p>

          <div className={styles.grid}>
            {filteredFormats.map((item) => (
              <div key={item.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.formatTitle}>{item.label}</h2>
                  {item.objectType ? <span className={`${styles.badge} ${styles.badgeBlue}`}>{item.objectType}</span> : null}
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.aspectPreviewBox}>
                    <div className={styles.ratioRepresentation} style={{ width: `${item.widthPct}%`, height: `${item.heightPct}%` }}>
                      {item.aspectRatio || item.label}
                    </div>
                  </div>
                  <div className={styles.metaInfo}>
                    {item.width && item.height ? (
                      <h3 className={styles.dimensionText}>
                        Meta: {item.width} × {item.height} px
                      </h3>
                    ) : (
                      <h3 className={styles.dimensionText}>{item.label}</h3>
                    )}
                  </div>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Criativos neste grupo</span>
                  <span className={styles.statValue}>{item.syncedCount}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
