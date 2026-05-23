"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import { apiFetch, getStoredOrganizationId } from "@/lib/hooko-session";
import ExternalImage from "@/components/ExternalMedia/ExternalImage";
import { normalizeAiCreativeAnalysis, scoreTone } from "@/lib/ai-creative-analysis";

/** Mock: desliga API real enquanto o backend não está ligado */
const USE_MOCK = false;
const SIMULATE_EMPTY = false;
const SIMULATE_META_DISCONNECTED = false;

function SmartThumbnail({ initialSrc, mediaId, className }) {
  const [src, setSrc] = useState(initialSrc || "/imagens/meta.png");
  const [refreshing, setRefreshing] = useState(false);

  const handleError = async () => {
    if (!mediaId) {
      setSrc("/imagens/meta.png");
      return;
    }
    if (refreshing) return;
    setRefreshing(true);
    try {
      const orgId = getStoredOrganizationId();
      if (!orgId) return;

      const res = await apiFetch(`/api/dashboard/media-refresh/${mediaId}?organizationId=${orgId}`);
      if (res?.thumbnailUrl) {
        setSrc(res.thumbnailUrl);
      } else if (res?.url && res?.type !== "video") {
        setSrc(res.url);
      } else {
        setSrc("/imagens/meta.png");
      }
    } catch (e) {
      console.error("Erro ao renovar imagem expirada do Meta:", e);
      setSrc("/imagens/meta.png");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ExternalImage
      src={src}
      alt="Miniatura Criativo"
      className={className}
      onError={handleError}
      style={{ objectFit: "cover", width: "100%", height: "100%" }}
    />
  );
}

const mockPlanLimits = { used: 14, limit: 50 };

const mockLiveCampaigns = [
  { id: "c1", name: "Black Friday 2026" },
  { id: "c2", name: "Natal" },
];

const mockLiveAds = [
  {
    id: "ad1",
    campaign_id: "c1",
    name: "Vídeo Oferta",
    is_imported: false,
    thumbnail_url: "/imagens/meta.png",
    has_video_id: true,
  },
  {
    id: "ad2",
    campaign_id: "c1",
    name: "Carrossel Promo",
    is_imported: true,
    thumbnail_url: "/imagens/google-drive.png",
    has_video_id: false,
  },
  {
    id: "ad3",
    campaign_id: "c2",
    name: "Story Natal",
    is_imported: false,
    thumbnail_url: "/imagens/meta.png",
    has_video_id: true,
  },
];

/** Itens por página na grelha de criativos importados */
const PAGE_SIZE = 8;

const mockImportedCreatives = [
  {
    id: "1",
    name: "Vídeo Oferta 1",
    campaign_name: "Black Friday 2026",
    headline: "Frete Grátis Hoje",
    thumbnail_url: "/imagens/meta.png",
    status: "processed",
  },
  {
    id: "2",
    name: "UGC Depoimento",
    campaign_name: "Black Friday 2026",
    headline: "Últimas unidades · envio rápido",
    thumbnail_url: "/imagens/google-drive.png",
    status: "processed",
  },
  {
    id: "3",
    name: "Hero Natal",
    campaign_name: "Natal",
    headline: "Lista de desejos com desconto",
    thumbnail_url: "/imagens/google-drive.png",
    status: "queued",
  },
  {
    id: "4",
    name: "Retargeting Dinâmico",
    campaign_name: "Black Friday 2026",
    headline: "Voltaste? Ainda há tempo de poupar até 40%",
    thumbnail_url: "/imagens/meta.png",
    status: "processed",
  },
  {
    id: "5",
    name: "Story Flash Sale",
    campaign_name: "Natal",
    headline: "Só até meia-noite · cupom aplicado na sacola",
    thumbnail_url: "/imagens/meta.png",
    status: "queued",
  },
  {
    id: "6",
    name: "Carrossel Benefícios",
    campaign_name: "Black Friday 2026",
    headline: "3 razões pelas quais escolhemos-nos todas as semanas",
    thumbnail_url: "/imagens/google-drive.png",
    status: "processed",
  },
  {
    id: "7",
    name: "Vídeo Branding Topo",
    campaign_name: "Natal",
    headline: "A magia das festas começa aqui · descobre a coleção",
    thumbnail_url: "/imagens/google-drive.png",
    status: "processed",
  },
  {
    id: "8",
    name: "Anúncio Conversão CPA",
    campaign_name: "Black Friday 2026",
    headline: "Garantias estendidas + devoluções simples quando quiser",
    thumbnail_url: "/imagens/meta.png",
    status: "queued",
  },
  {
    id: "9",
    name: "Reels Prova Social",
    campaign_name: "Natal",
    headline: "Milhares de avaliações 5 estrelas · vê o que dizem",
    thumbnail_url: "/imagens/meta.png",
    status: "processed",
  },
  {
    id: "10",
    name: "Oferta Relâmpago",
    campaign_name: "Black Friday 2026",
    headline: "Stock limitado · frete reduzido nas primeiras 500 encomendas",
    thumbnail_url: "/imagens/google-drive.png",
    status: "processed",
  },
  {
    id: "11",
    name: "Lead Magnet Ebook",
    campaign_name: "Natal",
    headline: "Guia grátis: prepare a sua lista com ideias que convertem",
    thumbnail_url: "/imagens/google-drive.png",
    status: "queued",
  },
  {
    id: "12",
    name: "Teste A/B CTA",
    campaign_name: "Black Friday 2026",
    headline: "Reserva já o teu lugar na fila VIP de lançamentos",
    thumbnail_url: "/imagens/meta.png",
    status: "processed",
  },
];

function adsForCampaign(campaignId) {
  return mockLiveAds.filter((a) => a.campaign_id === campaignId);
}

const LOAD_MS = 1200;

function IconOpen({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M14 3h7v7M10 14L21 3M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTrash({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconFolder({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        fill="rgba(212, 175, 55, 0.42)"
        d="M4 18V8a2 2 0 012-2h3.5l1.5 2H18a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2z"
      />
      <path fill="rgba(0, 0, 0, 0.42)" d="M4 10h16v10H4V10z" />
      <path
        fill="rgba(234, 179, 8, 0.38)"
        d="M6 6h4.2l1.2 1.6H6a2 2 0 00-2 2V8a2 2 0 012-2z"
      />
    </svg>
  );
}

/** @param {{ status?: string }} c */
function statusLabel(c) {
  const s = String(c.status || "").toLowerCase();
  if (s === "processed") return "Pronto";
  if (s === "queued") return "Fila IA";
  return s || "—";
}

/** @param {{ status?: string }} c */
function statusPillClass(c) {
  const s = String(c.status || "").toLowerCase();
  if (s === "queued") return `${styles.statusPill} ${styles.statusPillNeutral}`;
  return styles.statusPill;
}

export default function DashboardCreativesPage() {
  const modalTitleId = useId();
  const deleteDialogTitleId = useId();
  const closeRef = useRef(null);
  const deleteDialogCloseRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [importedCreatives, setImportedCreatives] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);

  const [metaConnected, setMetaConnected] = useState(false);
  const [metaAccounts, setMetaAccounts] = useState([]);
  const [metaActId, setMetaActId] = useState("");
  const [liveCampaigns, setLiveCampaigns] = useState([]);
  const [liveAds, setLiveAds] = useState([]);
  const [quota, setQuota] = useState({ used: 0, limit: 0 });
  const [modalLoading, setModalLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);

  const loadCampaignsForAccount = useCallback(async (actId) => {
    const trimmed = String(actId || "").trim();
    if (!trimmed) {
      setLiveCampaigns([]);
      return;
    }

    try {
      setModalLoading(true);
      const orgId = getStoredOrganizationId();
      if (!orgId) return;

      const res = await apiFetch(
        `/api/metasync/account/${trimmed}/live-campaigns?includeQuota=true&organizationId=${orgId}`
      );
      if (res?.items) {
        setLiveCampaigns(res.items);
      }
      if (res?.quota) {
        setQuota({ used: res.quota.used || 0, limit: res.quota.limit || 0 });
      }
    } catch (err) {
      console.error("Erro ao carregar campanhas:", err);
      setLiveCampaigns([]);
      alert(err.message || "Erro ao carregar campanhas da conta.");
    } finally {
      setModalLoading(false);
    }
  }, []);

  const fetchMetaAccounts = useCallback(async () => {
    try {
      setAccountsLoading(true);
      const orgId = getStoredOrganizationId();
      if (!orgId) return [];

      const res = await apiFetch(`/api/metasync/ad-accounts?organizationId=${orgId}`);
      const items = Array.isArray(res?.items) ? res.items : [];
      setMetaAccounts(items);
      return items;
    } catch (err) {
      console.error("Erro ao carregar contas Meta:", err);
      setMetaAccounts([]);
      alert(err.message || "Erro ao carregar contas de anúncio do Meta.");
      return [];
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  const fetchImportedCreatives = useCallback(async () => {
    try {
      setLoading(true);
      const orgId = getStoredOrganizationId();
      if (!orgId) return;

      const [insights, statusRes] = await Promise.all([
        apiFetch(`/api/dashboard/insights?organizationId=${orgId}`).catch(() => null),
        apiFetch(`/api/meta/status?organizationId=${orgId}`).catch(() => null),
      ]);

      if (insights && Array.isArray(insights.items)) {
        const mapped = insights.items.map((item) => {
          const ai = normalizeAiCreativeAnalysis(item.aiAnalysis, { aiUi: item.aiUi });
          return {
            id: item.adId,
            ad_id: item.adId,
            creative_analysis_id: item.creativeAnalysisId,
            media_id: item.mediaId,
            name: item.adName || "Anúncio",
            campaign_name: item.campaignName || "Sem Campanha",
            headline: item.adName || "Sem título",
            thumbnail_url: item.thumbnailUrl || "/imagens/meta.png",
            ai_score: ai.performanceScore,
            ai_pending: ai.pending,
            status: ai.pending ? "processing" : "processed",
          };
        });
        setImportedCreatives(mapped);
      }
      if (statusRes) {
        setMetaConnected(!!statusRes.connected);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do Meta:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const n = importedCreatives.length;
    if (n === 0) {
      setPageIndex(0);
      return;
    }
    const pages = Math.ceil(n / PAGE_SIZE);
    setPageIndex((p) => Math.max(0, Math.min(p, pages - 1)));
  }, [importedCreatives.length]);

  useEffect(() => {
    fetchImportedCreatives();
  }, [fetchImportedCreatives]);

  useEffect(() => {
    if (!modalOpen) return;

    setModalStep(1);
    setSelectedCampaign(null);
    setLiveCampaigns([]);
    setLiveAds([]);

    let cancelled = false;

    const bootstrapImportModal = async () => {
      const accounts = await fetchMetaAccounts();
      if (cancelled) return;

      const firstActId = accounts[0]?.id ? String(accounts[0].id) : "";
      setMetaActId(firstActId);

      if (firstActId) {
        await loadCampaignsForAccount(firstActId);
      }
    };

    bootstrapImportModal();

    return () => {
      cancelled = true;
    };
  }, [modalOpen, fetchMetaAccounts, loadCampaignsForAccount]);

  const handleAccountChange = useCallback(
    async (nextActId) => {
      setMetaActId(nextActId);
      setModalStep(1);
      setSelectedCampaign(null);
      setLiveAds([]);
      await loadCampaignsForAccount(nextActId);
    },
    [loadCampaignsForAccount]
  );

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const id = requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      cancelAnimationFrame(id);
    };
  }, [modalOpen]);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const openDeleteConfirm = useCallback((creative) => {
    setPendingDelete(creative);
    setDeleteConfirmOpen(true);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setDeleteConfirmOpen(false);
    setPendingDelete(null);
  }, []);

  const confirmDeleteCreative = useCallback(() => {
    if (!pendingDelete?.id) return;
    setImportedCreatives((prev) => prev.filter((x) => x.id !== pendingDelete.id));
    closeDeleteConfirm();
  }, [pendingDelete, closeDeleteConfirm]);

  useEffect(() => {
    if (!deleteConfirmOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeDeleteConfirm();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const id = requestAnimationFrame(() => deleteDialogCloseRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      cancelAnimationFrame(id);
    };
  }, [deleteConfirmOpen, closeDeleteConfirm]);

  const onConnectMeta = useCallback(async () => {
    try {
      const orgId = getStoredOrganizationId();
      if (!orgId) return;
      const res = await apiFetch(`/api/meta/oauth/authorize-url?organizationId=${orgId}`);
      if (res && res.authorizeUrl) {
        window.location.href = res.authorizeUrl;
      }
    } catch (err) {
      console.error("Erro ao conectar Meta:", err);
      alert("Erro ao conectar o Meta Ads.");
    }
  }, []);

  const creditsPct =
    quota.limit > 0
      ? Math.min(100, (quota.used / quota.limit) * 100)
      : 0;

  const step2Ads = selectedCampaign ? liveAds : [];

  const handleOpenCampaign = async (campaign) => {
    setSelectedCampaign({ id: campaign.id, name: campaign.name });
    setModalStep(2);
    try {
      setModalLoading(true);
      const orgId = getStoredOrganizationId();
      const res = await apiFetch(`/api/metasync/account/${metaActId}/campaign/${campaign.id}/live-ads?organizationId=${orgId}`);
      if (res && res.items) {
        setLiveAds(res.items);
      }
    } catch (err) {
      console.error("Erro ao carregar anúncios:", err);
      alert(err.message || "Erro ao carregar anúncios desta campanha.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleImportAd = async (ad) => {
    try {
      const orgId = getStoredOrganizationId();
      if (!orgId) return;

      setModalLoading(true);
      const res = await apiFetch(
        `/api/metasync/account/${metaActId}/campaign/${selectedCampaign.id}/ad/${ad.id}/import?organizationId=${orgId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metaActId }),
        }
      );

      if (res && res.ok) {
        alert("Criativo importado com sucesso e enviado para análise da IA!");
        closeModal();
        fetchImportedCreatives();
      }
    } catch (err) {
      console.error("Erro ao importar criativo:", err);
      alert(err.message || "Erro ao importar criativo");
    } finally {
      setModalLoading(false);
    }
  };

  const totalImported = importedCreatives.length;
  const totalPages = totalImported > 0 ? Math.ceil(totalImported / PAGE_SIZE) : 0;
  const paginatedCreatives = useMemo(() => {
    const start = pageIndex * PAGE_SIZE;
    return importedCreatives.slice(start, start + PAGE_SIZE);
  }, [importedCreatives, pageIndex]);

  const paginationFrom = totalImported === 0 ? 0 : pageIndex * PAGE_SIZE + 1;
  const paginationTo = Math.min(totalImported, pageIndex * PAGE_SIZE + paginatedCreatives.length);

  const goToCampaignsFolder = () => {
    setModalStep(1);
    setSelectedCampaign(null);
  };

  return (
    <div className={styles.page}>
      <header className={styles.metaHeader}>
        <div className={styles.metaHeaderGlow} aria-hidden />
        <div className={styles.metaHeaderInner}>
          <div className={styles.metaHeaderMain}>
            <div className={styles.metaIconWrap}>
              <div className={styles.metaLogoShell} aria-hidden>
                <Image
                  src="/imagens/meta.png"
                  alt=""
                  width={120}
                  height={120}
                  className={styles.metaLogoImg}
                  priority
                />
              </div>
            </div>
            <div className={styles.metaTitleBlock}>
              <h1 className={styles.metaPageTitle}>Criativos do Meta</h1>
              <p className={styles.metaHint}>
                Abaixo estão os <strong className={styles.metaHintAccent}>criativos já importados</strong>. Use{" "}
                <strong className={styles.metaHintAccent}>Importar criativo</strong> para abrir a conta Meta, escolher a
                campanha (pasta) e puxar apenas o anúncio desejado —{" "}
                <strong className={styles.metaHintAccent}>1 crédito</strong> por criativo novo.
              </p>
            </div>
          </div>

          <div className={styles.metaHeaderActions}>
            {!metaConnected ? (
              <div className={styles.disconnectBox} role="status">
                <span className={styles.disconnectLabel}>Meta desconectado</span>
                <button type="button" className={styles.connectMetaBtn} onClick={onConnectMeta}>
                  Clique aqui para conectar o seu Meta
                </button>
              </div>
            ) : (
              <button type="button" className={styles.ctaImport} onClick={openModal}>
                Importar criativo
              </button>
            )}
          </div>
        </div>
      </header>

      <section className={styles.main} aria-label="Criativos importados no Hooko">
        {loading ? (
          <ul className={styles.cardGrid} aria-busy="true" aria-label="A carregar criativos">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className={styles.cardItem}>
                <div className={`${styles.skeletonCard} ${styles.skeletonCreativeCard}`}>
                  <div className={styles.skeletonCreative} />
                  <span className={styles.skeletonLine} style={{ width: "78%" }} />
                  <span className={styles.skeletonLine} style={{ width: "52%" }} />
                  <div className={styles.skeletonMiniGrid} aria-hidden>
                    <span className={styles.skeletonMini} />
                  </div>
                  <span className={styles.skeletonShimmer} aria-hidden />
                </div>
              </li>
            ))}
          </ul>
        ) : importedCreatives.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyGlow} aria-hidden />
            <div className={styles.emptyInner}>
              <p className={styles.emptyKicker}>Nada por aqui ainda</p>
              <h2 className={styles.emptyTitle}>Nenhum criativo importado</h2>
              <p className={styles.emptyCopy}>
                Use <strong className={styles.emptyStrong}>Importar criativo</strong> para escolher uma campanha no Meta
                e trazer só os anúncios que quiser analisar.
              </p>
            </div>
          </div>
        ) : (
          <>
            <ul className={styles.cardGrid}>
              {paginatedCreatives.map((c) => (
              <li key={c.id} className={styles.cardItem}>
                <div className={styles.creativeBundle} tabIndex={0}>
                  <article className={styles.creativeCard}>
                    <div className={styles.creativeMedia}>
                      {c.thumbnail_url ? (
                        <SmartThumbnail
                          initialSrc={c.thumbnail_url}
                          mediaId={c.media_id}
                          className={styles.creativeMediaImg}
                        />
                      ) : (
                        <div className={styles.creativeMediaEmpty}>Sem miniatura</div>
                      )}
                    </div>
                    <div className={styles.creativeBody}>
                      <h2 className={styles.creativeHeadline}>{c.headline}</h2>
                      <p className={styles.creativeAdName}>{c.name}</p>
                      <div className={styles.creativeCampaignRow}>
                        <span className={styles.creativeCampaignTag}>Campanha</span>
                        <span className={styles.creativeCampaignName}>{c.campaign_name}</span>
                      </div>
                    </div>
                    <div className={styles.creativeStatusFooter}>
                      <span className={statusPillClass(c)}>{statusLabel(c)}</span>
                      <span
                        className={`${styles.aiScorePill} ${styles[`aiScore_${scoreTone(c.ai_score)}`] || ""}`}
                        title="Score IA"
                      >
                        {c.ai_pending || c.ai_score == null ? "IA…" : c.ai_score}
                      </span>
                      <div className={styles.creativeFooterBtns}>
                        <Link
                          href={`/criativo/${c.id}`}
                          className={styles.footerBtn}
                          aria-label="Abrir criativo"
                          title="Abrir criativo"
                        >
                          <IconOpen className={styles.footerActionIcon} />
                        </Link>
                        <button
                          type="button"
                          className={styles.footerBtnDanger}
                          aria-label="Excluir criativo"
                          title="Excluir criativo"
                          onClick={() => openDeleteConfirm(c)}
                        >
                          <IconTrash className={styles.footerActionIcon} />
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              </li>
            ))}
            </ul>
            {totalImported > 0 ? (
              <nav className={styles.pagination} aria-label="Paginação de criativos">
                <p className={styles.paginationInfo}>
                  A mostrar{" "}
                  <strong>
                    {paginationFrom}–{paginationTo}
                  </strong>{" "}
                  de <strong>{totalImported}</strong>
                </p>
                {totalPages > 1 ? (
                  <div className={styles.paginationBtns}>
                    <button
                      type="button"
                      className={styles.paginationBtn}
                      disabled={pageIndex <= 0}
                      onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                      aria-label="Página anterior"
                    >
                      ← Anterior
                    </button>
                    <span className={styles.paginationPageLabel} aria-live="polite">
                      Página {pageIndex + 1} / {totalPages}
                    </span>
                    <button
                      type="button"
                      className={styles.paginationBtn}
                      disabled={pageIndex >= totalPages - 1}
                      onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                      aria-label="Página seguinte"
                    >
                      Seguinte →
                    </button>
                  </div>
                ) : null}
              </nav>
            ) : null}
          </>
        )}
      </section>

      {modalOpen ? (
        <div
          className={styles.modalRoot}
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className={styles.modalBackdrop} aria-hidden />
          <div
            className={styles.modalPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderTexts}>
                <h2 id={modalTitleId} className={styles.modalTitle}>
                  {modalStep === 1 ? "Importar criativo — escolha a pasta" : "Creativos dentro da pasta"}
                </h2>
                <p className={styles.modalSub}>
                  {modalStep === 1
                    ? "Pastas são campanhas live na conta Meta."
                    : "Selecione um anúncio para importar. Cada novo criativo debita 1 crédito."}
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                className={styles.modalClose}
                onClick={closeModal}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <div className={styles.creditsBlock}>
              <div className={styles.creditsRow}>
                <span className={styles.creditsLabel}>Créditos de criativos (mês)</span>
                <span className={styles.creditsCount}>
                  {quota.used}/{quota.limit} utilizados
                </span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${creditsPct}%` }} />
              </div>
            </div>

            <div className={styles.folderExplorer}>
              <div className={styles.folderExplorerChrome} aria-hidden>
                <span className={styles.folderChromeDot} />
                <span className={styles.folderChromeDot} />
                <span className={styles.folderChromeDot} />
                <span className={styles.folderChromeLabel}>
                  Conta Meta
                  <select
                    className={styles.accountSelect}
                    value={metaActId}
                    onChange={(e) => handleAccountChange(e.target.value)}
                    disabled={accountsLoading || modalLoading || metaAccounts.length === 0}
                    aria-label="Selecionar conta de anúncio Meta"
                  >
                    {accountsLoading ? (
                      <option value="">A carregar contas…</option>
                    ) : metaAccounts.length === 0 ? (
                      <option value="">Nenhuma conta encontrada</option>
                    ) : (
                      metaAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.id})
                        </option>
                      ))
                    )}
                  </select>
                </span>
              </div>

              <header className={styles.folderNavBar}>
                <nav className={styles.folderBreadcrumb} aria-label="Navegação de pastas">
                  <span className={styles.folderNavIcon} aria-hidden>
                    <IconFolder className={styles.folderNavSvg} />
                  </span>
                  <span className={styles.folderBreadcrumbRoot}>Meta Ads</span>
                  <span className={styles.folderBreadcrumbSep}>/</span>
                  {modalStep === 2 ? (
                    <>
                      <button type="button" className={styles.folderBreadcrumbLink} onClick={goToCampaignsFolder}>
                        Campanhas
                      </button>
                      <span className={styles.folderBreadcrumbSep}>/</span>
                      <span className={styles.folderBreadcrumbCurrent} title={selectedCampaign?.name}>
                        {selectedCampaign?.name || "…"}
                      </span>
                    </>
                  ) : (
                    <span className={styles.folderBreadcrumbCurrent}>Campanhas</span>
                  )}
                </nav>
                {modalStep === 2 ? (
                  <button type="button" className={styles.folderUpBtn} onClick={goToCampaignsFolder}>
                    ← Voltar para Campanhas
                  </button>
                ) : (
                  <span className={styles.folderNavHint}>{liveCampaigns.length} pastas</span>
                )}
              </header>

              <div className={styles.folderBody}>
                <div
                  key={modalStep === 1 ? "step-a" : "step-b"}
                  className={styles.modalStepPane}
                  aria-live="polite"
                >
                {modalStep === 1 ? (
                  <ul className={styles.folderGrid}>
                    {accountsLoading || modalLoading ? (
                      <p className={styles.modalSub}>A carregar campanhas…</p>
                    ) : metaAccounts.length === 0 ? (
                      <p className={styles.modalSub}>
                        Nenhuma conta de anúncio encontrada. Verifique a ligação ao Meta em Ajustes.
                      </p>
                    ) : liveCampaigns.length === 0 ? (
                      <p className={styles.modalSub}>Nenhuma campanha encontrada nesta conta.</p>
                    ) : (
                      liveCampaigns.map((row) => (
                      <li key={row.id} className={styles.folderGridItem}>
                        <button
                          type="button"
                          className={styles.folderTile}
                          onClick={() => handleOpenCampaign(row)}
                        >
                          <span className={styles.folderTileIconWrap} aria-hidden>
                            <IconFolder className={styles.folderTileIcon} />
                          </span>
                          <span className={styles.folderTileName}>{row.name}</span>
                          <span className={styles.folderTileId}>{row.id}</span>
                          <span className={styles.folderTileCta}>Abrir pasta →</span>
                        </button>
                      </li>
                      ))
                    )}
                  </ul>
                ) : (
                  <ul className={styles.metaList}>
                    {step2Ads.length === 0 ? (
                      <li className={styles.metaRow}>
                        <p className={styles.modalSub} style={{ margin: 0 }}>
                          {modalLoading ? "A carregar anúncios..." : "Nenhum anúncio disponível nesta campanha."}
                        </p>
                      </li>
                    ) : (
                      step2Ads.map((ad) => {
                        const disabled = ad.is_imported;
                        return (
                          <li
                            key={ad.id}
                            className={`${styles.metaRow} ${disabled ? styles.metaRowDim : ""}`}
                          >
                            <div className={styles.metaRowWithThumb}>
                              <div className={styles.adThumb} aria-hidden>
                                {ad.thumbnail_url ? (
                                  <ExternalImage
                                    src={ad.thumbnail_url}
                                    alt=""
                                    className={styles.adThumbImg}
                                  />
                                ) : (
                                  <div className={styles.adThumbPlaceholder}>Mensagem</div>
                                )}
                              </div>
                              <div className={styles.metaRowMain}>
                                <span className={styles.metaRowName}>{ad.name}</span>
                                <span className={styles.metaRowId}>
                                  {ad.id}
                                  {ad.has_video_id ? " · vídeo" : ""}
                                </span>
                              </div>
                            </div>
                            <div className={styles.metaRowActions}>
                              {disabled ? <span className={styles.badgeImported}>Já importado</span> : null}
                              <button
                                type="button"
                                className={styles.importBtnPremium}
                                disabled={disabled || modalLoading}
                                onClick={() => handleImportAd(ad)}
                                title={
                                  disabled
                                    ? "Este criativo já está no Hooko"
                                    : "Debita 1 crédito de criativo"
                                }
                              >
                                {modalLoading ? "Importando..." : "Importar Criativo (1 Crédito)"}
                              </button>
                            </div>
                          </li>
                        );
                      })
                    )}
                  </ul>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deleteConfirmOpen && pendingDelete ? (
        <div
          className={styles.modalRoot}
          role="presentation"
          style={{ zIndex: 90 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeDeleteConfirm();
          }}
        >
          <div className={styles.modalBackdrop} aria-hidden />
          <div
            className={styles.confirmPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={deleteDialogTitleId}
          >
            <div className={styles.confirmHeader}>
              <h2 id={deleteDialogTitleId} className={styles.confirmTitle}>
                Excluir criativo?
              </h2>
              <button
                ref={deleteDialogCloseRef}
                type="button"
                className={styles.modalClose}
                onClick={closeDeleteConfirm}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <p className={styles.confirmBody}>
              O criativo <strong>{pendingDelete.name}</strong> deixa de aparecer no Hooko. Esta ação{" "}
              <strong>não devolve os créditos</strong> usados na importação — remove apenas do sistema.
            </p>
            <div className={styles.confirmActions}>
              <button type="button" className={styles.confirmBtnSecondary} onClick={closeDeleteConfirm}>
                Cancelar
              </button>
              <button type="button" className={styles.confirmBtnDanger} onClick={confirmDeleteCreative}>
                Excluir definitivamente
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
