"use client";

import { useEffect, useState, useMemo } from "react";
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
} from "@/components/Dashboard";

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
  const profit = totalRevenue - totalSpend;
  const roi = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : "0.00";
  const metaRoas = overview?.globalRoasWeighted ? Number(overview.globalRoasWeighted).toFixed(2) : null;

  const secondaryMetrics = useMemo(
    () => ({
      ...(sales?.secondaryMetrics || {}),
      creativeAnalyses: overview?.creativeAnalysesCount ?? sales?.secondaryMetrics?.creativeAnalyses ?? 0,
    }),
    [sales, overview],
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
            Todos os blocos abaixo já estão na home — Meta Ads + PagTrust.
            {overview?.dateRange ? ` Período: ${overview.dateRange.since} → ${overview.dateRange.until}.` : ""}
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
            roi={roi}
            profit={profit}
            metaRoas={metaRoas}
          />

          <PagTrustRevenueChart data={sales?.revenueByDay} dateRange={sales?.dateRange || overview?.dateRange} />

          <div className={dash.row2}>
            <SalesByPaymentDonut data={sales?.salesByPaymentMethod} totalSales={sales?.totalSales} />
            <CumulativeRevenueSpendChart data={sales?.cumulativeHourly} />
          </div>
          <SecondaryMetricsGrid metrics={secondaryMetrics} />
        </DashboardSection>

        <DashboardSection title="Lucro e faturamento">
          <ProfitByHourChart data={sales?.profitByHour} />
        </DashboardSection>

        <DashboardSection title="Vendas e aprovação">
          <div className={dash.row3}>
            <SalesByProductList items={sales?.salesByProduct} />
            <SalesBySourceList
              pagtrustItems={sales?.salesBySource}
              metaItems={overview?.metaTrafficSources}
            />
            <ApprovalRateChart rates={sales?.approvalRates} />
          </div>
          <SalesByHourChart data={sales?.revenueByHour} />
          <div className={dash.row2}>
            <SalesByDayOfWeekChart data={sales?.salesByDayOfWeek} />
            <MetaDailySpendChart data={overview?.dailyMeta} />
          </div>
        </DashboardSection>

        <DashboardSection title="Funil Meta Ads">
          <MetaConversionFunnel
            funnel={overview?.conversionFunnel || overview?.funnel}
            salesInitiated={sales?.totalSales}
            salesApproved={sales?.approvedSales}
          />
        </DashboardSection>

        <DashboardSection title="Performance Meta">
          <MetaMetricsSection overview={overview} />
        </DashboardSection>
      </div>
    </div>
  );
}
