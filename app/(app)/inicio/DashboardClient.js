"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  LineChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from "recharts";
import styles from "./page.module.css";

/** Lista fixa para multi-seleção (comparar uma ou várias campanhas) */
const CAMPAIGN_LIST = [
  { id: "rmkt", label: "Remarketing — Carrinho" },
  { id: "tof", label: "Topo de funil — Vídeo" },
  { id: "mx", label: "Performance Max — Brand" },
  { id: "leads", label: "Conversão — Leads" },
];

const DATE_PRESETS = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Semanal" },
  { value: "month", label: "Mensal" },
  { value: "year", label: "Anual" },
  { value: "custom", label: "Data específica" },
];

const CAMPAIGN_COLOR = {
  rmkt: "#e8c547",
  tof: "#7dd3fc",
  mx: "#c4b5fd",
  leads: "#86efac",
};

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

function formatDayPt(d) {
  const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  return `${days[d.getDay()]} ${String(d.getDate()).padStart(2, "0")}`;
}

function seed(base, key) {
  const k = `${base}:${key}`;
  let h = 0;
  for (let i = 0; i < k.length; i++) h = (Math.imul(31, h) + k.charCodeAt(i)) | 0;
  const x = Math.sin(h * 0.001273) * 10000;
  return x - Math.floor(x);
}

/** Define os “buckets” do eixo temporal conforme o filtro */
function buildBucketList(datePreset, dateFrom, dateTo) {
  const end = new Date();
  end.setHours(12, 0, 0, 0);

  if (datePreset === "today") {
    const out = [];
    for (let i = 0; i < 8; i++) {
      const h = i * 3;
      out.push({
        key: `td${i}`,
        dayShort: `${String(h).padStart(2, "0")}h`,
        full: `${String(h).padStart(2, "0")}h — hoje`,
      });
    }
    return out;
  }

  if (datePreset === "week") {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(end, -i);
      out.push({
        key: `w${toYMD(d)}`,
        dayShort: formatDayPt(d),
        full: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      });
    }
    return out;
  }

  if (datePreset === "month") {
    const out = [];
    for (let i = 29; i >= 0; i--) {
      const d = addDays(end, -i);
      out.push({
        key: `m${toYMD(d)}`,
        dayShort:
          i % 5 === 0 || i === 0
            ? `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, "0")}`
            : `${d.getDate()}`,
        full: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      });
    }
    return out;
  }

  if (datePreset === "year") {
    const out = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(end.getFullYear(), end.getMonth() - i, 1, 12, 0, 0);
      out.push({
        key: `y${d.getFullYear()}-${d.getMonth()}`,
        dayShort: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        full: d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
      });
    }
    return out;
  }

  /* custom */
  let a = parseYMD(dateFrom) ?? addDays(end, -13);
  let b = parseYMD(dateTo) ?? end;
  if (a > b) [a, b] = [b, a];
  const diff = Math.ceil((b - a) / 86400000) + 1;
  const maxDays = Math.min(diff, 90);
  const out = [];
  for (let i = 0; i < maxDays; i++) {
    const d = addDays(a, i);
    if (d > b) break;
    const label =
      maxDays > 34 ? `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, "0")}` : formatDayPt(d);
    out.push({
      key: `c${toYMD(d)}`,
      dayShort: label.length > 6 ? `${d.getDate()}/${d.getMonth() + 1}` : label,
      full: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" }),
    });
  }
  return out;
}

/** Uma série temporal com ROAS blend, gasto total e valores por campanha (+ CTR opcional para gráficos extra) */
function buildTimelineRows(buckets, campaignIds) {
  return buckets.map((b, idx) => {
    const row = {
      idx,
      dayShort: b.dayShort,
      full: b.full,
    };
    let totalSpend = 0;
    let num = 0;
    campaignIds.forEach((cid) => {
      const s = seed(cid, `${b.key}:sp`);
      const t = seed(cid, `${b.key}:tr`);
      const spend = Math.round(280 + s * 2100 + t * 700 + idx * (13 + num * 3));
      const wave = Math.sin(idx / (buckets.length > 20 ? 5 : 3) + num) * 0.42;
      const roas = Number((1.45 + wave + t * 1.75 + s * 0.45).toFixed(2));
      const ctr = Number((0.35 + seed(cid, `${b.key}:ct`) * 3.85).toFixed(2));

      row[`gasto_${cid}`] = spend;
      row[`roas_${cid}`] = roas;
      row[`ctr_${cid}`] = ctr;
      totalSpend += spend;
      num += 1;
    });

    const roasBlend =
      campaignIds.length === 0
        ? 0
        : Number(
            (
              campaignIds.reduce((acc, cid) => acc + row[`roas_${cid}`] * row[`gasto_${cid}`], 0) /
              Math.max(1, totalSpend)
            ).toFixed(2),
          );
    row.roas = roasBlend;
    row.gastoBrl = totalSpend;
    row.ctrAvg = Number(
      (
        campaignIds.reduce((acc, cid) => acc + row[`ctr_${cid}`], 0) / Math.max(1, campaignIds.length)
      ).toFixed(2),
    );
    return row;
  });
}

function campaignLabel(id) {
  return CAMPAIGN_LIST.find((c) => c.id === id)?.label ?? id;
}

function shortCampaign(id) {
  const full = campaignLabel(id);
  return full.length > 22 ? `${full.slice(0, 20)}…` : full;
}

/** Gasto médio CTR agregados por campanha (período completo — barras comparativas) */
function buildBarTotals(rows, campaignIds) {
  return campaignIds.map((id) => {
    const gasto = rows.reduce((s, r) => s + (r[`gasto_${id}`] ?? 0), 0);
    const ctrMean =
      rows.length === 0
        ? 0
        : Number((rows.reduce((s, r) => s + (r[`ctr_${id}`] ?? 0), 0) / rows.length).toFixed(2));
    return {
      id,
      nome: campaignLabel(id),
      shortLabel: shortCampaign(id),
      gasto,
      ctr: ctrMean,
    };
  });
}

function buildScatterByCampaign(daysFactor, campaignIds) {
  const out = {};
  const nPt = Math.min(56, Math.max(16, Math.round(daysFactor * 14)));
  campaignIds.forEach((cid, ci) => {
    const pts = [];
    for (let i = 0; i < nPt; i++) {
      const sx = seed(cid, `sx${i}${ci}`);
      const sy = seed(cid, `sy${i}${ci}`);
      const gancho = Number((sx * 9 + 0.35).toFixed(1));
      const roas = Number((1.05 + sy * 2.9 + sx * sy * 0.75).toFixed(2));
      pts.push({
        id: `${cid}-${i}`,
        gancho,
        roas,
        criativo: `#${1120 + Math.floor(seed(cid, `idx${i}`) * 380)}`,
        campanha: campaignLabel(cid),
        campId: cid,
      });
    }
    out[cid] = pts;
  });
  return out;
}

/** Curva de audiência exemplo por campanha — substituir por Meta/video asset quando existir no backend */
function buildVideoAudienceInsightForCampaign(campaignId) {
  const key = campaignId || "na";
  const rows = [];
  let pctAudience = 100;
  for (let i = 0; i <= 20; i++) {
    const x = i * 5;
    const drift = seed(key, `aud${i}`) * 2.65 + 0.95;
    const bump = Math.sin(i / 2.65) * 3.25;
    pctAudience = Math.max(17, pctAudience - drift + bump * 0.22);
    rows.push({
      t: `${x}%`,
      x,
      retencao: Number(pctAudience.toFixed(1)),
    });
  }
  let bestX = rows.length > 1 ? rows[1].x : 0;
  let bestV = rows.length > 1 ? rows[1].retencao : 0;
  /* Ignora o primeiro ponto (sempre 100%) para localizar onde a curva forma “plateau” relativo */
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].retencao >= bestV) {
      bestV = rows[i].retencao;
      bestX = rows[i].x;
    }
  }
  let maxDrop = 0;
  let dropAtX = rows[1].x;
  for (let i = 1; i < rows.length; i++) {
    const drop = rows[i - 1].retencao - rows[i].retencao;
    if (drop > maxDrop) {
      maxDrop = drop;
      dropAtX = rows[i].x;
    }
  }
  const avgRet = rows.reduce((s, r) => s + r.retencao, 0) / rows.length;
  let estado = "Revise o primeiro gancho · queda rápido";
  if (avgRet >= 60) estado = "Bom apego relativo ao período filtrado";
  else if (avgRet >= 44) estado = "Médio — testar corte até ~3 s";
  return {
    serie: rows,
    picoPct: bestX,
    maiorQuedaAproxPct: dropAtX,
    quedaPct: Number(maxDrop.toFixed(1)),
    retMedia: Number(avgRet.toFixed(1)),
    estado,
  };
}

function buildRadarMerged(campaignIds) {
  const dims = [
    { key: "gancho", dim: "Gancho", full: "Média do gancho" },
    { key: "cta", dim: "CTA", full: "Média do CTA" },
    { key: "prova", dim: "Prova", full: "Média da prova social" },
  ];

  function oneRadar(id) {
    return [
      { dim: "Gancho", valor: Number((6 + seed(id, "g") * 3.4).toFixed(1)), full: "Média do gancho" },
      { dim: "CTA", valor: Number((5 + seed(id, "c") * 3.8).toFixed(1)), full: "Média do CTA" },
      { dim: "Prova", valor: Number((6.2 + seed(id, "p") * 3.2).toFixed(1)), full: "Média da prova social" },
    ];
  }

  const result = dims.map((d0) => {
    let sum = 0;
    campaignIds.forEach((id) => {
      const slice = oneRadar(id).find((x) => x.dim === d0.dim);
      sum += slice?.valor ?? 0;
    });
    const valor = Number((sum / Math.max(1, campaignIds.length)).toFixed(1));
    return { dim: d0.dim, full: d0.full, valor };
  });
  return result;
}

function brlFmt(n) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);
}

/* ——— Skeletons ——— */

function SkeletonMainChart() {
  return (
    <div className={styles.skelChartCard}>
      <div className={styles.skelHead}>
        <div className={`${styles.skel} ${styles.skelTitle}`} />
        <div className={`${styles.skel} ${styles.skelSubtitle}`} />
      </div>
      <div className={`${styles.skel} ${styles.skelPlot} ${styles.skelPlotMain}`} />
      <div className={styles.legendHint} aria-hidden style={{ visibility: "hidden" }}>
        <span>·</span>
      </div>
    </div>
  );
}

function SkeletonScatterPlot() {
  return (
    <div className={styles.skelChartCard}>
      <div className={styles.skelHead}>
        <div className={`${styles.skel} ${styles.skelTitle}`} />
        <div className={`${styles.skel} ${styles.skelSubtitle}`} />
      </div>
      <div className={`${styles.skel} ${styles.skelPlot} ${styles.skelPlotSmall}`} />
    </div>
  );
}

function SkeletonRadarPlot() {
  return (
    <div className={styles.skelChartCard}>
      <div className={styles.skelHead}>
        <div className={`${styles.skel} ${styles.skelTitle}`} />
        <div className={`${styles.skel} ${styles.skelSubtitle}`} />
      </div>
      <div className={`${styles.skel} ${styles.skelPlot} ${styles.skelPlotSmall}`} />
    </div>
  );
}

function SkeletonCompareRow() {
  return (
    <div className={styles.skelChartCard}>
      <div className={styles.skelHead}>
        <div className={`${styles.skel} ${styles.skelTitle}`} />
        <div className={`${styles.skel} ${styles.skelSubtitle}`} />
      </div>
      <div className={`${styles.skel} ${styles.skelPlot} ${styles.skelPlotWide}`} />
    </div>
  );
}

function SkeletonVideoBlock() {
  return (
    <div className={styles.skelChartCard}>
      <div className={styles.skelHead}>
        <div className={`${styles.skel} ${styles.skelTitle}`} />
        <div className={`${styles.skel} ${styles.skelSubtitle}`} />
      </div>
      <div className={`${styles.skel} ${styles.skelPlot} ${styles.skelPlotSmall}`} />
    </div>
  );
}

function SkeletonChartGrid() {
  return (
    <div className={styles.grid} aria-busy aria-label="Carregando gráficos">
      <SkeletonMainChart />
      <SkeletonCompareRow />
      <div className={styles.chartRow}>
        <SkeletonScatterPlot />
        <SkeletonRadarPlot />
      </div>
      <SkeletonCompareRow />
      <SkeletonVideoBlock />
    </div>
  );
}

function TooltipTime({ active, payload, styles: css }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className={css.tooltipOuter}>
      <p className={css.tooltipTitle}>{row.full ?? row.dayShort}</p>
      <div className={css.tooltipRows}>
        <div className={css.tooltipRow}>
          <span>
            <span className={css.tooltipDot} style={{ background: "#e8c547" }} />
            ROAS (média)
          </span>
          <span className={css.tooltipDatum}>{Number(row.roas).toFixed(2)}</span>
        </div>
        <div className={css.tooltipRow}>
          <span>
            <span className={css.tooltipDot} style={{ background: "rgba(113, 113, 122, 0.95)" }} />
            Gasto
          </span>
          <span className={css.tooltipDatum}>{brlFmt(row.gastoBrl)}</span>
        </div>
        <div className={css.tooltipRow}>
          <span>CTR médio (%)</span>
          <span className={css.tooltipDatum}>{Number(row.ctrAvg).toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
}

function TooltipScatter({ active, payload, styles: css }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  return (
    <div className={css.tooltipOuter}>
      <p className={css.tooltipTitle}>{p.criativo}</p>
      <div className={css.tooltipRows}>
        <div className={css.tooltipRow}>
          <span>Campanha</span>
          <span className={css.tooltipDatum}>{p.campanha}</span>
        </div>
        <div className={css.tooltipRow}>
          <span>Nota gancho (IA)</span>
          <span className={css.tooltipDatum}>{p.gancho}</span>
        </div>
        <div className={css.tooltipRow}>
          <span>ROAS</span>
          <span className={css.tooltipDatum}>{p.roas.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function TooltipRadar({ active, payload, styles: css }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const raw = item.payload ?? item;
  const label = raw?.full ?? item.name ?? raw?.dim ?? "—";
  const valor = raw?.valor ?? item.value;
  if (valor == null) return null;
  return (
    <div className={css.tooltipOuter}>
      <p className={css.tooltipTitle}>{label}</p>
      <div className={css.tooltipRows}>
        <div className={css.tooltipRow}>
          <span>Média (0–10)</span>
          <span className={css.tooltipDatum}>{valor}</span>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_WIDGETS = {
  compareRoas: true,
  compareSpendCtr: true,
  ctrTimeline: false,
};

export default function DashboardClient() {
  const gid = useId().replace(/:/g, "");
  const [datePreset, setDatePreset] = useState("week");
  const [dateFrom, setDateFrom] = useState(() => toYMD(addDays(new Date(), -13)));
  const [dateTo, setDateTo] = useState(() => toYMD(new Date()));
  const [selectedCampaigns, setSelectedCampaigns] = useState(
    () => new Set(CAMPAIGN_LIST.map((c) => c.id)),
  );
  const [extraCharts, setExtraCharts] = useState(DEFAULT_WIDGETS);
  const [isLoading, setIsLoading] = useState(true);
  const [campOpen, setCampOpen] = useState(false);
  const campDropdownRef = useRef(null);

  const campaignIds = useMemo(
    () => CAMPAIGN_LIST.filter((c) => selectedCampaigns.has(c.id)).map((c) => c.id),
    [selectedCampaigns],
  );

  const filterKey = useMemo(
    () => `${datePreset}|${dateFrom}|${dateTo}|${[...campaignIds].sort().join(",")}`,
    [datePreset, dateFrom, dateTo, campaignIds],
  );

  useEffect(() => {
    setIsLoading(true);
    const t = window.setTimeout(() => setIsLoading(false), 880);
    return () => window.clearTimeout(t);
  }, [filterKey]);

  useEffect(() => {
    if (!campOpen) return undefined;
    function handlePointerDown(event) {
      if (campDropdownRef.current?.contains(event.target)) return;
      setCampOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [campOpen]);

  const buckets = useMemo(() => buildBucketList(datePreset, dateFrom, dateTo), [datePreset, dateFrom, dateTo]);

  const timeline = useMemo(
    () =>
      campaignIds.length === 0
        ? []
        : buildTimelineRows(buckets, campaignIds),
    [buckets, campaignIds],
  );

  const barTotals = useMemo(
    () => (campaignIds.length === 0 ? [] : buildBarTotals(timeline, campaignIds)),
    [timeline, campaignIds],
  );

  const scatterByCamp = useMemo(() => buildScatterByCampaign(buckets.length, campaignIds), [buckets.length, campaignIds]);

  const radarAvg = useMemo(
    () => (campaignIds.length === 0 ? [] : buildRadarMerged(campaignIds)),
    [campaignIds],
  );

  const videoInsightsPerCampaign = useMemo(
    () => campaignIds.map((id) => ({ id, insight: buildVideoAudienceInsightForCampaign(id) })),
    [campaignIds, filterKey],
  );

  const toggleCampaign = useCallback((id) => {
    setSelectedCampaigns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size <= 1) return next;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllCampaigns = useCallback(() => {
    setSelectedCampaigns(new Set(CAMPAIGN_LIST.map((c) => c.id)));
  }, []);

  const toggleWidget = useCallback((key) => {
    setExtraCharts((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const roasGlowId = `${gid}-roasGlow`;
  const goldGradId = `${gid}-goldGrad`;
  const spendGradId = `${gid}-spendGrad`;
  const barGastoGradId = `${gid}-barGasto`;
  const barCtrGradId = `${gid}-barCtr`;

  const xInterval = buckets.length > 18 ? Math.max(1, Math.floor(buckets.length / 10)) : 0;

  return (
    <div className={styles.page}>
      <header className={styles.headerRow}>
        <div className={styles.heading}>
          <p className={styles.kicker}>Performance × IA</p>
          <h1 className={styles.title}>Dashboard de métricas</h1>
          <p className={styles.sub}>
            Filtros de data e de campanhas (uma ou várias para comparar) alimentam todos os gráficos. Os blocos extra
            ligam ou desligam em <strong>Gráficos adicionais</strong>. Dados de demonstração até ligar à API.
          </p>
        </div>

        <div className={styles.filtersBlock}>
          <div className={styles.filters}>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="dash-date-preset">
                Datas
              </label>
              <select
                id="dash-date-preset"
                className={styles.select}
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
              >
                {DATE_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {datePreset === "custom" && (
              <div className={styles.dateCustomRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="dash-df">
                    Início
                  </label>
                  <input
                    id="dash-df"
                    type="date"
                    className={styles.inputDate}
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="dash-dt">
                    Fim
                  </label>
                  <input
                    id="dash-dt"
                    type="date"
                    className={styles.inputDate}
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className={styles.filtersDivider} aria-hidden />

          <div className={styles.filters}>
            <div className={`${styles.field} ${styles.campaignField}`}>
              <span className={styles.fieldLabel} id="dash-camp-label">
                Campanhas (compare uma ou várias)
              </span>
              <div className={styles.dropWrap} ref={campDropdownRef}>
                <button
                  type="button"
                  id="dash-camp-trigger"
                  className={styles.dropTrigger}
                  aria-expanded={campOpen}
                  aria-haspopup="listbox"
                  aria-labelledby="dash-camp-label dash-camp-trigger"
                  onClick={() => setCampOpen((v) => !v)}
                >
                  <span className={styles.dropSummary}>
                    {selectedCampaigns.size} de {CAMPAIGN_LIST.length} selecionada
                    {selectedCampaigns.size === 1 ? "" : "s"}
                    <span className={styles.dropSummaryMuted}> — abrir para alterar</span>
                  </span>
                </button>
                {campOpen && (
                  <div className={styles.dropPanel} role="listbox" aria-multiselectable="true">
                    <div className={styles.checkboxGrid}>
                      {CAMPAIGN_LIST.map((c) => (
                        <label key={c.id} className={styles.chkLabel}>
                          <input
                            type="checkbox"
                            role="option"
                            aria-selected={selectedCampaigns.has(c.id)}
                            checked={selectedCampaigns.has(c.id)}
                            onChange={() => toggleCampaign(c.id)}
                          />
                          {c.label}
                        </label>
                      ))}
                    </div>
                    <div className={styles.dropPanelFooter}>
                      <button type="button" className={styles.linkBtn} onClick={selectAllCampaigns}>
                        Marcar todas
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className={styles.widgetPanel} aria-labelledby="dash-widgets-label">
        <h2 id="dash-widgets-label" className={styles.widgetTitle}>
          Gráficos adicionais
        </h2>
        <div className={styles.widgetToggles}>
          <label className={styles.widgetLbl}>
            <input
              type="checkbox"
              checked={extraCharts.compareRoas}
              onChange={() => toggleWidget("compareRoas")}
            />
            Comparação de ROAS (linhas por campanha)
          </label>
          <label className={styles.widgetLbl}>
            <input
              type="checkbox"
              checked={extraCharts.compareSpendCtr}
              onChange={() => toggleWidget("compareSpendCtr")}
            />
            Gasto médio × CTR por campanha (barras)
          </label>
          <label className={styles.widgetLbl}>
            <input
              type="checkbox"
              checked={extraCharts.ctrTimeline}
              onChange={() => toggleWidget("ctrTimeline")}
            />
            CTR no tempo (linhas por campanha)
          </label>
        </div>
      </section>

      {isLoading || campaignIds.length === 0 ? (
        <SkeletonChartGrid />
      ) : (
        <div className={styles.grid}>
          {/* Principal */}
          <section className={styles.chartCard} aria-labelledby="chart-roas-title">
            <div className={styles.chartHead}>
              <div>
                <h2 id="chart-roas-title" className={styles.chartTitle}>
                  ROAS e gasto no período ({DATE_PRESETS.find((p) => p.value === datePreset)?.label})
                </h2>
                <p className={styles.chartHint}>
                  Eixo esquerdo: ROAS médio ponderado pelo gasto do conjunto marcado · Eixo direito: gasto somado das
                  campanhas · CTR médio também no tooltip.
                </p>
              </div>
            </div>
            <div className={`${styles.chartBody} ${styles.chartBodyTall}`}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={timeline} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id={goldGradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e8c547" stopOpacity={0.42} />
                      <stop offset="55%" stopColor="#b8942a" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#8a6d1a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id={spendGradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#71717a" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#52525b" stopOpacity={0} />
                    </linearGradient>
                    <filter id={roasGlowId} x="-40%" y="-40%" width="180%" height="180%">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="b" />
                      <feMerge>
                        <feMergeNode in="b" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 10" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="dayShort"
                    tick={{ fill: "#71717a", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={xInterval}
                  />
                  <YAxis
                    yAxisId="roas"
                    orientation="left"
                    width={42}
                    tick={{ fill: "rgba(232,197,71,0.85)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, "auto"]}
                  />
                  <YAxis
                    yAxisId="gasto"
                    orientation="right"
                    width={48}
                    tick={{ fill: "rgba(161,161,170,0.9)", fontSize: 10 }}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : String(v))}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, "auto"]}
                  />
                  <Tooltip
                    content={<TooltipTime styles={styles} />}
                    cursor={{ stroke: "rgba(255,255,255,0.12)", strokeWidth: 1 }}
                  />
                  <Area
                    yAxisId="gasto"
                    type="monotone"
                    dataKey="gastoBrl"
                    name="Gasto"
                    stroke="rgba(161,161,170,0.45)"
                    strokeWidth={1.35}
                    fill={`url(#${spendGradId})`}
                  />
                  <Area
                    yAxisId="roas"
                    type="monotone"
                    dataKey="roas"
                    name="ROAS"
                    stroke="#f0d875"
                    strokeWidth={2.6}
                    fill={`url(#${goldGradId})`}
                    style={{ filter: `url(#${roasGlowId})` }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.legendHint}>
              <span>
                <span
                  className={styles.legendDot}
                  style={{ background: "#e8c547", boxShadow: "0 0 10px rgba(232,197,71,0.55)" }}
                />
                ROAS médio ponderado (esquerdo)
              </span>
              <span>
                <span className={styles.legendDot} style={{ background: "rgba(113,113,122,0.9)" }} />
                Gasto somado · {campaignIds.length} campanh{campaignIds.length === 1 ? "a" : "as"}
              </span>
            </div>
          </section>

          {extraCharts.compareRoas && (
            <section className={styles.chartCard} aria-labelledby="chart-lines-roas-title">
              <div className={styles.chartHead}>
                <div>
                  <h2 id="chart-lines-roas-title" className={styles.chartTitle}>
                    Comparar ROAS entre campanhas
                  </h2>
                  <p className={styles.chartHint}>
                    Uma linha por campanha selecionada — mesmo período do filtro de datas.
                  </p>
                </div>
              </div>
              <div className={`${styles.chartBody} ${styles.chartBodyMed}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeline} margin={{ top: 8, right: 10, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 10" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="dayShort"
                      tick={{ fill: "#71717a", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      interval={xInterval}
                    />
                    <YAxis
                      domain={[0, "auto"]}
                      tick={{ fill: "#71717a", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={36}
                    />
                    <Tooltip
                      formatter={(value, name) => [`${Number(value).toFixed(2)} ROAS`, name]}
                      labelFormatter={(label, payload) => {
                        const p = payload?.[0]?.payload;
                        return p?.full ?? p?.dayShort ?? label;
                      }}
                      contentStyle={{
                        background: "rgba(10,10,13,0.96)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "#a1a1aa", fontWeight: 600 }}
                    />
                    {campaignIds.map((cid) => (
                      <Line
                        key={cid}
                        type="monotone"
                        dataKey={`roas_${cid}`}
                        name={shortCampaign(cid)}
                        stroke={CAMPAIGN_COLOR[cid]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {extraCharts.compareSpendCtr && (
            <section className={styles.chartCard} aria-labelledby="chart-bar-title">
              <div className={styles.chartHead}>
                <div>
                  <h2 id="chart-bar-title" className={styles.chartTitle}>
                    Gasto total × CTR médio (%)
                  </h2>
                  <p className={styles.chartHint}>
                    Agregados no período: barras de investimento (R$); linha/outro eixo: CTR médio %
                  </p>
                </div>
              </div>
              <div className={`${styles.chartBody} ${styles.chartBodyMed}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={barTotals.map((row) => ({ ...row, gastoMil: Number((row.gasto / 1000).toFixed(2)) }))}
                    margin={{ top: 8, right: 8, left: 4, bottom: 42 }}
                  >
                    <defs>
                      <linearGradient id={barGastoGradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f0d878" />
                        <stop offset="45%" stopColor="#d4af37" />
                        <stop offset="100%" stopColor="#775d12" />
                      </linearGradient>
                      <linearGradient id={barCtrGradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffe8a3" />
                        <stop offset="40%" stopColor="#e8c547" />
                        <stop offset="100%" stopColor="#997a1f" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 10" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="shortLabel"
                      tick={{ fill: "#71717a", fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={-18}
                      textAnchor="end"
                      height={56}
                    />
                    <YAxis
                      yAxisId="rs"
                      orientation="left"
                      tickFormatter={(v) => `${v}k`}
                      tick={{ fill: "rgba(232,197,71,0.82)", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={42}
                      label={{
                        value: "Gasto (mil R$)",
                        angle: -90,
                        position: "insideLeft",
                        fill: "rgba(232,197,71,0.75)",
                        fontSize: 10,
                      }}
                    />
                    <YAxis
                      yAxisId="ctr"
                      orientation="right"
                      domain={[0, "auto"]}
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fill: "rgba(245,230,168,0.88)", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                      label={{
                        value: "CTR %",
                        angle: 90,
                        position: "insideRight",
                        fill: "rgba(232,197,71,0.85)",
                        fontSize: 10,
                      }}
                    />
                    <Tooltip
                      formatter={(value, key) =>
                        key === "gastoMil"
                          ? [brlFmt(Number(value) * 1000), "Gasto total"]
                          : [`${Number(value).toFixed(2)}%`, "CTR médio"]
                      }
                      labelFormatter={(l) => l}
                      contentStyle={{
                        background: "rgba(10,10,13,0.96)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar
                      yAxisId="rs"
                      dataKey="gastoMil"
                      name="Gasto (mil R$)"
                      fill={`url(#${barGastoGradId})`}
                      stroke="#c9a227"
                      strokeWidth={1}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="ctr"
                      dataKey="ctr"
                      name="CTR %"
                      fill={`url(#${barCtrGradId})`}
                      stroke="#f5e6a8"
                      strokeOpacity={0.65}
                      strokeWidth={1}
                      radius={[4, 4, 0, 0]}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {extraCharts.ctrTimeline && (
            <section className={styles.chartCard} aria-labelledby="chart-ctr-time-title">
              <div className={styles.chartHead}>
                <div>
                  <h2 id="chart-ctr-time-title" className={styles.chartTitle}>
                    CTR médio ao longo do tempo
                  </h2>
                  <p className={styles.chartHint}>Um traço por campanha (%). Útil para cruzar com mudanças de criativo.</p>
                </div>
              </div>
              <div className={`${styles.chartBody} ${styles.chartBodyMed}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeline} margin={{ top: 8, right: 10, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 10" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="dayShort" tick={{ fill: "#71717a", fontSize: 10 }} interval={xInterval} />
                    <YAxis domain={[0, "auto"]} tickFormatter={(v) => `${v}%`} width={42} />
                    <Tooltip
                      formatter={(value) => [`${Number(value).toFixed(2)}%`, "CTR"]}
                      contentStyle={{
                        background: "rgba(10,10,13,0.96)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10,
                      }}
                    />
                    {campaignIds.map((cid) => (
                      <Line
                        key={`ctr-${cid}`}
                        type="monotone"
                        dataKey={`ctr_${cid}`}
                        name={shortCampaign(cid)}
                        stroke={CAMPAIGN_COLOR[cid]}
                        strokeWidth={1.8}
                        dot={false}
                      />
                    ))}
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          <div className={styles.chartRow}>
            <section className={styles.chartCard} aria-labelledby="chart-scatter-title">
              <div className={styles.chartHead}>
                <div>
                  <h2 id="chart-scatter-title" className={styles.chartTitle}>
                    Inteligência × performance (por campanha)
                  </h2>
                  <p className={styles.chartHint}>Cor = campanha · nota gancho (IA) no X · ROAS no Y.</p>
                </div>
              </div>
              <div className={styles.chartBody}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 8, right: 12, left: 4, bottom: 16 }}>
                    <CartesianGrid strokeDasharray="3 10" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" dataKey="gancho" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false}
                      label={{ value: "Nota do gancho (IA)", position: "bottom", offset: 2, fill: "rgba(161,161,170,0.75)", fontSize: 10 }} />
                    <YAxis type="number" dataKey="roas" domain={[0, "auto"]} tick={{ fill: "#71717a", fontSize: 10 }} width={38}
                      label={{ value: "ROAS", angle: -90, position: "insideLeft", fill: "rgba(161,161,170,0.75)", fontSize: 10 }} />
                    <Tooltip content={<TooltipScatter styles={styles} />} cursor={{ strokeDasharray: "3 3" }} />
                    {campaignIds.map((cid) => (
                      <Scatter
                        key={cid}
                        name={campaignLabel(cid)}
                        data={scatterByCamp[cid] ?? []}
                        fill={CAMPAIGN_COLOR[cid]}
                        fillOpacity={0.82}
                      />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className={styles.legendHint}>
                {campaignIds.map((cid) => (
                  <span key={`leg-${cid}`}>
                    <span className={styles.legendDot} style={{ background: CAMPAIGN_COLOR[cid] }} />
                    {shortCampaign(cid)}
                  </span>
                ))}
              </div>
            </section>

            <section className={styles.chartCard} aria-labelledby="chart-radar-title">
              <div className={styles.chartHead}>
                <div>
                  <h2 id="chart-radar-title" className={styles.chartTitle}>Qualidade média (IA)</h2>
                  <p className={styles.chartHint}>Média das campanhas selecionadas (0–10): gancho, CTA e prova social.</p>
                </div>
              </div>
              <div className={styles.chartBody}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="52%" outerRadius="72%" data={radarAvg}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="dim" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                    <PolarRadiusAxis angle={45} domain={[0, 10]} tickCount={5} tick={{ fill: "rgba(113,113,122,0.85)", fontSize: 9 }} stroke="rgba(255,255,255,0.06)" />
                    <Radar name="Média" dataKey="valor" stroke="#e8c547" strokeWidth={1.8} fill="rgba(212,175,55,0.22)" fillOpacity={0.85}
                      dot={{ r: 3, fill: "#f5e6a8", strokeWidth: 0 }} />
                    <Tooltip content={<TooltipRadar styles={styles} />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          {campaignIds.length > 0 && (
            <section className={styles.chartCard} aria-labelledby="chart-video-retention-title">
              <div className={styles.chartHead}>
                <div>
                  <h2 id="chart-video-retention-title" className={styles.chartTitle}>
                    Análise de vídeo · retenção de audiência
                  </h2>
                  <p className={styles.chartHint}>
                    Uma prévia com play e uma curva de retenção <strong>por cada campanha</strong> selecionada nos
                    filtros (demo até ligar vídeo/thumbnail e métricas de retenção da API).
                  </p>
                </div>
              </div>

              <div className={styles.videoCampaignsList}>
                {videoInsightsPerCampaign.map(({ id: campId, insight }) => {
                  const videoRetGradId = `${gid}-videoRet-${campId}`;
                  const campAccent = CAMPAIGN_COLOR[campId] ?? "#e8c547";
                  return (
                    <div key={campId} className={styles.videoCampaignBlock}>
                      <h3 className={styles.videoCampaignHeading} style={{ borderLeftColor: campAccent }}>
                        {campaignLabel(campId)}
                      </h3>

                      <div className={styles.videoStack}>
                        <div className={styles.videoHero}>
                          <div className={styles.videoStage}>
                            <div className={styles.videoStageInner} aria-hidden />
                            <div className={styles.videoPlayOverlay}>
                              <button
                                type="button"
                                className={styles.videoPlayBtn}
                                title={`Demonstração · ${campaignLabel(campId)} — conectar player quando a API devolver mídia`}
                                aria-label={`Reproduzir vídeo de ${campaignLabel(campId)} — demonstração (sem arquivo ligado)`}
                                onClick={() => {
                                  /* reservado: vídeo específico desta campanha */
                                }}
                              >
                                <svg width={28} height={28} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                  <path d="M8 5v14l11-7L8 5z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <p className={styles.videoHeroCaption}>Criativo desta campanha · thumbnail ou stream via API</p>
                        </div>

                        <div className={`${styles.videoMetrics} ${styles.videoMetricsCenter}`}>
                          <span className={styles.videoBadge}>Retenção média · {insight.retMedia}%</span>
                          <span className={styles.videoBadge}>
                            Maior retenção (após início) · ~{insight.picoPct}% do tempo
                          </span>
                          <span className={styles.videoBadgeNeutral}>
                            Queda mais forte · ~{insight.maiorQuedaAproxPct}% (−{insight.quedaPct} pp)
                          </span>
                        </div>

                        <div className={`${styles.chartBody} ${styles.videoRetentionChart}`}>
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={insight.serie} margin={{ top: 10, right: 8, left: 0, bottom: 4 }}>
                              <defs>
                                <linearGradient id={videoRetGradId} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#e8c547" stopOpacity={0.42} />
                                  <stop offset="55%" stopColor="#b8942a" stopOpacity={0.14} />
                                  <stop offset="100%" stopColor="#5c4510" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 10" stroke="rgba(255,255,255,0.05)" vertical={false} />
                              <XAxis
                                dataKey="t"
                                tick={{ fill: "#71717a", fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                                interval={2}
                                label={{
                                  value: "Progresso do vídeo",
                                  position: "bottom",
                                  fill: "rgba(161,161,170,0.75)",
                                  fontSize: 10,
                                  offset: 0,
                                }}
                              />
                              <YAxis
                                domain={[0, 100]}
                                tickFormatter={(v) => `${v}%`}
                                tick={{ fill: "rgba(232,197,71,0.82)", fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                                width={40}
                                label={{
                                  value: "Audiência",
                                  angle: -90,
                                  position: "insideLeft",
                                  fill: "rgba(232,197,71,0.75)",
                                  fontSize: 10,
                                }}
                              />
                              <Tooltip
                                formatter={(v) => [`${Number(v).toFixed(1)}%`, "Retenção"]}
                                labelFormatter={(l) => `Marca ${l}`}
                                contentStyle={{
                                  background: "rgba(10,10,13,0.96)",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  borderRadius: 10,
                                  fontSize: 12,
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="retencao"
                                name="Retenção"
                                stroke="#f0d875"
                                strokeWidth={2.2}
                                fill={`url(#${videoRetGradId})`}
                              />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <details className={styles.videoDetails}>
                <summary>Por que a curva ainda é “demo”? (API Meta / Hooko)</summary>
                <div className={styles.videoDetailsBody}>
                  <p className={styles.videoNote}>
                    <strong>Hoje já temos:</strong> análise assíncrona de vídeo ({`POST /api/media/:mediaId/analyze`}),
                    transcrição + notas da IA em <code>creative_analyses</code> e KPIs agregados.
                  </p>
                  <p className={styles.videoNote}>
                    <strong>Retenção por % no tempo</strong> costuma vir de insights de vídeo no Meta ou do player —
                    quando o backend devolver série por criativo/campanha, cada player acima e cada gráfico recebe o seu
                    par de dados (<code>&lt;video src=…/&gt;</code> / thumbnail + série de audiência).
                  </p>
                </div>
              </details>

              <div className={styles.legendHint}>
                {videoInsightsPerCampaign.map(({ id: campId, insight }) => (
                  <span key={`video-leg-${campId}`}>
                    <span
                      className={styles.legendDot}
                      style={{ background: CAMPAIGN_COLOR[campId] ?? "#e8c547" }}
                    />
                    <span>{shortCampaign(campId)}</span>
                    <span style={{ color: "rgba(161,161,170,0.85)", marginLeft: "0.25rem" }}>
                      ({insight.estado})
                    </span>
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
