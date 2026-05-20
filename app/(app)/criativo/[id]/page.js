"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

const chartTooltipStyle = {
  background: "rgba(14,14,18,0.94)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "#e4e4e7",
};

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

export default function CreativeDetailPage() {
  const params = useParams();
  const router = useRouter();
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
    if (!USE_MOCK) {
      setLoading(false);
      setData(null);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      setData({ ...mockCreativeData, id: routeId || mockCreativeData.id });
      setLoading(false);
    }, LOAD_MS);
    return () => clearTimeout(t);
  }, [routeId]);

  const filteredDaily = useMemo(() => {
    const series = data?.performance_daily;
    if (!series?.length) return [];
    return filterSeriesByRange(series, rangeKey, customFrom, customTo);
  }, [data?.performance_daily, rangeKey, customFrom, customTo]);

  const agg = useMemo(() => aggregateFromDaily(filteredDaily), [filteredDaily]);

  const radarData = useMemo(() => {
    const a = data?.ai_analysis;
    if (!a) return [];
    const shortRadar = ["Gancho", "Oferta", "Social", "CTA", "Harmonia"];
    return SCORE_METRICS.map((m, i) => ({
      metric: shortRadar[i] || m.label,
      value: Number(a[m.field]) || 0,
    }));
  }, [data?.ai_analysis]);

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

  const ai = data.ai_analysis || {};

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
          Métricas abaixo refletem o período selecionado ({filteredDaily.length} dias com dados no mock).
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
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "rgba(161,161,170,0.88)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: "rgba(161,161,170,0.75)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: "rgba(212,175,55,0.85)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
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
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "rgba(161,161,170,0.88)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: "rgba(161,161,170,0.75)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`)}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: "rgba(196,181,253,0.9)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
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
          <div className={styles.videoShell}>
            <div className={styles.videoInner}>
              <div className={styles.videoRatio}>
                {data.vturb_video_id || data.vturbVideoId ? (
                  <iframe
                    src={`https://scripts.converteai.net/${data.vturb_video_id || data.vturbVideoId}/players/${data.vturb_video_id || data.vturbVideoId}/embed.html`}
                    style={{ width: "100%", height: "100%", border: "none", position: "absolute", top: 0, left: 0 }}
                    allowFullScreen
                  />
                ) : (
                  <video className={styles.videoEl} controls playsInline preload="metadata" src={data.media_url} />
                )}
              </div>
            </div>
          </div>

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
        </section>

        <aside className={styles.colRight}>
          <div className={styles.panelLabel}>Análise da IA</div>

          <div className={styles.aiScoresRow}>
            <div className={styles.radarCard}>
              <h2 className={styles.cardTitle}>Perfil de scores</h2>
              <div className={styles.radarWrap}>
                <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                  <RadarChart cx="50%" cy="52%" outerRadius="72%" data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "rgba(180,180,188,0.85)", fontSize: 10 }} />
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
                {SCORE_METRICS.map((m) => (
                  <ScoreBarRow key={m.key} label={m.label} value={ai[m.field]} />
                ))}
              </div>
            </div>
          </div>

          <div className={styles.verdictBox}>
            <div className={styles.verdictSection}>
              <h3 className={styles.verdictHeading}>Veredito</h3>
              <p className={styles.verdictBody}>{ai.feedback}</p>
            </div>
            <div className={styles.verdictSection}>
              <h3 className={styles.verdictHeading}>Sugestões de melhoria</h3>
              <p className={styles.verdictBody}>{ai.sugestoes}</p>
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
