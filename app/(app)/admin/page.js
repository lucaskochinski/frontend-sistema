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
import { apiFetch } from "@/lib/hooko-session";
import { AdminDashboardSkeleton } from "@/components/Skeleton/Skeleton.js";
import dash from "./adminDashboard.module.css";

function formatBrlFromCents(cents) {
  const n = Number(cents || 0);
  if (!Number.isFinite(n)) return "R$ 0";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n / 100);
}

function pickUsageMinutes(usageRows) {
  if (!Array.isArray(usageRows)) return 0;
  const keys = ["transcription_minutes", "ai_minutes", "video_transcription_minutes"];
  for (const k of keys) {
    const row = usageRows.find((r) => r.metricKey === k);
    if (row) return Number(row.total) || 0;
  }
  const first = usageRows[0];
  return first ? Number(first.total) || 0 : 0;
}

export default function AdminDashboardPage() {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState("");
  const [metrics, setMetrics] = useState(null);
  const [finance, setFinance] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [metricsRes, financeRes] = await Promise.all([
          apiFetch("/api/admin/metrics/overview"),
          apiFetch("/api/admin/finance/summary").catch(() => null),
        ]);
        if (cancelled) return;
        setMetrics(metricsRes);
        setFinance(financeRes);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Erro ao carregar métricas");
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signups = metrics?.signupsLast7Days ?? [];
  const activeSubs = useMemo(() => {
    const rows = finance?.subscriptionsByStatus ?? [];
    const active = rows.find((r) => String(r.status).toLowerCase() === "active");
    return active ? Number(active.count) || 0 : 0;
  }, [finance]);

  if (!loaded) {
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
        <p className={dash.lede}>Métricas em tempo real da plataforma HOOKO.</p>
      </header>

      {err ? <p className={dash.err}>{err}</p> : null}

      <div className={dash.gridKpi}>
        <article className={dash.kpi}>
          <div className={dash.kpiGlow} aria-hidden />
          <div className={dash.kpiInner}>
            <p className={dash.kpiMuted}>Organizações</p>
            <p className={dash.kpiStrong}>{Number(metrics?.organizations || 0).toLocaleString("pt-BR")}</p>
            <p className={dash.kpiSub}>Tenants registados na plataforma</p>
          </div>
        </article>
        <article className={dash.kpi}>
          <div className={dash.kpiGlow} aria-hidden />
          <div className={dash.kpiInner}>
            <p className={dash.kpiMuted}>Memberships activas</p>
            <p className={dash.kpiStrong}>{Number(metrics?.activeMemberships || 0).toLocaleString("pt-BR")}</p>
            <p className={dash.kpiSub}>
              {activeSubs > 0 ? `${activeSubs} assinaturas Stripe activas` : "Utilizadores com acesso activo"}
            </p>
          </div>
        </article>
        <article className={dash.kpi}>
          <div className={dash.kpiGlow} aria-hidden />
          <div className={dash.kpiInner}>
            <p className={dash.kpiMuted}>Análises IA</p>
            <p className={dash.kpiStrong}>{Number(metrics?.creativeAnalysesTotal || 0).toLocaleString("pt-BR")}</p>
            <p className={dash.kpiSub}>
              {pickUsageMinutes(metrics?.usageCountersByMetric).toLocaleString("pt-BR")} min de uso registados
            </p>
          </div>
        </article>
        <article className={dash.kpi}>
          <div className={dash.kpiGlow} aria-hidden />
          <div className={dash.kpiInner}>
            <p className={dash.kpiMuted}>Faturas em aberto</p>
            <p className={dash.kpiStrong}>{formatBrlFromCents(finance?.invoicesOpenAmountDueCents)}</p>
            <p className={dash.kpiSub}>Valor pendente (open / draft / uncollectible)</p>
          </div>
        </article>
      </div>

      <section className={dash.chartCard} aria-labelledby="chart-signups">
        <h2 id="chart-signups" className={dash.chartHead}>
          Novos utilizadores — últimos 7 dias
        </h2>
        <p className={dash.chartSub}>Cadastros reais via `users.created_at`.</p>
        <div className={dash.chartFrame}>
          {signups.length === 0 ? (
            <p className={dash.chartEmpty}>Sem cadastros no período.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={signups} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
                <defs>
                  <linearGradient id="hookoBarPremium" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#6b5818" />
                    <stop offset="48%" stopColor="#c5a059" />
                    <stop offset="100%" stopColor="#f7e8a8" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 12" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "rgba(212,175,55,0.88)", fontSize: 11, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  dy={6}
                />
                <YAxis tick={{ fill: "rgba(161,161,170,0.88)", fontSize: 11 }} axisLine={false} tickLine={false} width={38} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "rgba(212,175,55,0.06)" }}
                  contentStyle={{
                    background: "rgba(14,14,18,0.97)",
                    border: "1px solid rgba(212,175,55,0.35)",
                    borderRadius: "12px",
                    fontSize: "0.82rem",
                    color: "#fafafa",
                  }}
                  formatter={(v) => [`${v} registos`, "Novos utilizadores"]}
                  labelFormatter={(l) => String(l)}
                />
                <Bar dataKey="value" radius={[8, 8, 3, 3]} stroke="rgba(255,255,255,0.12)" strokeWidth={1}>
                  {signups.map((_, i) => (
                    <Cell key={i} fill="url(#hookoBarPremium)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}
