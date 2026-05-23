"use client";

import { useEffect, useMemo, useState } from "react";
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

function GatewayLockedBlock() {
  return (
    <>
      <p className={dash.gatewayIntro}>
        Blocos abaixo dependem de integrações ainda não activas (Vturb / Utmify).
      </p>

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

      <div className={dash.row3}>
        <FutureFeatureLock {...GATEWAY_LOCK}>
          <SalesByProductList items={[]} />
        </FutureFeatureLock>
        <FutureFeatureLock {...GATEWAY_LOCK}>
          <ApprovalRateChart rates={[]} />
        </FutureFeatureLock>
      </div>
    </>
  );
}

export default function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [sales, setSales] = useState(null);
  const [dateFilter, setDateFilter] = useState("month");

  useEffect(() => {
    async function loadRealData() {
      setLoading(true);
      try {
        const orgId = getStoredOrganizationId();
        if (!orgId) return;

        const periodParam = encodeURIComponent(dateFilter);
        const [overviewRes, salesRes] = await Promise.all([
          apiFetch(`/api/dashboard/overview?organizationId=${orgId}&period=${periodParam}`).catch(() => null),
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
  }, [dateFilter]);

  const totalSpend = Number(overview?.totalSpend || 0);
  const totalRevenue = Number(sales?.totalRevenue || 0);
  const metaPurchaseRevenue = Number(overview?.delivery?.purchaseRevenue || 0);
  const metaRoas =
    overview?.delivery?.roas ??
    overview?.globalRoasWeighted ??
    (totalSpend > 0 ? metaPurchaseRevenue / totalSpend : null);

  const secondaryMetrics = useMemo(
    () => ({
      ...(sales?.secondaryMetrics || {}),
      creativeAnalyses: overview?.creativeAnalysesCount ?? sales?.secondaryMetrics?.creativeAnalyses ?? 0,
    }),
    [sales, overview],
  );

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
          <p className={styles.sub}>Meta Ads + PagTrust</p>
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
            Meta Ads + PagTrust
            {overview?.dateRange ? ` · Período: ${overview.dateRange.since} → ${overview.dateRange.until}` : ""}
          </p>
        </div>
        <div className={styles.filters}>
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
        <DashboardSection title="Resumo">
          <SummaryKpiCards
            revenue={totalRevenue}
            spend={totalSpend}
            roi={totalSpend > 0 ? totalRevenue / totalSpend : 0}
            profit={totalRevenue - totalSpend}
            metaRoas={metaRoas != null ? Number(metaRoas) : null}
          />

          <PagTrustRevenueChart
            data={sales?.revenueByDay}
            dateRange={sales?.dateRange || overview?.dateRange}
          />

          <div className={dash.row2}>
            <MetaDailySpendChart data={overview?.dailyMeta} />
            <MetaCumulativeRevenueSpendChart data={overview?.dailyMeta} />
          </div>

          <MetaSecondaryMetrics overview={overview} />
        </DashboardSection>

        <DashboardSection title="Lucro e faturamento">
          <ProfitByHourChart data={sales?.profitByHour?.length ? sales.profitByHour : metaProfitByHour} variant={sales?.profitByHour?.length ? "pagtrust" : "meta"} />
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

        <DashboardSection title="Horários & tráfego">
          <SalesBySourceList
            pagtrustItems={sales?.salesBySource}
            metaItems={overview?.metaTrafficSources}
          />
          <SalesByHourChart
            data={sales?.revenueByHour?.length ? sales.revenueByHour : metaHourly}
            variant={sales?.revenueByHour?.length ? "pagtrust" : "meta"}
          />
          <div className={dash.row2}>
            <SalesByDayOfWeekChart
              data={sales?.salesByDayOfWeek?.length ? sales.salesByDayOfWeek : metaDayOfWeek}
              variant={sales?.salesByDayOfWeek?.length ? "pagtrust" : "meta"}
            />
            <MetaDailySpendChart data={overview?.dailyMeta} />
          </div>
        </DashboardSection>

        <DashboardSection title="Marketing API Meta (completo)">
          <MetaExtendedSection metaExtended={overview?.metaExtended} />
        </DashboardSection>

        <DashboardSection title="Integrações em breve">
          <GatewayLockedBlock />
        </DashboardSection>
      </div>
    </div>
  );
}
