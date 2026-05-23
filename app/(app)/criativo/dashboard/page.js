"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch, getStoredOrganizationId } from "@/lib/hooko-session";
import NotImplementedModal from "@/components/NotImplementedModal/NotImplementedModal";
import {
  DashboardSection,
  MetaRankingsGrid,
  MetaMetricsSection,
  MetaDailySpendChart,
  MetaConversionFunnel,
} from "@/components/Dashboard";
import dash from "@/components/Dashboard/dashboard.module.css";
import styles from "./page.module.css";

export default function CriativosDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [insights, setInsights] = useState([]);
  const [vturbModalOpen, setVturbModalOpen] = useState(false);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const orgId = getStoredOrganizationId();
        if (!orgId) return;

        const periodParam = encodeURIComponent(period);
        const [overviewRes, insightsRes] = await Promise.all([
          apiFetch(`/api/dashboard/overview?organizationId=${orgId}&period=${periodParam}`).catch(() => null),
          apiFetch(`/api/dashboard/insights?organizationId=${orgId}&sort=roas&limit=50`).catch(() => null),
        ]);

        setOverview(overviewRes);
        setInsights(Array.isArray(insightsRes?.items) ? insightsRes.items : []);
      } catch (err) {
        console.error("Erro ao carregar dashboard de criativos:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [period]);

  const aiSummary = useMemo(() => {
    const active = insights.filter((i) => Number(i?.rollup?.spend || 0) > 0);
    const topRoas = [...active].sort((a, b) => Number(b?.rollup?.roas || 0) - Number(a?.rollup?.roas || 0))[0];
    const lowCtr = [...active].sort((a, b) => Number(a?.rollup?.ctr || 0) - Number(b?.rollup?.ctr || 0))[0];

    return {
      activeCount: active.length,
      totalCount: insights.length,
      topRoas,
      lowCtr,
    };
  }, [insights]);

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>A carregar dashboard de criativos…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Criativos</p>
          <h1 className={styles.title}>Dashboard de performance</h1>
          <p className={styles.sub}>
            Rankings, funil e resumo IA dos criativos importados da Meta Ads.
          </p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.platformToggle} role="group" aria-label="Fonte de dados">
            <button type="button" className={`${styles.platformBtn} ${styles.platformBtnActive}`}>
              Meta Ads
            </button>
            <button
              type="button"
              className={styles.platformBtn}
              onClick={() => setVturbModalOpen(true)}
            >
              VTurb
            </button>
          </div>
          <select className={styles.select} value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="today">Hoje</option>
            <option value="week">7 dias</option>
            <option value="month">30 dias</option>
          </select>
          <Link href="/criativo/biblioteca" className={styles.linkBtn}>
            Ver biblioteca
          </Link>
        </div>
      </header>

      <section className={styles.aiPanel} aria-labelledby="ai-summary-h">
        <h2 id="ai-summary-h" className={styles.aiTitle}>
          Resumo IA
        </h2>
        <div className={styles.aiGrid}>
          <div className={styles.aiCard}>
            <span className={styles.aiLabel}>Criativos ativos</span>
            <strong className={styles.aiValue}>
              {aiSummary.activeCount}/{aiSummary.totalCount}
            </strong>
            <p className={styles.aiHint}>Com gasto no período selecionado</p>
          </div>
          <div className={styles.aiCard}>
            <span className={styles.aiLabel}>Melhor ROAS</span>
            <strong className={styles.aiValue}>
              {aiSummary.topRoas ? Number(aiSummary.topRoas.rollup?.roas || 0).toFixed(2) : "—"}
            </strong>
            {aiSummary.topRoas ? (
              <Link href={`/criativo/${aiSummary.topRoas.adId}`} className={styles.aiLink}>
                {aiSummary.topRoas.adName}
              </Link>
            ) : (
              <p className={styles.aiHint}>Importe criativos na biblioteca</p>
            )}
          </div>
          <div className={styles.aiCard}>
            <span className={styles.aiLabel}>Atenção (CTR baixo)</span>
            <strong className={styles.aiValue}>
              {aiSummary.lowCtr ? `${Number(aiSummary.lowCtr.rollup?.ctr || 0).toFixed(2)}%` : "—"}
            </strong>
            {aiSummary.lowCtr ? (
              <Link href={`/criativo/${aiSummary.lowCtr.adId}`} className={styles.aiLink}>
                {aiSummary.lowCtr.adName}
              </Link>
            ) : (
              <p className={styles.aiHint}>Sem dados suficientes</p>
            )}
          </div>
        </div>
      </section>

      <div className={dash.dashboardGrid}>
        <DashboardSection title="Rankings por criativo">
          <MetaRankingsGrid items={overview?.rankingItems} />
        </DashboardSection>

        <DashboardSection title="Funil de conversão">
          <MetaConversionFunnel funnel={overview?.conversionFunnel || overview?.funnel} />
        </DashboardSection>

        <DashboardSection title="Gasto diário Meta">
          <MetaDailySpendChart data={overview?.dailyMeta} />
          <MetaMetricsSection overview={overview} />
        </DashboardSection>
      </div>

      <NotImplementedModal
        open={vturbModalOpen}
        featureKey="vturb"
        onClose={() => setVturbModalOpen(false)}
      />
    </div>
  );
}
