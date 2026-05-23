"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import styles from "./page.module.css";
import { apiFetch, getStoredOrganizationId } from "@/lib/hooko-session";
import MetaMetricsPanel, { formatBRL } from "@/components/MetaMetrics/MetaMetricsPanel";

const COLORS = {
  pix: "#1d4ed8",
  card: "#60a5fa",
  billet: "#fbbf24",
  other: "#4b5563",
  revenue: "#8b5cf6",
  spend: "#f43f5e",
  profit: "#10b981",
};

export default function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [sales, setSales] = useState(null);
  const [dateFilter, setDateFilter] = useState("today");

  useEffect(() => {
    async function loadRealData() {
      setLoading(true);
      try {
        const orgId = getStoredOrganizationId();
        if (!orgId) return;

        const periodParam = encodeURIComponent(dateFilter);
        const [overviewRes, salesRes] = await Promise.all([
          apiFetch(`/api/dashboard/overview?organizationId=${orgId}&period=${periodParam}`).catch(() => null),
          apiFetch(`/api/dashboard/external-sales/pagtrust?organizationId=${orgId}&period=${periodParam}`).catch(() => null),
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

  const paymentData = sales?.salesByPaymentMethod || [
    { name: "Pix", value: 0, color: COLORS.pix },
    { name: "Cartão", value: 0, color: COLORS.card },
    { name: "Boleto", value: 0, color: COLORS.billet },
    { name: "Outros", value: 0, color: COLORS.other },
  ];

  const hourlyRevenueData = (sales?.revenueByHour || sales?.profitByHour || []).map((h) => ({
    hora: h.hora,
    receita: h.valor > 0 ? h.valor : 0,
  }));

  const dailyMetaData = overview?.dailyMeta || [];

  const funnelData = useMemo(() => {
    const f = overview?.funnel || {
      impressions: 0,
      cliques: 0,
      pageViews: 0,
      initiateCheckouts: 0,
      addToCart: 0,
      purchases: 0,
    };
    const max = Math.max(1, f.impressions || f.cliques);
    return [
      { label: "Impressões", val: Math.round(((f.impressions || 0) / max) * 100), num: f.impressions || 0, color: "#2563eb" },
      { label: "Cliques", val: Math.round(((f.cliques || 0) / max) * 100), num: f.cliques || 0, color: "#3b82f6" },
      { label: "Vis. Página", val: Math.round(((f.pageViews || 0) / max) * 100), num: f.pageViews || 0, color: "#6366f1" },
      { label: "ICs", val: Math.round(((f.initiateCheckouts || 0) / max) * 100), num: f.initiateCheckouts || 0, color: "#8b5cf6" },
      { label: "Add Cart", val: Math.round(((f.addToCart || 0) / max) * 100), num: f.addToCart || 0, color: "#a855f7" },
      { label: "Compras", val: Math.round(((f.purchases || 0) / max) * 100), num: f.purchases || 0, color: "#ec4899" },
    ];
  }, [overview]);

  const rankingsData = useMemo(() => {
    const r = overview?.rankings || {};
    return {
      bestHook: r.bestHook || "Sem dados",
      bestRetention: r.bestRetention || "Sem dados",
      bestCtr: r.bestCtr || "Sem dados",
      bestCostIc: r.bestCostIc || "Sem dados",
      bestRoas: r.bestRoas || "Sem dados",
      bestSalesVolume: r.bestSalesVolume || "Sem dados",
      bestConversionRate: r.bestConversionRate || "Sem dados",
    };
  }, [overview]);

  if (loading) {
    return (
      <div className={styles.loadingContainer} style={{ padding: "2rem", color: "#fff" }}>
        <h2>Carregando dados da API...</h2>
        <p>Buscando estatísticas do Meta Ads e PagTrust.</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#0f111a", color: "#fff", minHeight: "100vh", padding: "2rem", fontFamily: "Inter, sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>Dashboard</h1>
          <p style={{ color: "#9ca3af", margin: "0.2rem 0 0 0" }}>
            Meta Ads (importados) + PagTrust
            {overview?.dateRange ? ` · ${overview.dateRange.since} → ${overview.dateRange.until}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ backgroundColor: "#1f2937", color: "#fff", padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid #374151" }}
          >
            <option value="today">Hoje</option>
            <option value="week">Últimos 7 dias</option>
            <option value="month">Últimos 30 dias</option>
          </select>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ backgroundColor: "#1e202e", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #2d3042" }}>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: "0 0 0.5rem 0" }}>Faturamento Líquido (PagTrust)</p>
          <h2 style={{ fontSize: "1.75rem", margin: 0, fontWeight: "bold" }}>{formatBRL(totalRevenue)}</h2>
        </div>
        <div style={{ backgroundColor: "#1e202e", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #2d3042" }}>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: "0 0 0.5rem 0" }}>Gastos com anúncios (Meta)</p>
          <h2 style={{ fontSize: "1.75rem", margin: 0, fontWeight: "bold" }}>{formatBRL(totalSpend)}</h2>
        </div>
        <div style={{ backgroundColor: "#1e202e", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #2d3042" }}>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: "0 0 0.5rem 0" }}>ROI (Receita / Gasto)</p>
          <h2 style={{ fontSize: "1.75rem", margin: 0, fontWeight: "bold", color: roi >= 1 ? "#10b981" : "#f43f5e" }}>{roi}x</h2>
          {metaRoas ? <p style={{ color: "#6b7280", fontSize: "0.75rem", margin: "0.35rem 0 0" }}>ROAS Meta: {metaRoas}</p> : null}
        </div>
        <div style={{ backgroundColor: "#1e202e", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #2d3042" }}>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: "0 0 0.5rem 0" }}>Lucro (Receita − Gasto Meta)</p>
          <h2 style={{ fontSize: "1.75rem", margin: 0, fontWeight: "bold", color: profit >= 0 ? "#10b981" : "#f43f5e" }}>{formatBRL(profit)}</h2>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ backgroundColor: "#1e202e", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #2d3042" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#e5e7eb" }}>Vendas por Pagamento</h3>
          <div style={{ height: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "0.5rem", color: "#fff" }} itemStyle={{ color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            {paymentData.map((p) => (
              <div key={p.name} style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: p.color }} />
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: "#6366f1", padding: "1.5rem", borderRadius: "0.75rem", backgroundImage: "linear-gradient(to right, #4f46e5, #6366f1)" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.25rem", color: "#fff", fontWeight: "bold" }}>Receitas PagTrust por hora</h3>
          <div style={{ height: "220px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyRevenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fff" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#fff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "none", borderRadius: "0.5rem", color: "#fff" }} formatter={(val) => formatBRL(val)} />
                <Area type="monotone" dataKey="receita" stroke="#fff" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: "#1e202e", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #2d3042", marginBottom: "1.5rem" }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#e5e7eb" }}>Investimento Meta por dia</h3>
        <div style={{ height: "280px" }}>
          {dailyMetaData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyMetaData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="label" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "0.5rem" }} formatter={(val) => formatBRL(val)} />
                <Bar dataKey="spend" name="Gasto" fill={COLORS.spend} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Sem dados de gasto Meta no período.</p>
          )}
        </div>
      </div>

      <div style={{ backgroundColor: "#1e202e", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #2d3042", marginBottom: "1.5rem" }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#e5e7eb" }}>Funil de Conversão (Meta Ads)</h3>
        <div style={{ height: "220px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "0.35rem", paddingTop: "1rem" }}>
          {funnelData.map((step, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", height: "100%", justifyContent: "flex-end" }}>
              <div style={{ fontSize: "0.65rem", color: "#9ca3af", marginBottom: "0.5rem", textAlign: "center" }}>{step.label}</div>
              <div style={{ width: "80%", height: `${Math.max(step.val, 4)}%`, backgroundColor: step.color, borderRadius: "4px 4px 0 0", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.7rem", fontWeight: "bold" }}>
                {step.val}%
              </div>
              <div style={{ marginTop: "0.5rem", fontWeight: "bold", color: "#e5e7eb", fontSize: "0.75rem" }}>{step.num.toLocaleString("pt-BR")}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ backgroundColor: "#1e202e", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #2d3042", marginBottom: "1.5rem" }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#e5e7eb" }}>Vendas PagTrust por horário</h3>
        <div style={{ height: "200px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyRevenueData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="hora" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "#2d3042" }} contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "0.5rem" }} formatter={(val) => formatBRL(val)} />
              <Bar dataKey="receita" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ backgroundColor: "#1e202e", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #2d3042", marginTop: "1.5rem" }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#e5e7eb" }}>Métricas Meta completas</h3>
        <MetaMetricsPanel
          delivery={overview?.delivery}
          videoMetrics={overview?.videoMetrics}
          videoRetention={overview?.videoRetention}
          videoPlayCurve={overview?.videoPlayCurve}
          creativeHealth={overview?.creativeHealth}
        />
      </div>

      <div style={{ backgroundColor: "#1e202e", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #2d3042", marginTop: "1.5rem", overflowY: "auto" }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#e5e7eb" }}>Destaques (Rankings — Meta Ads)</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <tbody>
            <tr style={{ borderBottom: "1px solid #374151" }}>
              <td style={{ padding: "0.75rem 0", color: "#9ca3af" }}>Melhor Gancho (3s / Impr.)</td>
              <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{rankingsData.bestHook}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #374151" }}>
              <td style={{ padding: "0.75rem 0", color: "#9ca3af" }}>Maior Retenção (75% / Plays)</td>
              <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{rankingsData.bestRetention}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #374151" }}>
              <td style={{ padding: "0.75rem 0", color: "#9ca3af" }}>Maior CTR (Cliques / Impr.)</td>
              <td style={{ textAlign: "right", fontWeight: "bold", color: "#3b82f6" }}>{rankingsData.bestCtr}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #374151" }}>
              <td style={{ padding: "0.75rem 0", color: "#9ca3af" }}>Menor Custo IC</td>
              <td style={{ textAlign: "right", fontWeight: "bold", color: "#a855f7" }}>{rankingsData.bestCostIc}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #374151" }}>
              <td style={{ padding: "0.75rem 0", color: "#9ca3af" }}>Maior ROAS (Meta)</td>
              <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{rankingsData.bestRoas}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #374151" }}>
              <td style={{ padding: "0.75rem 0", color: "#9ca3af" }}>Maior Volume de Compras</td>
              <td style={{ textAlign: "right", fontWeight: "bold", color: "#ec4899" }}>{rankingsData.bestSalesVolume}</td>
            </tr>
            <tr>
              <td style={{ padding: "0.75rem 0", color: "#9ca3af" }}>Maior Conversão (Compras / Views)</td>
              <td style={{ textAlign: "right", fontWeight: "bold", color: "#ec4899" }}>{rankingsData.bestConversionRate}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
