"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { apiFetch, getStoredOrganizationId } from "@/lib/hooko-session";
import FormatAdThumb from "./FormatAdThumb";

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

function aspectToRatioLabel(aspectRatio) {
  if (!aspectRatio) return null;
  const v = String(aspectRatio);
  if (v === "9:16" || v.startsWith("9:")) return "9:16 vertical";
  if (v === "1:1") return "1:1 quadrado";
  if (v === "4:5") return "4:5 feed";
  return v;
}

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
                <strong>Biblioteca</strong> = modelos fixos HOOKO (referência para gravar).{" "}
                <strong>Meta importados</strong> = agrupa os anúncios que você já importou por dimensão real da Meta.
              </p>
            </div>
          </div>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={loadFormats} disabled={loading}>
            {loading ? "A carregar…" : "Atualizar"}
          </button>
        </div>
      </div>

      <div className={styles.infoBox}>
        <p>
          <strong>Como isto se liga ao Criador de anúncio?</strong> Escolha um modelo na Biblioteca → abre o Criador com
          proporção sugerida. No Criador, você monta copy/CTA e pode usar um criativo importado como base. Os formatos Meta
          abaixo são só leitura dos seus imports — clique no anúncio para ver detalhe, métricas e vídeo.
        </p>
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
              Referência visual no{" "}
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
                <Link href={`/criador-de-anuncio?formato=${encodeURIComponent(item.id)}`} className={`${styles.btn} ${styles.btnPrimary}`}>
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
              <article key={item.id} className={styles.card}>
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
                    <p className={styles.descriptionText}>
                      {aspectToRatioLabel(item.aspectRatio) || "Dimensão detectada na importação Meta"}
                    </p>
                  </div>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Criativos neste grupo</span>
                  <span className={styles.statValue}>{item.syncedCount}</span>
                </div>

                {item.ads?.length > 0 ? (
                  <ul className={styles.adPreviewList}>
                    {item.ads.map((ad) => (
                      <li key={ad.adId}>
                        <Link href={`/criativo/${ad.adId}`} className={styles.adPreviewRow}>
                          <FormatAdThumb
                            adId={ad.adId}
                            mediaId={ad.mediaId}
                            initialSrc={ad.thumbnailUrl}
                            alt={ad.adName}
                          />
                          <span className={styles.adPreviewText}>
                            <span className={styles.adPreviewName}>{ad.adName}</span>
                            <span className={styles.adPreviewCampaign}>
                              {ad.campaignName ? ad.campaignName : "Sem campanha"}
                              {ad.videoLengthSeconds ? ` · ${Math.round(ad.videoLengthSeconds)}s` : ""}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.adPreviewEmpty}>Nenhum anúncio listado neste grupo.</p>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
