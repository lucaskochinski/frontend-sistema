"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch, getApiBase, getStoredOrganizationId } from "@/lib/hooko-session";
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
  const [vturbSales, setVturbSales] = useState(null);
  const [platform, setPlatform] = useState("meta");
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const orgId = getStoredOrganizationId();
        if (!orgId) return;

        const periodParam = encodeURIComponent(period);
        const [overviewRes, insightsRes, vturbRes] = await Promise.all([
          apiFetch(`/api/dashboard/overview?organizationId=${orgId}&period=${periodParam}`).catch(() => null),
          apiFetch(`/api/dashboard/insights?organizationId=${orgId}&sort=roas&limit=50`).catch(() => null),
          apiFetch(`/api/dashboard/external-sales/vturb?organizationId=${orgId}&period=${periodParam}`).catch(() => null),
        ]);

        setOverview(overviewRes);
        setInsights(Array.isArray(insightsRes?.items) ? insightsRes.items : []);
        setVturbSales(vturbRes);
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
    const withVturb = insights.filter((i) => i.vturbVideoId || i.vturb_video_id).length;

    return {
      activeCount: active.length,
      totalCount: insights.length,
      topRoas,
      lowCtr,
      withVturb,
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
            Rankings, funil e resumo IA dos criativos importados. Alterne entre Meta Ads e VTurb.
          </p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.platformToggle} role="group" aria-label="Fonte de dados">
            <button
              type="button"
              className={`${styles.platformBtn} ${platform === "meta" ? styles.platformBtnActive : ""}`}
              onClick={() => setPlatform("meta")}
            >
              Meta Ads
            </button>
            <button
              type="button"
              className={`${styles.platformBtn} ${platform === "vturb" ? styles.platformBtnActive : ""}`}
              onClick={() => setPlatform("vturb")}
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
          <div className={styles.aiCard}>
            <span className={styles.aiLabel}>VTurb ligados</span>
            <strong className={styles.aiValue}>{aiSummary.withVturb}</strong>
            <p className={styles.aiHint}>
              Webhook: {getApiBase()}/api/webhooks/vturb
            </p>
          </div>
        </div>
      </section>

      {platform === "meta" ? (
        <div className={dash.dashboardGrid}>
          <DashboardSection title="Rankings por criativo">
            <MetaRankingsGrid items={overview?.rankingItems} />
          </DashboardSection>

          <DashboardSection title="Funil de conversão">
            <MetaConversionFunnel
              funnel={overview?.conversionFunnel || overview?.funnel}
              salesInitiated={vturbSales?.totalSales}
              salesApproved={vturbSales?.approvedSales}
            />
          </DashboardSection>

          <DashboardSection title="Gasto diário Meta">
            <MetaDailySpendChart data={overview?.dailyMeta} />
            <MetaMetricsSection overview={overview} />
          </DashboardSection>
        </div>
      ) : (
        <div className={dash.dashboardGrid}>
          <DashboardSection title="VTurb — vendas via webhook">
            <div className={styles.vturbStats}>
              <div className={styles.vturbStat}>
                <span>Receita</span>
                <strong>R$ {Number(vturbSales?.totalRevenue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
              </div>
              <div className={styles.vturbStat}>
                <span>Vendas</span>
                <strong>{Number(vturbSales?.totalSales || 0)}</strong>
              </div>
              <div className={styles.vturbStat}>
                <span>Aprovadas</span>
                <strong>{Number(vturbSales?.approvedSales || 0)}</strong>
              </div>
            </div>
            <p className={styles.vturbNote}>
              A integração VTurb atual é via webhook de vendas + embed ConverteAI no detalhe do criativo.
              Configure o webhook em Ajustes com o <code>utm_term</code> igual ao ID do anúncio Meta.
            </p>
            <Link href="/graficos/vturb" className={styles.linkBtn}>
              Ver gráficos VTurb completos
            </Link>
          </DashboardSection>
        </div>
      )}
    </div>
  );
}
