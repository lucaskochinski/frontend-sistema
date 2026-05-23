"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, getStoredOrganizationId } from "@/lib/hooko-session";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";
import Skeleton from "@/components/Skeleton/Skeleton";
import ExternalImage from "@/components/ExternalMedia/ExternalImage";
import ExternalVideo from "@/components/ExternalMedia/ExternalVideo";
import { WinningCreativeCard, AiInsightsPanel, HookoAiCoach } from "@/components/CreativeAi";
import { normalizeAiCreativeAnalysis } from "@/lib/ai-creative-analysis";
import { chartTooltipStyle } from "@/components/Dashboard/dashboardTheme";
import { useTheme } from "@/components/Theme/ThemeProvider";
import styles from "./page.module.css";

/** Liga dados mock até a API estar disponível */
const USE_MOCK = false;
const LOAD_MS = 1500;

const DATE_RANGE_PRESETS = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "custom", label: "Personalizado" },
];

function toYMD(d) {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseYMD(s) {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d, 12, 0, 0);
  return Number.isFinite(dt.getTime()) ? dt : null;
}

function addDays(dt, n) {
  const d = new Date(dt);
  d.setDate(d.getDate() + n);
  return d;
}

function seed(base, key) {
  const k = `${base}:${key}`;
  let h = 0;
  for (let i = 0; i < k.length; i++) h = (Math.imul(31, h) + k.charCodeAt(i)) | 0;
  const x = Math.sin(h * 0.001273) * 10000;
  return x - Math.floor(x);
}

/** Série diária ≈ últimos 90 dias (referência próxima a hoje em mock). */
function buildMockDailySeries(referenceEnd = new Date()) {
  const out = [];
  const end = new Date(referenceEnd);
  end.setHours(12, 0, 0, 0);
  for (let i = 89; i >= 0; i--) {
    const d = addDays(end, -i);
    const wobble = 0.82 + seed("pd", i) * 0.42;
    const spend = Math.round((35 + seed("sp", i) * 115) * wobble * 100) / 100;
    const roas = 5.8 + seed("ro", i) * 4.4;
    const ctr = 2.2 + seed("ct", i) * 5.8;
    const impressions = Math.round(1800 + seed("im", i) * 9200);
    out.push({
      date: toYMD(d),
      label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      spend,
      roas,
      ctr,
      impressions,
    });
  }
  return out;
}

function filterSeriesByRange(series, rangeKey, customFrom, customTo) {
  if (!series.length) return [];
  const lastRow = series[series.length - 1];
  const end = parseYMD(lastRow.date) || new Date();

  if (rangeKey === "90d") return [...series];

  if (rangeKey === "custom") {
    const f = parseYMD(customFrom);
    const t = parseYMD(customTo);
    let fromD = f || addDays(end, -29);
    let toD = t || end;
    if (fromD > toD) {
      const tmp = fromD;
      fromD = toD;
      toD = tmp;
    }
    return series.filter((r) => {
      const x = parseYMD(r.date);
      return x && x >= fromD && x <= toD;
    });
  }

  let daysBack = 29;
  if (rangeKey === "7d") daysBack = 6;
  else if (rangeKey === "30d") daysBack = 29;

  const start = addDays(end, -daysBack);
  const startClamp = parseYMD(toYMD(start));

  return series.filter((r) => {
    const x = parseYMD(r.date);
    return x && startClamp && x >= startClamp && x <= end;
  });
}

function aggregateFromDaily(rows) {
  if (!rows.length) return { roas: 0, ctr: 0, spend: 0 };
  let spendSum = 0;
  let wRoas = 0;
  let imprSum = 0;
  let wCtr = 0;

  for (const r of rows) {
    const sp = Number(r.spend) || 0;
    const im = Number(r.impressions) || 0;
    spendSum += sp;
    wRoas += (Number(r.roas) || 0) * sp;
    imprSum += im;
    wCtr += (Number(r.ctr) || 0) * im;
  }

  const roas = spendSum > 0 ? wRoas / spendSum : 0;
  const ctr = imprSum > 0 ? wCtr / imprSum : 0;
  return { roas, ctr, spend: spendSum };
}

const mockCreativeData = {
  id: "uuid-123",
  headline: "Black Friday Antecipada - 50% OFF",
  primary_text:
    "Você não vai acreditar nos preços que preparamos para este ano. Assista ao vídeo e descubra como garantir o frete grátis nas primeiras 24 horas. Estoque limitadíssimo!",
  cta_type: "SHOP_NOW",
  media_url: "https://www.w3schools.com/html/mov_bbb.mp4",
  performance_snapshot: { roas: 8.73, ctr: 4.21, spend: 2450.0 },
  performance_daily: buildMockDailySeries(),
  ai_analysis: {
    hook_score: 95,
    offer_score: 88,
    social_proof_score: 65,
    cta_score: 90,
    harmonia_entre_video_e_texto: 92,
    feedback:
      "O gancho visual dos 3 primeiros segundos é excelente e prende a atenção. A copy complementa muito bem com o gatilho de escassez ('primeiras 24 horas').",
    sugestoes:
      "Adicione um depoimento de cliente (prova social) na copy ou na tela aos 0:15s para aumentar a credibilidade e subir o score de prova social.",
  },
};

const CTA_LABELS = {
  SHOP_NOW: "Comprar agora",
  LEARN_MORE: "Saiba mais",
  SIGN_UP: "Cadastre-se",
  DOWNLOAD: "Baixar",
  BOOK_NOW: "Reservar",
  CONTACT_US: "Contacte-nos",
  GET_QUOTE: "Pedir orçamento",
  SUBSCRIBE: "Subscrever",
};

const SCORE_METRICS = [
  { key: "hook_score", label: "Gancho", field: "hook_score" },
  { key: "offer", label: "Oferta", field: "offer_score" },
  { key: "social", label: "Prova social", field: "social_proof_score" },
  { key: "cta", label: "Call to action", field: "cta_score" },
  { key: "harmonia", label: "Harmonia vídeo/texto", field: "harmonia_entre_video_e_texto" },
];

const COPY_COLLAPSE_CHARS = 140;

function resolveInsightAiAnalysis(data) {
  if (!data || typeof data !== "object") return null;
  const raw = data.ai_analysis ?? data.aiAnalysis;
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return typeof raw === "object" ? raw : null;
}

function resolveInsightAiUi(data) {
  if (!data || typeof data !== "object") return null;
  return data.ai_ui ?? data.aiUi ?? null;
}

function pickAiUiForNormalize(data, aiRaw) {
  const ui = resolveInsightAiUi(data);
  if (!ui || typeof ui !== "object") return null;
  if (ui.performanceScore != null) return ui;
  if (Array.isArray(ui.insights) && ui.insights.some((item) => item?.score != null)) return ui;
  if (aiRaw && !ui.pending) return ui;
  return null;
}

function resolveInsightTranscript(data) {
  if (!data || typeof data !== "object") return null;

  const direct = data.transcript ?? data.transcript_full ?? data.transcriptFull;
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  const aiRaw = resolveInsightAiAnalysis(data);
  if (aiRaw?.transcript && String(aiRaw.transcript).trim()) return String(aiRaw.transcript).trim();
  if (aiRaw?.transcriptSnippet && String(aiRaw.transcriptSnippet).trim()) {
    return String(aiRaw.transcriptSnippet).trim();
  }

  return null;
}

function chartAxisColors(theme) {
  const isLight = theme === "light";
  return {
    grid: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
    axis: isLight ? "rgba(82,82,91,0.88)" : "rgba(161,161,170,0.88)",
    axisGold: isLight ? "rgba(184,148,31,0.85)" : "rgba(212,175,55,0.85)",
    axisPurple: isLight ? "rgba(124,58,237,0.85)" : "rgba(196,181,253,0.9)",
    polarGrid: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)",
    polarTick: isLight ? "rgba(82,82,91,0.85)" : "rgba(180,180,188,0.85)",
  };
}

function IconTrashDetail({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatCurrencyBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCta(cta) {
  if (!cta) return "—";
  const u = String(cta).toUpperCase();
  return CTA_LABELS[u] || u.replace(/_/g, " ");
}

function scoreFillClass(score) {
  if (score > 90) return styles.fillGold;
  if (score > 70) return styles.fillGood;
  return styles.fillWarn;
}

function CreativeDetailSkeleton() {
  return (
    <div className={styles.page}>
      <header className={styles.detailHeader}>
        <div className={styles.headerMain}>
          <div className={styles.skBreadWrap}>
            <Skeleton className={styles.skBread} />
          </div>
          <div className={styles.skTitleWrap}>
            <Skeleton className={styles.skTitle} />
          </div>
        </div>
        <div className={styles.headerActions}>
          <Skeleton className={styles.skTrash} />
        </div>
      </header>

      <div className={styles.analyticsBand}>
        <div className={styles.filterRow}>
          <Skeleton className={styles.skFilterBtn} />
          <Skeleton className={styles.skFilterBtn} />
          <Skeleton className={styles.skFilterBtn} />
        </div>
        <div className={styles.skPerfRow}>
          <Skeleton className={styles.skPerfCell} />
          <Skeleton className={styles.skPerfCell} />
          <Skeleton className={styles.skPerfCell} />
        </div>
        <div className={styles.chartsGridSk}>
          <Skeleton className={styles.skChart} />
          <Skeleton className={styles.skChart} />
        </div>
      </div>

      <div className={styles.split}>
        <div className={styles.colLeft}>
          <div className={styles.videoShell}>
            <div className={styles.videoInner}>
              <Skeleton className={styles.skVideo} />
            </div>
          </div>
          <div className={styles.skCopyBlock}>
            <div className={styles.skLineShort}>
              <Skeleton className={styles.skBarLine} />
            </div>
            <Skeleton className={styles.skBlockTall} />
            <div className={styles.skLineWide}>
              <Skeleton className={styles.skBlockMid} />
            </div>
            <div className={styles.skLineCtaLabel}>
              <Skeleton className={styles.skBarLine} />
            </div>
            <div className={styles.skCtaChip}>
              <Skeleton className={styles.skCtaInner} />
            </div>
          </div>
        </div>

        <div className={styles.colRight}>
          <div className={styles.aiScoresRow}>
            <div className={styles.radarCard}>
              <div className={styles.skScoreTitleSk}>
                <Skeleton className={styles.skBarLine} />
              </div>
              <Skeleton className={styles.skRadar} />
            </div>
            <div className={styles.scoreCard}>
              <div className={styles.skScoreTitleSk}>
                <Skeleton className={styles.skBarLine} />
              </div>
              <div className={styles.skBars}>
                {[1, 2, 3, 4, 5].map((k) => (
                  <div key={k} className={styles.skBarRow}>
                    <div className={styles.skBarHead}>
                      <div className={styles.skBarLabelSlot}>
                        <Skeleton className={styles.skBarLine} />
                      </div>
                      <Skeleton className={styles.skBarNum} />
                    </div>
                    <Skeleton className={styles.skBarTrack} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Skeleton className={styles.skVerdict} />
        </div>
      </div>
    </div>
  );
}

function ScoreBarRow({ label, value }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const fill = scoreFillClass(v);
  const showLowHint = v <= 70;

  return (
    <div>
      <div className={styles.scoreRowHead}>
        <div className={styles.scoreLabelWrap}>
          <span className={styles.scoreLabelText}>{label}</span>
          {showLowHint ? (
            <span className={styles.lowWarning} title="Abaixo do ideal">
              Atenção
            </span>
          ) : null}
        </div>
        <span className={styles.scoreValueBadge}>{v}</span>
      </div>
      <div className={styles.scoreTrack}>
        <div className={`${styles.scoreFill} ${fill}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function instagramEmbedSrcFromUrl(embedUrl) {
  const raw = embedUrl || "";
  const m = raw.match(/instagram\.com\/(?:p|reel|tv)\/([^/?#]+)/i);
  if (!m) return null;
  const kind = raw.includes("/reel/") ? "reel" : "p";
  return `https://www.instagram.com/${kind}/${m[1]}/embed/captioned`;
}

function hasPlayableVideoUrl(mediaUrl) {
  const src = mediaUrl || "";
  if (!src) return false;
  const path = src.split("?")[0] || "";
  if (/\.(jpe?g|png|webp|gif)$/i.test(path)) return false;
  if (src.includes("/ads/image/")) return false;
  return true;
}

function shouldShowInstagramEmbed({ embedUrl, mediaUrl, mediaType, creativeMeta }) {
  const igUrl = embedUrl || creativeMeta?.instagram_permalink_url || "";
  if (!igUrl.includes("instagram.com")) return false;
  if (hasPlayableVideoUrl(mediaUrl)) return false;
  const isVideoCreative =
    mediaType === "video" ||
    mediaType === "embed" ||
    String(creativeMeta?.object_type || "").toUpperCase() === "VIDEO";
  return isVideoCreative;
}

function InstagramCreativeEmbed({ permalinkUrl, posterUrl }) {
  const embedSrc = useMemo(() => instagramEmbedSrcFromUrl(permalinkUrl), [permalinkUrl]);
  if (!embedSrc) {
    return (
      <div className={styles.instagramShell}>
        {posterUrl ? (
          <ExternalImage
            src={posterUrl}
            alt="Preview do criativo"
            className={styles.instagramPosterFallback}
          />
        ) : null}
        <div className={styles.instagramLinkRow}>
          <a
            href={permalinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.instagramLink}
          >
            Abrir post no Instagram
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.instagramShell}>
      <iframe
        src={embedSrc}
        title="Criativo no Instagram"
        className={styles.instagramIframe}
        allowFullScreen
        scrolling="no"
        referrerPolicy="no-referrer"
      />
      <div className={styles.instagramLinkRow}>
        <a
          href={permalinkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.instagramLink}
        >
          Abrir post completo no Instagram
        </a>
      </div>
      <p className={styles.instagramHint}>
        Vídeo hospedado no Instagram — preview oficial do post.
      </p>
    </div>
  );
}

function MetaVideoPlayer({ mediaId, initialVideoUrl, posterUrl, mediaType, adId }) {
  const [videoSrc, setVideoSrc] = useState(() =>
    hasPlayableVideoUrl(initialVideoUrl) ? initialVideoUrl : "",
  );
  const [poster, setPoster] = useState(posterUrl || "/imagens/meta.png");
  const [loadingPlayback, setLoadingPlayback] = useState(
    () => (mediaType === "video" || mediaType === "embed") && !hasPlayableVideoUrl(initialVideoUrl),
  );
  const refreshingRef = useRef(false);

  useEffect(() => {
    setVideoSrc(hasPlayableVideoUrl(initialVideoUrl) ? initialVideoUrl : "");
    setPoster(posterUrl || "/imagens/meta.png");
    setLoadingPlayback(
      (mediaType === "video" || mediaType === "embed") && !hasPlayableVideoUrl(initialVideoUrl),
    );
  }, [initialVideoUrl, posterUrl, mediaId, mediaType]);

  const refreshFromMeta = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setLoadingPlayback(true);
    try {
      const orgId = getStoredOrganizationId();
      if (!orgId) return;
      let res = null;
      if (adId) {
        res = await apiFetch(
          `/api/dashboard/insights/${adId}/media-playback?organizationId=${orgId}`,
        );
      } else if (mediaId) {
        res = await apiFetch(
          `/api/dashboard/media-refresh/${mediaId}?organizationId=${orgId}`,
        );
      }
      if (res?.url && hasPlayableVideoUrl(res.url)) setVideoSrc(res.url);
      if (res?.thumbnailUrl) setPoster(res.thumbnailUrl);
    } catch (err) {
      console.error("Erro ao renovar vídeo do Meta:", err);
    } finally {
      refreshingRef.current = false;
      setLoadingPlayback(false);
    }
  }, [mediaId, adId]);

  useEffect(() => {
    if (mediaType !== "video" && mediaType !== "embed") return;
    if (!hasPlayableVideoUrl(initialVideoUrl) && (mediaId || adId)) {
      refreshFromMeta();
    }
  }, [mediaType, initialVideoUrl, mediaId, adId, refreshFromMeta]);

  if (mediaType === "image") {
    return (
      <ExternalImage
        src={poster}
        alt="Criativo"
        className={styles.videoEl}
        style={{ objectFit: "cover" }}
        onError={mediaId || adId ? refreshFromMeta : undefined}
      />
    );
  }

  const playableSrc = hasPlayableVideoUrl(videoSrc) ? videoSrc : "";

  if (!playableSrc) {
    return (
      <div className={styles.videoPending}>
        <ExternalImage
          src={poster}
          alt="Preview do criativo"
          className={styles.videoEl}
          style={{ objectFit: "cover" }}
        />
        {loadingPlayback ? <p className={styles.videoPendingText}>Carregando vídeo da Meta…</p> : null}
      </div>
    );
  }

  return (
    <ExternalVideo
      className={styles.videoEl}
      src={playableSrc}
      poster={poster}
      onError={mediaId || adId ? refreshFromMeta : undefined}
    />
  );
}

export default function CreativeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const routeId = params?.id != null ? String(params.id) : "";
  const titleId = useId();
  const deleteDialogTitleId = useId();
  const deleteDialogCloseRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [copyExpanded, setCopyExpanded] = useState(false);
  const [rangeKey, setRangeKey] = useState("30d");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const lastDay = data?.performance_daily?.[data.performance_daily.length - 1]?.date || toYMD(new Date());
  const [customFrom, setCustomFrom] = useState(() => toYMD(addDays(parseYMD(lastDay) || new Date(), -29)));
  const [customTo, setCustomTo] = useState(lastDay);

  useEffect(() => {
    if (data?.performance_daily?.length) {
      const last = data.performance_daily[data.performance_daily.length - 1].date;
      setCustomTo(last);
      setCustomFrom(toYMD(addDays(parseYMD(last) || new Date(), -29)));
    }
  }, [data?.performance_daily]);

  const closeDeleteConfirm = useCallback(() => {
    setDeleteConfirmOpen(false);
  }, []);

  const confirmRemoveCreative = useCallback(() => {
    setDeleteConfirmOpen(false);
    router.push("/criativo");
  }, [router]);

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

  useEffect(() => {
    async function fetchAdDetails() {
      if (!routeId) return;
      try {
        setLoading(true);
        const orgId = getStoredOrganizationId();
        const res = await apiFetch(`/api/dashboard/insights/${routeId}?organizationId=${orgId}`);
        setData(res);
      } catch (err) {
        console.error("Erro ao carregar detalhes do criativo:", err);
        if (!data) setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchAdDetails();
  }, [routeId]);

  useEffect(() => {
    if (!routeId || !data?.ai_processing?.pending) return undefined;
    const orgId = getStoredOrganizationId();
    if (!orgId) return undefined;

    const timer = setInterval(async () => {
      try {
        const res = await apiFetch(`/api/dashboard/insights/${routeId}?organizationId=${orgId}`);
        setData(res);
      } catch (_) {
        /** polling silencioso */
      }
    }, 8000);

    return () => clearInterval(timer);
  }, [routeId, data?.ai_processing?.pending, data?.ai_processing?.status]);

  const triggerAnalysis = useCallback(
    async (force = false) => {
      if (!routeId) return;
      const orgId = getStoredOrganizationId();
      if (!orgId) return;
      try {
        await apiFetch(`/api/dashboard/insights/${routeId}/analyze?organizationId=${orgId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ force }),
        });
        const res = await apiFetch(`/api/dashboard/insights/${routeId}?organizationId=${orgId}`);
        setData(res);
      } catch (err) {
        console.error("Erro ao enfileirar análise IA:", err);
        alert(err.message || "Não foi possível iniciar a análise.");
      }
    },
    [routeId],
  );

  const filteredDaily = useMemo(() => {
    const series = data?.performance_daily;
    if (!series?.length) return [];
    return filterSeriesByRange(series, rangeKey, customFrom, customTo);
  }, [data?.performance_daily, rangeKey, customFrom, customTo]);

  const agg = useMemo(() => aggregateFromDaily(filteredDaily), [filteredDaily]);

  const hasSyncedPerformance = Boolean(data?.performance_daily?.length);
  const hasPeriodPerformance = filteredDaily.length > 0;

  const noDataNotice = useMemo(() => {
    if (!data || hasPeriodPerformance) return null;
    if (data.delivery_note) return data.delivery_note;
    if (!hasSyncedPerformance) {
      return "Este anúncio não possui dados de entrega (impressões ou gasto) sincronizados da Meta. Verifique se o anúncio teve veiculação no período ou importe outro criativo com performance.";
    }
    return "Não há dados de performance da Meta no período selecionado. Tente ampliar o intervalo de datas.";
  }, [data, hasPeriodPerformance, hasSyncedPerformance]);

  const aiRaw = useMemo(() => resolveInsightAiAnalysis(data), [data]);
  const aiUiPayload = useMemo(() => pickAiUiForNormalize(data, aiRaw), [data, aiRaw]);
  const transcriptText = useMemo(() => resolveInsightTranscript(data), [data]);
  const chartColors = useMemo(() => chartAxisColors(theme), [theme]);
  const tooltipStyle = useMemo(() => chartTooltipStyle(), [theme]);

  const radarData = useMemo(() => {
    const normalized = normalizeAiCreativeAnalysis(aiRaw, {
      aiUi: aiUiPayload,
      videoMetrics: data?.video_metrics,
    });
    if (normalized.pending) return [];
    if (Array.isArray(normalized.chartSeries) && normalized.chartSeries.length) {
      return normalized.chartSeries.map((row) => ({
        metric: row.label,
        value: row.value || 0,
      }));
    }
    return [
      { metric: "Gancho", value: normalized.scores.gancho || 0 },
      { metric: "Oferta", value: normalized.scores.oferta || 0 },
      { metric: "Prova", value: normalized.scores.prova || 0 },
      { metric: "CTA", value: normalized.scores.cta || 0 },
      { metric: "Harmonia", value: normalized.scores.harmonia || normalized.scores.formato || 0 },
    ];
  }, [aiRaw, aiUiPayload, data?.video_metrics]);

  const aiNormalized = useMemo(
    () =>
      normalizeAiCreativeAnalysis(aiRaw, {
        aiUi: aiUiPayload,
        videoMetrics: data?.video_metrics,
      }),
    [aiRaw, aiUiPayload, data?.video_metrics],
  );

  const needsVerMais = useMemo(() => {
    const text = data?.primary_text || "";
    return text.length > COPY_COLLAPSE_CHARS;
  }, [data?.primary_text]);

  if (loading) {
    return <CreativeDetailSkeleton />;
  }

  if (!data) {
    return (
      <div className={styles.page}>
        <p className={styles.hintMuted}>Não foi possível carregar este criativo.</p>
        <Link href="/criativo" className={styles.crumbLink}>
          ← Voltar aos criativos
        </Link>
      </div>
    );
  }

  const ai = aiRaw || {};
  const aiScoresForBars = aiNormalized.scores;
  const aiProcessing = data.ai_processing || {};
  const coachMessage =
    aiNormalized.verdict ||
    aiProcessing.label ||
    (aiProcessing.pending
      ? "Estou transcrevendo o vídeo e cruzando com a copy do anúncio. Em instantes mostro scores e sugestões."
      : "Importe um vídeo ou dispare a análise para eu avaliar gancho, oferta, prova social e CTA.");

  return (
    <div className={styles.page}>
      <header className={styles.detailHeader}>
        <div className={styles.headerMain}>
          <p className={styles.breadcrumb}>
            <Link href="/criativo" className={styles.crumbLink}>
              Criativos
            </Link>
            <span className={styles.crumbSep}>/</span>
            <span className={styles.crumbCurrent}>Detalhes do anúncio</span>
          </p>
          <h1 id={titleId} className={styles.pageTitle}>
            {data.headline}
          </h1>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.deleteBtn}
            title="Excluir este criativo do Hooko"
            aria-label="Excluir este criativo"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <IconTrashDetail className={styles.deleteIcon} />
          </button>
        </div>
      </header>

      {noDataNotice ? (
        <div className={styles.noDataBanner} role="alert">
          <p className={styles.noDataTitle}>Sem dados de performance</p>
          <p className={styles.noDataText}>{noDataNotice}</p>
        </div>
      ) : null}

      {aiProcessing.pending ? (
        <div className={styles.noDataBanner} role="status">
          <p className={styles.noDataTitle}>Análise IA em andamento</p>
          <p className={styles.noDataText}>{aiProcessing.label || "Processando transcrição e insights…"}</p>
        </div>
      ) : null}

      {!aiProcessing.pending && !aiNormalized.performanceScore && data.meta_video_id ? (
        <div className={styles.noDataBanner}>
          <p className={styles.noDataTitle}>Análise IA pendente</p>
          <p className={styles.noDataText}>
            Este anúncio ainda não foi analisado. Dispare a análise para gerar transcrição e scores.
          </p>
          <button type="button" className={styles.presetBtn} onClick={() => triggerAnalysis(false)}>
            Analisar com Gemini
          </button>
        </div>
      ) : null}

      {aiProcessing.status === "failed" || aiProcessing.status === "failed_ai" ? (
        <div className={styles.noDataBanner} role="alert">
          <p className={styles.noDataTitle}>Falha na análise IA</p>
          <p className={styles.noDataText}>
            {aiProcessing.error || "Verifique GEMINI_API_KEY, worker de vídeo e Redis."}
          </p>
          <button type="button" className={styles.presetBtn} onClick={() => triggerAnalysis(true)}>
            Tentar novamente
          </button>
        </div>
      ) : null}

      <section className={styles.aiPanels} aria-label="Painéis de análise IA">
        <div className={styles.aiPanelsGrid}>
          <WinningCreativeCard
            title="Criativo vencedor"
            headline={data.headline}
            thumbnailUrl={data.thumbnail_url || data.thumbnailUrl}
            analysis={aiNormalized}
          />
          <AiInsightsPanel analysis={aiNormalized} />
        </div>
        <HookoAiCoach message={coachMessage} />
      </section>

      {transcriptText ? (
        <section className={styles.verdictBox} style={{ marginBottom: "1.25rem" }} aria-label="Transcrição do vídeo">
          <div className={styles.verdictSection}>
            <h3 className={styles.verdictHeading}>Transcrição do vídeo</h3>
            <p className={styles.transcriptBody}>{transcriptText}</p>
          </div>
        </section>
      ) : null}

      <section className={styles.analyticsBand} aria-label="Performance e período">
        <div className={styles.filterRow}>
          <span className={styles.filterLabel}>Período</span>
          <div className={styles.presetGroup} role="group" aria-label="Presets de data">
            {DATE_RANGE_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                className={`${styles.presetBtn} ${rangeKey === p.value ? styles.presetBtnActive : ""}`}
                onClick={() => setRangeKey(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
          {rangeKey === "custom" ? (
            <div className={styles.customDates}>
              <label className={styles.dateField}>
                <span className={styles.dateFieldLabel}>De</span>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </label>
              <label className={styles.dateField}>
                <span className={styles.dateFieldLabel}>Até</span>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </label>
            </div>
          ) : null}
        </div>

        <p className={styles.bandHint}>
          {hasPeriodPerformance
            ? `Métricas abaixo refletem o período selecionado (${filteredDaily.length} dias com dados da Meta).`
            : "Nenhum dia com entrega da Meta no período selecionado — gráficos e totais ficam zerados."}
        </p>

        <div className={styles.perfGrid}>
          <div className={styles.perfBlock}>
            <span className={styles.perfLabel}>ROAS</span>
            <span className={styles.perfValue}>{agg.roas.toFixed(2)}</span>
            <span className={styles.perfSub}>média ponderada pelo gasto</span>
          </div>
          <div className={styles.perfBlock}>
            <span className={styles.perfLabel}>CTR</span>
            <span className={styles.perfValue}>{agg.ctr.toFixed(2)}%</span>
            <span className={styles.perfSub}>média ponderada pelas impressões</span>
          </div>
          <div className={styles.perfBlock}>
            <span className={styles.perfLabel}>Gasto</span>
            <span className={styles.perfValue}>{formatCurrencyBRL(agg.spend)}</span>
            <span className={styles.perfSub}>total no período</span>
          </div>
        </div>

        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Gasto e ROAS</h2>
            <div className={styles.chartArea}>
              <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                <ComposedChart data={filteredDaily} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke={chartColors.grid} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: chartColors.axis, fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: chartColors.grid }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: chartColors.axis, fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: chartColors.axisGold, fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value, name) => {
                      if (name === "spend") return [formatCurrencyBRL(Number(value)), "Gasto"];
                      if (name === "roas") return [Number(value).toFixed(2), "ROAS"];
                      return [value, name];
                    }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="spend"
                    stroke="rgba(125,211,252,0.6)"
                    fill="url(#creativeSpendGrad)"
                    strokeWidth={1.5}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="roas"
                    stroke="#d4af37"
                    strokeWidth={2}
                    dot={false}
                  />
                  <defs>
                    <linearGradient id="creativeSpendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(125,211,252,0.35)" />
                      <stop offset="100%" stopColor="rgba(125,211,252,0.02)" />
                    </linearGradient>
                  </defs>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Impressões e CTR</h2>
            <div className={styles.chartArea}>
              <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                <ComposedChart data={filteredDaily} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke={chartColors.grid} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: chartColors.axis, fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: chartColors.grid }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: chartColors.axis, fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`)}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: chartColors.axisPurple, fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value, name) => {
                      if (name === "impressions")
                        return [new Intl.NumberFormat("pt-BR").format(Number(value)), "Impressões"];
                      if (name === "ctr") return [`${Number(value).toFixed(2)}%`, "CTR"];
                      return [value, name];
                    }}
                  />
                  <Bar yAxisId="left" dataKey="impressions" fill="rgba(196,181,253,0.35)" radius={[4, 4, 0, 0]} />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="ctr"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </section>

      <div className={styles.split}>
        <section className={styles.colLeft} aria-label="Anúncio e texto">
          <div className={styles.panelLabel}>Anúncio</div>
          {(() => {
            const playableUrl = hasPlayableVideoUrl(data.media_url) ? data.media_url : null;
            const igPermalink = data.embed_url || data.creative_meta?.instagram_permalink_url || "";
            const showInstagram =
              !playableUrl &&
              shouldShowInstagramEmbed({
                embedUrl: igPermalink,
                mediaUrl: data.media_url,
                mediaType: data.media_type,
                creativeMeta: data.creative_meta,
              });

            if (showInstagram) {
              return (
                <InstagramCreativeEmbed
                  permalinkUrl={igPermalink}
                  posterUrl={data.thumbnail_url}
                />
              );
            }

            return (
          <div className={styles.videoShell}>
            <div className={styles.videoInner}>
              <div className={styles.videoRatio}>
                {(() => {
                  const rawId = data.vturb_video_id || data.vturbVideoId;
                  if (rawId) {
                    const cleanId = String(rawId).replace(/[^a-zA-Z0-9_-]/g, "");
                    if (cleanId) {
                      return (
                        <iframe
                          src={`https://scripts.converteai.net/${cleanId}/players/${cleanId}/embed.html`}
                          style={{ width: "100%", height: "100%", border: "none", position: "absolute", top: 0, left: 0 }}
                          allowFullScreen
                        />
                      );
                    }
                  }
                  return (
                    <MetaVideoPlayer
                      mediaId={data.media_id}
                      adId={routeId}
                      initialVideoUrl={playableUrl || data.media_url}
                      posterUrl={data.thumbnail_url}
                      mediaType={data.media_type === "embed" ? "video" : data.media_type}
                    />
                  );
                })()}
              </div>
            </div>
          </div>
            );
          })()}

          <div className={styles.copyCard}>
            <h2 className={styles.copyLabel}>Primary text</h2>
            <p className={`${styles.copyBody} ${!copyExpanded && needsVerMais ? styles.copyBodyCollapsed : ""}`}>
              {data.primary_text}
            </p>
            {needsVerMais ? (
              <button type="button" className={styles.verMoreBtn} onClick={() => setCopyExpanded((e) => !e)}>
                {copyExpanded ? "Ver menos" : "Ver mais"}
              </button>
            ) : null}

            <div className={styles.copyDivider} aria-hidden />

            <div className={styles.ctaRow}>
              <span className={styles.ctaLabel}>CTA type</span>
              <span className={styles.ctaPill}>{formatCta(data.cta_type)}</span>
            </div>
          </div>

          {transcriptText ? (
            <div className={styles.transcriptCard}>
              <h2 className={styles.copyLabel}>Transcrição do vídeo</h2>
              <p className={styles.transcriptBody}>{transcriptText}</p>
            </div>
          ) : null}
        </section>

        <aside className={styles.colRight}>
          <div className={styles.panelLabel}>Análise da IA</div>

          <div className={styles.aiScoresRow}>
            <div className={styles.radarCard}>
              <h2 className={styles.cardTitle}>Perfil de scores</h2>
              <div className={styles.radarWrap}>
                <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                  <RadarChart cx="50%" cy="52%" outerRadius="72%" data={radarData}>
                    <PolarGrid stroke={chartColors.polarGrid} />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: chartColors.polarTick, fontSize: 10 }} />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="#d4af37"
                      fill="#d4af37"
                      fillOpacity={0.28}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={styles.scoreCard}>
              <h2 className={styles.cardTitle}>Score da IA — barras</h2>
              <div className={styles.scoreList}>
                {SCORE_METRICS.map((m) => {
                  const fieldMap = {
                    hook_score: aiScoresForBars.gancho,
                    offer_score: aiScoresForBars.oferta,
                    social_proof_score: aiScoresForBars.prova,
                    cta_score: aiScoresForBars.cta,
                    harmonia_entre_video_e_texto: aiScoresForBars.harmonia ?? aiScoresForBars.formato,
                  };
                  return <ScoreBarRow key={m.key} label={m.label} value={fieldMap[m.field]} />;
                })}
              </div>
            </div>
          </div>

          <div className={styles.verdictBox}>
            <div className={styles.verdictSection}>
              <h3 className={styles.verdictHeading}>Veredito</h3>
              <p className={styles.verdictBody}>{aiNormalized.verdict || ai.feedback || "A IA preenche após analisar o vídeo."}</p>
            </div>
            <div className={styles.verdictSection}>
              <h3 className={styles.verdictHeading}>Sugestões de melhoria</h3>
              <p className={styles.verdictBody}>
                {aiNormalized.suggestions.length
                  ? aiNormalized.suggestions.join(" ")
                  : typeof ai.sugestoes === "string"
                    ? ai.sugestoes
                    : "Importe e aguarde a análise automática."}
              </p>
            </div>
          </div>
        </aside>
      </div>

      {deleteConfirmOpen ? (
        <div
          className={styles.modalRoot}
          role="presentation"
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
              O criativo <strong>{data.headline}</strong> deixa de aparecer no Hooko. Esta ação{" "}
              <strong>não devolve os créditos</strong> usados na importação — remove apenas do sistema.
            </p>
            <div className={styles.confirmActions}>
              <button type="button" className={styles.confirmBtnSecondary} onClick={closeDeleteConfirm}>
                Cancelar
              </button>
              <button type="button" className={styles.confirmBtnDanger} onClick={confirmRemoveCreative}>
                Excluir definitivamente
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
