"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, getStoredOrganizationId } from "@/lib/hooko-session";
import styles from "./page.module.css";
import dash from "@/components/Dashboard/dashboard.module.css";
import {
  DashboardSection,
  SummaryKpiCards,
  PagTrustRevenueChart,
  SecondaryMetricsGrid,
  SalesByPaymentDonut,
  ProfitByHourChart,
  CumulativeRevenueSpendChart,
  SalesByProductList,
  SalesBySourceList,
  ApprovalRateChart,
  SalesByHourChart,
  SalesByDayOfWeekChart,
  MetaConversionFunnel,
  MetaDailySpendChart,
  MetaMetricsSection,
  MetaRankingsGrid,
  MetaExtendedSection,
  MetaSecondaryMetrics,
  MetaCumulativeRevenueSpendChart,
  FutureFeatureLock,
} from "@/components/Dashboard";

const GATEWAY_LOCK = { label: "PagTrust / Vturb / Utmify", message: "Integração em breve" };

const DAY_LABELS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function buildMetaHourlyChart(metaExtended) {
  return (metaExtended?.hourlySpend || []).map((row) => ({
    hora: row.hora,
    valor: Number(row.spend || 0),
  }));
}

function buildMetaDayOfWeekChart(dailyMeta) {
  const totals = Array.from({ length: 7 }, () => 0);
  for (const row of dailyMeta || []) {
    if (!row.date) continue;
    const dow = new Date(`${row.date}T12:00:00Z`).getUTCDay();
    totals[dow] += Number(row.spend || 0);
  }
  return DAY_LABELS_PT.map((label, i) => ({
    label,
    count: Math.round(totals[i] * 100) / 100,
  }));
}

function buildMetaProfitByHour(metaExtended, purchaseRevenue) {
  const hourly = metaExtended?.hourlySpend || [];
  const totalSpend = hourly.reduce((sum, row) => sum + Number(row.spend || 0), 0);
  const revenue = Number(purchaseRevenue || 0);

  return hourly.map((row) => {
    const spend = Number(row.spend || 0);
    const revenueShare = totalSpend > 0 ? (spend / totalSpend) * revenue : 0;
    return {
      hora: row.hora,
      receita: Math.round(revenueShare * 100) / 100,
      lucro: Math.round((revenueShare - spend) * 100) / 100,
    };
  });
}

function GatewayLockedBlock({ overview }) {
  return (
    <>
      <p className={dash.gatewayIntro}>
        Estes blocos dependem de webhook PagTrust / Vturb / Utmify. A Meta cobre gasto, conversões e breakdowns — já visíveis acima.
      </p>

      <FutureFeatureLock {...GATEWAY_LOCK}>
        <PagTrustRevenueChart data={[]} dateRange={overview?.dateRange} />
      </FutureFeatureLock>

      <div className={dash.row2}>
        <FutureFeatureLock {...GATEWAY_LOCK}>
          <SalesByPaymentDonut data={[]} totalSales={0} />
        </FutureFeatureLock>
        <FutureFeatureLock {...GATEWAY_LOCK}>
          <CumulativeRevenueSpendChart data={[]} />
        </FutureFeatureLock>
      </div>

      <FutureFeatureLock {...GATEWAY_LOCK}>
        <SecondaryMetricsGrid metrics={{}} />
      </FutureFeatureLock>

      <FutureFeatureLock {...GATEWAY_LOCK}>
        <ProfitByHourChart data={[]} variant="pagtrust" />
      </FutureFeatureLock>

      <div className={dash.row3}>
        <FutureFeatureLock {...GATEWAY_LOCK}>
          <SalesByProductList items={[]} />
        </FutureFeatureLock>
        <FutureFeatureLock {...GATEWAY_LOCK}>
          <ApprovalRateChart rates={[]} />
        </FutureFeatureLock>
      </div>

      <FutureFeatureLock {...GATEWAY_LOCK}>
        <SalesByHourChart data={[]} variant="pagtrust" />
      </FutureFeatureLock>

      <FutureFeatureLock {...GATEWAY_LOCK}>
        <SalesByDayOfWeekChart data={[]} variant="pagtrust" />
      </FutureFeatureLock>
    </>
  );
}

function AdMultiSelect({ ads, selectedIds, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const summary = useMemo(() => {
    if (!ads.length) return "Nenhum anúncio importado";
    if (!selectedIds.length) return "Todos os anúncios";
    if (selectedIds.length === 1) {
      const ad = ads.find((item) => item.adId === selectedIds[0]);
      return ad?.adName || "1 anúncio";
    }
    return `${selectedIds.length} anúncios selecionados`;
  }, [ads, selectedIds]);

  function toggleAd(adId) {
    if (selectedIds.includes(adId)) {
      onChange(selectedIds.filter((id) => id !== adId));
      return;
    }
    onChange([...selectedIds, adId]);
  }

  return (
    <div className={styles.dropWrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.dropTrigger}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={!ads.length}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={styles.dropSummary}>{summary}</span>
      </button>

      {open && ads.length ? (
        <div className={styles.dropPanel} role="listbox" aria-multiselectable="true">
          <div className={styles.checkboxGrid}>
            {ads.map((ad) => (
              <label key={ad.adId} className={styles.chkLabel}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(ad.adId)}
                  onChange={() => toggleAd(ad.adId)}
                />
                <span>{ad.adName || `Anúncio ${ad.adId.slice(0, 8)}`}</span>
              </label>
            ))}
          </div>
          <div className={styles.dropPanelFooter}>
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => {
                onChange([]);
                setOpen(false);
              }}
            >
              Todos
            </button>
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => {
                onChange(ads.map((ad) => ad.adId));
              }}
            >
              Seleccionar todos
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [sales, setSales] = useState(null);
  const [ads, setAds] = useState([]);
  const [selectedAdIds, setSelectedAdIds] = useState([]);
  const [dateFilter, setDateFilter] = useState("month");

  useEffect(() => {
    async function loadAds() {
      try {
        const orgId = getStoredOrganizationId();
        if (!orgId) return;

        const res = await apiFetch(
          `/api/dashboard/insights?organizationId=${orgId}&limit=200&sort=roas`,
        ).catch(() => null);

        setAds(res?.items || []);
      } catch (err) {
        console.error("Erro ao carregar anúncios:", err);
      }
    }

    loadAds();
  }, []);

  useEffect(() => {
    async function loadRealData() {
      setLoading(true);
      try {
        const orgId = getStoredOrganizationId();
        if (!orgId) return;

        const periodParam = encodeURIComponent(dateFilter);
        const adIdsParam =
          selectedAdIds.length > 0
            ? `&adIds=${encodeURIComponent(selectedAdIds.join(","))}`
            : "";

        const [overviewRes, salesRes] = await Promise.all([
          apiFetch(
            `/api/dashboard/overview?organizationId=${orgId}&period=${periodParam}${adIdsParam}`,
          ).catch(() => null),
          apiFetch(`/api/dashboard/external-sales/pagtrust?organizationId=${orgId}&period=${periodParam}`).catch(
            () => null,
          ),
        ]);

        setOverview(overviewRes);
        setSales(salesRes);
      } catch (err) {
        console.error("Erro ao puxar dados do Dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRealData();
  }, [dateFilter, selectedAdIds]);

  const totalSpend = Number(overview?.totalSpend || 0);
  const metaPurchaseRevenue = Number(overview?.delivery?.purchaseRevenue || 0);
  const metaRoas =
    overview?.delivery?.roas ??
    overview?.globalRoasWeighted ??
    (totalSpend > 0 ? metaPurchaseRevenue / totalSpend : null);

  const metaHourly = useMemo(() => buildMetaHourlyChart(overview?.metaExtended), [overview]);
  const metaDayOfWeek = useMemo(() => buildMetaDayOfWeekChart(overview?.dailyMeta), [overview]);
  const metaProfitByHour = useMemo(
    () => buildMetaProfitByHour(overview?.metaExtended, metaPurchaseRevenue),
    [overview, metaPurchaseRevenue],
  );

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <h2 className={styles.title}>Carregando dashboard…</h2>
          <p className={styles.sub}>Meta Ads</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.headerRow}>
        <div className={styles.heading}>
          <p className={styles.kicker}>Principal</p>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.sub}>
            Meta Ads — gráficos activos; gateway bloqueado no final.
            {overview?.dateRange ? ` Período: ${overview.dateRange.since} → ${overview.dateRange.until}.` : ""}
            {selectedAdIds.length
              ? ` Filtrando ${selectedAdIds.length} anúncio${selectedAdIds.length > 1 ? "s" : ""}.`
              : ""}
          </p>
        </div>
        <div className={styles.filtersBlock}>
          <label className={`${styles.field} ${styles.campaignField}`}>
            <span className={styles.fieldLabel}>Anúncios</span>
            <AdMultiSelect ads={ads} selectedIds={selectedAdIds} onChange={setSelectedAdIds} />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Período</span>
            <select
              className={styles.select}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="today">Hoje</option>
              <option value="week">Últimos 7 dias</option>
              <option value="month">Últimos 30 dias</option>
            </select>
          </label>
        </div>
      </header>

      <div className={dash.dashboardGrid}>
        <DashboardSection title="Resumo Meta">
          <SummaryKpiCards
            spend={totalSpend}
            metaPurchaseRevenue={metaPurchaseRevenue}
            metaRoas={metaRoas != null ? Number(metaRoas) : null}
          />
          <div className={dash.row2}>
            <MetaDailySpendChart data={overview?.dailyMeta} />
            <MetaCumulativeRevenueSpendChart data={overview?.dailyMeta} />
          </div>
          <MetaSecondaryMetrics overview={overview} />
        </DashboardSection>

        <DashboardSection title="Lucro Meta por horário">
          <ProfitByHourChart data={metaProfitByHour} variant="meta" />
        </DashboardSection>

        <DashboardSection title="Funil de conversão">
          <MetaConversionFunnel
            funnel={overview?.conversionFunnel || overview?.funnel}
            salesInitiated={sales?.totalSales}
            salesApproved={sales?.approvedSales}
          />
        </DashboardSection>

        <DashboardSection title="Performance dos criativos">
          <MetaRankingsGrid items={overview?.rankingItems} />
          <MetaMetricsSection overview={overview} />
        </DashboardSection>

        <DashboardSection title="Horários & tráfego Meta">
          <SalesBySourceList metaItems={overview?.metaTrafficSources} />
          <SalesByHourChart data={metaHourly} variant="meta" />
          <SalesByDayOfWeekChart data={metaDayOfWeek} variant="meta" />
        </DashboardSection>

        <DashboardSection title="Marketing API Meta (completo)">
          <MetaExtendedSection metaExtended={overview?.metaExtended} />
        </DashboardSection>

        <DashboardSection title="Gateway PagTrust / Vturb / Utmify">
          <GatewayLockedBlock overview={overview} />
        </DashboardSection>
      </div>
    </div>
  );
}
