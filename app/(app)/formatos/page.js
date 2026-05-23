"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { apiFetch, getStoredOrganizationId } from "@/lib/hooko-session";

export default function FormatosPage() {
  const [formats, setFormats] = useState([]);
  const [totalImported, setTotalImported] = useState(0);
  const [unclassifiedCount, setUnclassifiedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  const loadFormats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const orgId = getStoredOrganizationId();
      if (!orgId) {
        setFormats([]);
        setTotalImported(0);
        setUnclassifiedCount(0);
        return;
      }

      const res = await apiFetch(
        `/api/dashboard/creative-formats?organizationId=${orgId}`
      );

      setFormats(Array.isArray(res?.items) ? res.items : []);
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

  return (
    <div className={styles.page}>
      <div className={styles.topHeader}>
        <div className={styles.topHeaderGlow} aria-hidden />
        <div className={styles.topHeaderInner}>
          <div className={styles.topHeaderMain}>
            <div className={styles.topIconWrap}>
              <svg
                className={styles.topIconSvg}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                aria-hidden
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinejoin="round" />
                <path
                  d="M2 17l10 5 10-5M2 12l10 5 10-5"
                  strokeLinejoin="round"
                  opacity="0.85"
                />
              </svg>
            </div>
            <div className={styles.topTitleBlock}>
              <h1 className={styles.topPageTitle}>Formatos de Criativos</h1>
              <p className={styles.topHint}>
                Dados reais da Meta Graph API — dimensões de{" "}
                <code>video.format[native]</code>, <code>object_type</code> e
                carrosséis detectados na estrutura do creative.
              </p>
            </div>
          </div>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={loadFormats}
            disabled={loading}
          >
            {loading ? "A carregar…" : "Atualizar"}
          </button>
        </div>
      </div>

      <div className={styles.filterRow}>
        <button
          type="button"
          className={`${styles.btn} ${filter === "all" ? styles.btnPrimary : ""}`}
          onClick={() => setFilter("all")}
        >
          Todos ({formats.length})
        </button>
        <button
          type="button"
          className={`${styles.btn} ${filter === "vertical" ? styles.btnPrimary : ""}`}
          onClick={() => setFilter("vertical")}
        >
          Verticais
        </button>
        <button
          type="button"
          className={`${styles.btn} ${filter === "square" ? styles.btnPrimary : ""}`}
          onClick={() => setFilter("square")}
        >
          Quadrados
        </button>
        <button
          type="button"
          className={`${styles.btn} ${filter === "landscape" ? styles.btnPrimary : ""}`}
          onClick={() => setFilter("landscape")}
        >
          Horizontais
        </button>
        <button
          type="button"
          className={`${styles.btn} ${filter === "carousel" ? styles.btnPrimary : ""}`}
          onClick={() => setFilter("carousel")}
        >
          Carrossel
        </button>
      </div>

      {error ? (
        <div className={styles.errorBox} role="alert">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className={styles.statusText}>A carregar formatos dos criativos importados…</p>
      ) : totalImported === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>Nenhum criativo importado</h2>
          <p className={styles.emptyCopy}>
            Importe anúncios em <Link href="/criativo">Criativos</Link> para ver os
            formatos que a Meta devolve.
          </p>
        </div>
      ) : (
        <>
          <p className={styles.summaryText}>
            {totalImported} criativo(s) importado(s) · {formats.length} grupo(s) com
            dados Meta · {unclassifiedCount} sem dimensões/tipo do Meta
          </p>

          {filteredFormats.length === 0 ? (
            <p className={styles.statusText}>
              Nenhum grupo neste filtro. Os criativos podem estar sem{" "}
              <code>format.native</code> persistido — reimporte para atualizar.
            </p>
          ) : (
            <div className={styles.grid}>
              {filteredFormats.map((item) => (
                <div key={item.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.formatTitle}>{item.label}</h2>
                    {item.objectType ? (
                      <span className={`${styles.badge} ${styles.badgeBlue}`}>
                        {item.objectType}
                      </span>
                    ) : null}
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.aspectPreviewBox}>
                      <div
                        className={styles.ratioRepresentation}
                        style={{
                          width: `${item.widthPct}%`,
                          height: `${item.heightPct}%`,
                        }}
                      >
                        {item.aspectRatio || item.label}
                      </div>
                    </div>

                    <div className={styles.metaInfo}>
                      {item.width && item.height ? (
                        <h3 className={styles.dimensionText}>
                          Meta: {item.width} × {item.height} px
                          {item.formatFilter ? ` (${item.formatFilter})` : ""}
                        </h3>
                      ) : (
                        <h3 className={styles.dimensionText}>{item.label}</h3>
                      )}
                      <p className={styles.descriptionText}>
                        Agrupamento baseado nos campos persistidos da Graph API na
                        importação.
                      </p>
                    </div>
                  </div>

                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Criativos neste grupo</span>
                    <span className={styles.statValue}>{item.syncedCount}</span>
                  </div>

                  {item.ads?.length > 0 ? (
                    <ul className={styles.adPreviewList}>
                      {item.ads.slice(0, 4).map((ad) => (
                        <li key={ad.adId}>
                          <Link href={`/criativo/${ad.adId}`} className={styles.adPreviewLink}>
                            {ad.adName}
                          </Link>
                          <span className={styles.adPreviewCampaign}>
                            {ad.objectType ? ` · ${ad.objectType}` : ""}
                            {ad.videoLengthSeconds
                              ? ` · ${Math.round(ad.videoLengthSeconds)}s`
                              : ""}
                            {ad.width && ad.height ? ` · ${ad.width}×${ad.height}` : ""}
                          </span>
                        </li>
                      ))}
                      {item.ads.length > 4 ? (
                        <li className={styles.adPreviewMore}>
                          +{item.ads.length - 4} mais
                        </li>
                      ) : null}
                    </ul>
                  ) : null}

                  <div className={styles.cardFooter}>
                    <Link href="/criativo" className={`${styles.btn} ${styles.btnPrimary}`}>
                      Ver criativos
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
