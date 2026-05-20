"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { AdminDashboardSkeleton } from "@/components/Skeleton/Skeleton.js";
import dash from "./adminDashboard.module.css";

const USE_MOCK = false;

const MOCK_METRICS = {
  mrrEuro: 12840,
  activeUsers: 1847,
  aiMinutesGlobal: 842,
};

/** Últimos 7 dias relativos — dados sintéticos. */
const MOCK_SIGNUPS_7D = [
  { label: "seg", day: "5", value: 14 },
  { label: "ter", day: "6", value: 22 },
  { label: "qua", day: "7", value: 18 },
  { label: "qui", day: "8", value: 31 },
  { label: "sex", day: "9", value: 27 },
  { label: "sáb", day: "10", value: 19 },
  { label: "dom", day: "11", value: 34 },
];

export default function AdminDashboardPage() {
  const [loaded, setLoaded] = useState(!USE_MOCK);
  const formatEur = useMemo(
    () => (n) =>
      `${Number(n).toLocaleString("pt-PT", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })} €`,
    [],
  );

  useEffect(() => {
    if (!USE_MOCK) return undefined;
    const t = window.setTimeout(() => setLoaded(true), 960);
    return () => window.clearTimeout(t);
  }, []);

  if (USE_MOCK && !loaded) {
    return (
      <div className={dash.page}>
        <header className={dash.header}>
          <p className={dash.kicker}>Admin</p>
          <h1 className={dash.title}>Visão Geral</h1>
          <p className={dash.lede}>A carregar indicadores…</p>
        </header>
        <AdminDashboardSkeleton />
      </div>
    );
  }

  return (
    <div className={dash.page}>
      <header className={dash.header}>
        <p className={dash.kicker}>Admin</p>
        <h1 className={dash.title}>Visão Geral</h1>
        <p className={dash.lede}>Métricas sintéticas (mock) para validar layout e hierarquia visual.</p>
      </header>

      <span className={dash.mockPill}>USE_MOCK = false</span>

      <div className={dash.gridKpi}>
        <article className={dash.kpi}>
          <div className={dash.kpiGlow} aria-hidden />
          <div className={dash.kpiInner}>
            <p className={dash.kpiMuted}>MRR estimado</p>
            <p className={dash.kpiStrong}>{formatEur(MOCK_METRICS.mrrEuro)}</p>
            <p className={dash.kpiSub}>Receita mensal estimada • catálogo + Stripe snapshot</p>
          </div>
        </article>
        <article className={dash.kpi}>
          <div className={dash.kpiGlow} aria-hidden />
          <div className={dash.kpiInner}>
            <p className={dash.kpiMuted}>Utilizadores activos</p>
            <p className={dash.kpiStrong}>{MOCK_METRICS.activeUsers.toLocaleString("pt-PT")}</p>
            <p className={dash.kpiSub}>Membership activa últimos 30 dias • mock</p>
          </div>
        </article>
        <article className={dash.kpi}>
          <div className={dash.kpiGlow} aria-hidden />
          <div className={dash.kpiInner}>
            <p className={dash.kpiMuted}>Custo IA estimado</p>
            <p className={dash.kpiStrong}>{MOCK_METRICS.aiMinutesGlobal.toLocaleString("pt-PT")} min</p>
            <p className={dash.kpiSub}>Minutos transcritos/processados • global demo</p>
          </div>
        </article>
      </div>

      <section className={dash.chartCard} aria-labelledby="chart-signups">
        <h2 id="chart-signups" className={dash.chartHead}>
          Novos cadastros nos últimos 7 dias
        </h2>
        <p className={dash.chartSub}>Barras em gradiente com brilho (dados sintéticos).</p>
        <div className={dash.chartFrame}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={MOCK_SIGNUPS_7D} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
              <defs>
                <linearGradient id="hookoBarPremium" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#6b5818" />
                  <stop offset="48%" stopColor="#c5a059" />
                  <stop offset="100%" stopColor="#f7e8a8" />
                </linearGradient>
                <filter id="barGlowAdmin" height="220%" width="220%" x="-60%" y="-60%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 12" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "rgba(212,175,55,0.88)", fontSize: 11, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                dy={6}
              />
              <YAxis tick={{ fill: "rgba(161,161,170,0.88)", fontSize: 11 }} axisLine={false} tickLine={false} width={38} />
              <Tooltip
                cursor={{ fill: "rgba(212,175,55,0.06)" }}
                contentStyle={{
                  background: "rgba(14,14,18,0.97)",
                  border: "1px solid rgba(212,175,55,0.35)",
                  borderRadius: "12px",
                  fontSize: "0.82rem",
                  color: "#fafafa",
                }}
                formatter={(v) => [`${v} registos`, "Novos cadastros"]}
                labelFormatter={(l) => `Dia ${l}`}
              />
              <Bar dataKey="value" radius={[8, 8, 3, 3]} stroke="rgba(255,255,255,0.12)" strokeWidth={1}>
                {MOCK_SIGNUPS_7D.map((_, i) => (
                  <Cell
                    key={i}
                    fill="url(#hookoBarPremium)"
                    style={{ filter: i % 2 === 0 ? "url(#barGlowAdmin)" : undefined }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
