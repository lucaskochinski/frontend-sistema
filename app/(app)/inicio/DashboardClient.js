"use client";

import { useEffect, useState } from "react";
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
  FutureFeatureLock,
} from "@/components/Dashboard";

const GATEWAY_LOCK = { label: "PagTrust / Vturb / Utmify", message: "Integração em breve" };

function GatewayLockedBlock({ overview }) {
  return (
    <>
      <p className={dash.gatewayIntro}>
        A Meta não substitui estes gráficos: não informa Pix/cartão/boleto, aprovação de pagamento,
        reembolsos nem faturamento líquido real do checkout — só receita <em>atribuída</em> via pixel
        (já nos blocos Meta acima).
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
        <ProfitByHourChart data={[]} />
      </FutureFeatureLock>

      <div className={dash.row3}>
        <FutureFeatureLock {...GATEWAY_LOCK}>
          <SalesByProductList items={[]} />
        </FutureFeatureLock>
        <FutureFeatureLock {...GATEWAY_LOCK}>
          <SalesBySourceList metaItems={[]} />
        </FutureFeatureLock>
        <FutureFeatureLock {...GATEWAY_LOCK}>
          <ApprovalRateChart rates={[]} />
        </FutureFeatureLock>
      </div>

      <FutureFeatureLock {...GATEWAY_LOCK}>
        <SalesByHourChart data={[]} />
      </FutureFeatureLock>

      <FutureFeatureLock {...GATEWAY_LOCK}>
        <SalesByDayOfWeekChart data={[]} />
      </FutureFeatureLock>
    </>
  );
}

export default function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [dateFilter, setDateFilter] = useState("month");

  useEffect(() => {
    async function loadRealData() {
      setLoading(true);
      try {
        const orgId = getStoredOrganizationId();
        if (!orgId) return;

        const periodParam = encodeURIComponent(dateFilter);
        const overviewRes = await apiFetch(
          `/api/dashboard/overview?organizationId=${orgId}&period=${periodParam}`,
        ).catch(() => null);

        setOverview(overviewRes);
      } catch (err) {
        console.error("Erro ao puxar dados do Dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRealData();
  }, [dateFilter]);

  const totalSpend = Number(overview?.totalSpend || 0);
  const metaPurchaseRevenue = Number(overview?.delivery?.purchaseRevenue || 0);
  const metaRoas =
    overview?.delivery?.roas ??
    overview?.globalRoasWeighted ??
    (totalSpend > 0 ? metaPurchaseRevenue / totalSpend : null);

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
            Meta Marketing API — métricas activas primeiro; gateway (PagTrust / Vturb / Utmify) no final.
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
        {/* ——— META (disponível) ——— */}
        <DashboardSection title="Resumo Meta">
          <SummaryKpiCards
            spend={totalSpend}
            metaPurchaseRevenue={metaPurchaseRevenue}
            metaRoas={metaRoas != null ? Number(metaRoas) : null}
          />
        </DashboardSection>

        <DashboardSection title="Funil & conversão Meta">
          <MetaConversionFunnel funnel={overview?.conversionFunnel || overview?.funnel} />
        </DashboardSection>

        <DashboardSection title="Performance dos criativos">
          <MetaRankingsGrid items={overview?.rankingItems} />
          <MetaMetricsSection overview={overview} />
        </DashboardSection>

        <DashboardSection title="Gasto & tráfego Meta">
          <MetaDailySpendChart data={overview?.dailyMeta} />
          <SalesBySourceList metaItems={overview?.metaTrafficSources} />
        </DashboardSection>

        <DashboardSection title="Marketing API Meta (completo)">
          <MetaExtendedSection metaExtended={overview?.metaExtended} />
        </DashboardSection>

        {/* ——— GATEWAY (bloqueado — Meta não cobre) ——— */}
        <DashboardSection title="Gateway PagTrust / Vturb / Utmify">
          <GatewayLockedBlock overview={overview} />
        </DashboardSection>
      </div>
    </div>
  );
}
